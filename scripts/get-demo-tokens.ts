import { config as loadEnv } from 'dotenv';
import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadEnv({ path: '.env' });

type Role = 'donor' | 'hospital_staff' | 'admin';
type UserKey = 'donor_a' | 'donor_b' | 'hospital' | 'admin';
const DEMO: Record<UserKey, { env: string; expected: Role; label: string }> = {
  donor_a: { env: 'DEMO_PHONE_DONOR_A', expected: 'donor', label: 'donor_a' },
  donor_b: { env: 'DEMO_PHONE_DONOR_B', expected: 'donor', label: 'donor_b' },
  hospital: { env: 'DEMO_PHONE_HOSPITAL', expected: 'hospital_staff', label: 'hospital' },
  admin: { env: 'DEMO_PHONE_ADMIN', expected: 'admin', label: 'admin' },
};

const fail = (step: string, msg: string): never => { throw new Error(`${step}: ${msg}`); };
const need = (name: string, step: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(step, `Missing ${name}.`);
  }
  return value as string;
};
const optional = (name: string): string | undefined => process.env[name]?.trim() || undefined;
const short = (value: string): string => value ? value.slice(0, 12) : 'missing';

const initFirebase = (): admin.app.App => {
  if (admin.apps.length > 0) {
    const app = admin.apps[0];
    if (app) return app;
  }
  const gcp = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gcp) {
    return admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(readFileSync(resolve(process.cwd(), gcp), 'utf8')) as Record<string, unknown>),
    });
  }
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    const parsed = (() => {
      try { return JSON.parse(key) as Record<string, unknown>; }
      catch { return JSON.parse(Buffer.from(key, 'base64').toString('utf8')) as Record<string, unknown>; }
    })();
    return admin.initializeApp({ credential: admin.credential.cert(parsed) });
  }
  throw new Error('Step 1: Missing GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY.');
};

const signInWithCustomToken = async (apiKey: string, token: string): Promise<string> => {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, returnSecureToken: true }),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof data.idToken !== 'string' || !data.idToken) fail('Step 5', 'Failed to exchange custom token for Firebase ID token.');
  return data.idToken as string;
};

const callBackendAuth = async (baseUrl: string, idToken: string): Promise<{ token: string; role: string }> => {
  const res = await fetch(`${baseUrl}/api/v1/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok || typeof data.token !== 'string' || !data.token) fail('Step 6', `Backend auth request failed with HTTP ${res.status}.`);
  return { token: data.token as string, role: String(data.role ?? 'unknown') };
};

const decodeJwt = (jwt: string): Record<string, unknown> => {
  const parts = jwt.split('.');
  if (parts.length < 2) fail('Step 9', 'JWT payload could not be decoded.');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as Record<string, unknown>;
};

const main = async (): Promise<void> => {
  // 1) Load env and init Firebase
  const firebaseApiKey = need('FIREBASE_WEB_API_KEY', 'Step 1');
  const supabaseUrl = need('SUPABASE_URL', 'Step 1');
  const supabaseKey = need('SUPABASE_SERVICE_ROLE_KEY', 'Step 1');
  const baseUrl = process.env.DEMO_BASE_URL?.trim() || 'http://localhost:3000';
  const app = initFirebase();
  const auth = app.auth();
  const supabase = createClient(supabaseUrl, supabaseKey);

  const phones = new Map<UserKey, string>();
  const customTokens = new Map<UserKey, string>();
  const firebaseIds = new Map<UserKey, string>();
  const appTokens = new Map<UserKey, string>();
  const rows: Array<{ user: string; role: string; expiry: string; status: 'PASS' | 'FAIL' }> = [];

  // 2) Read demo phone numbers
  const hospitalPhone = optional('DEMO_PHONE_HOSPITAL') ?? optional('DEMO_PHONE_ADMIN');
  const fallbackAdminPhone = optional('DEMO_PHONE_ADMIN') ?? hospitalPhone;
  if (hospitalPhone) process.env.DEMO_PHONE_HOSPITAL = hospitalPhone;
  if (fallbackAdminPhone) process.env.DEMO_PHONE_ADMIN = fallbackAdminPhone;

  for (const [key, meta] of Object.entries(DEMO) as [UserKey, { env: string; expected: Role; label: string }][]) {
    const value = optional(meta.env) ?? (meta.env === 'DEMO_PHONE_ADMIN' ? fallbackAdminPhone : undefined) ?? (meta.env === 'DEMO_PHONE_HOSPITAL' ? hospitalPhone : undefined);
    if (!value) {
      fail('Step 2', `Missing ${meta.env}.`);
    }
    phones.set(key, value as string);
  }

  if (phones.get('hospital') === phones.get('admin')) {
    console.warn('Warning: hospital and admin demo numbers are the same. This will return the admin role for the shared phone number.');
  }

  // 3) Verify Firebase user existence
  for (const [key, meta] of Object.entries(DEMO) as [UserKey, { env: string; expected: Role; label: string }][]) {
    const phone = phones.get(key) as string;
    let user;
    try { user = await auth.getUserByPhoneNumber(phone); }
    catch { fail('Step 3', `No Firebase user for ${meta.label}. Sign in once with this number through the browser login page, then re-run.`); }
    customTokens.set(key, await auth.createCustomToken(user.uid, { phone_number: phone }));
  }

  // 4) Exchange custom token for Firebase ID token
  for (const key of Object.keys(DEMO) as UserKey[]) {
    firebaseIds.set(key, await signInWithCustomToken(firebaseApiKey, customTokens.get(key) as string));
  }

  // 5) Exchange Firebase ID token for backend app JWTs
  for (const key of Object.keys(DEMO) as UserKey[]) {
    const result = await callBackendAuth(baseUrl, firebaseIds.get(key) as string);
    appTokens.set(key, result.token);
  }

  // 6) Insert admin row idempotently
  const adminPhoneRow = phones.get('admin') as string;
  const existing = await supabase.from('admins').select('admin_id').eq('phone', adminPhoneRow).maybeSingle();
  if (existing.error && existing.error.code !== 'PGRST116') fail('Step 7', `Failed checking admins row: ${existing.error.message}`);
  if (!existing.data) {
    const insert = await supabase.from('admins').insert({ phone: adminPhoneRow, role: 'admin', is_active: true });
    if (insert.error) fail('Step 7', `Failed inserting admin row: ${insert.error.message}`);
  }

  // 7) Refresh only the admin JWT
  const refreshedAdmin = await callBackendAuth(baseUrl, firebaseIds.get('admin') as string);
  appTokens.set('admin', refreshedAdmin.token);
  console.log('hospital_jwt is the pre-registration token. After POST /hospitals/register, re-run the hospital auth request in Postman to get a token with the hospital_staff role.');

  // 8) Decode JWTs and validate roles
  for (const key of Object.keys(DEMO) as UserKey[]) {
    const jwt = appTokens.get(key) as string;
    const payload = decodeJwt(jwt);
    const exp = Number(payload.exp ?? 0);
    const role = String(payload.role ?? payload.admin_role ?? payload.staff_role ?? 'unknown');
    const expected = DEMO[key].expected;
    const status: 'PASS' | 'FAIL' = role === expected ? 'PASS' : 'FAIL';
    rows.push({ user: DEMO[key].label, role, expiry: Number.isFinite(exp) ? new Date(exp * 1000).toLocaleString() : 'unknown', status });
  }

  // 9) Write Postman environment file
  const envPath = resolve(process.cwd(), 'postman/demo.postman_environment.json');
  mkdirSync(resolve(process.cwd(), 'postman'), { recursive: true });
  writeFileSync(envPath, JSON.stringify({
    name: 'demo',
    values: [
      { key: 'base_url', value: baseUrl, enabled: true },
      { key: 'donor_a_jwt', value: appTokens.get('donor_a') ?? '', enabled: true },
      { key: 'donor_b_jwt', value: appTokens.get('donor_b') ?? '', enabled: true },
      { key: 'hospital_jwt', value: appTokens.get('hospital') ?? '', enabled: true },
      { key: 'admin_jwt', value: appTokens.get('admin') ?? '', enabled: true },
      { key: 'hospital_id', value: '', enabled: true },
      { key: 'alert_id', value: '', enabled: true },
      { key: 'donation_id', value: '', enabled: true },
    ],
    _postman_variable_scope: 'environment',
    _postman_exported_at: new Date().toISOString(),
    _postman_exported_using: 'demo-token-script',
  }, null, 2));

  // 10) Print summary table
  console.table(rows.map((row) => ({ user: row.user, role: row.role, expiry: row.expiry, status: row.status })));
  console.log('JWT previews:', {
    donor_a: short(appTokens.get('donor_a') ?? ''),
    donor_b: short(appTokens.get('donor_b') ?? ''),
    hospital: short(appTokens.get('hospital') ?? ''),
    admin: short(appTokens.get('admin') ?? ''),
  });
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
