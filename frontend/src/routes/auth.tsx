import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Brand } from "@/components/layout/brand";
import { ROLE_HOME, useAuth } from "@/lib/auth-context";
import { DEMO_ACCOUNTS, authService, decodeJwt } from "@/services/auth-service";
import { formatApiError } from "@/services/api-client";
import { donorService } from "@/services/donor-service";
import { hospitalService } from "@/services/hospital-service";
import type { AuthUser, Role } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to BloodLink" },
      {
        name: "description",
        content:
          "Sign in to BloodLink with demo credentials or a Firebase ID token to respond to blood requests, manage hospital alerts, or review verifications.",
      },
      { property: "og:title", content: "Sign in to BloodLink" },
      { property: "og:description", content: "Mobile and demo sign-in for donors and hospitals." },
    ],
  }),
  component: AuthPage,
});

type AuthMode = "demo" | "firebase";

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, user, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthMode>("demo");
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [phone, setPhone] = useState(DEMO_ACCOUNTS[0].phone);
  const [otp, setOtp] = useState(DEMO_ACCOUNTS[0].otp);
  const [firebaseToken, setFirebaseToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      void navigate({ to: ROLE_HOME[user.role], replace: true });
    }
  }, [isLoading, user, navigate]);

  function selectDemoAccount(index: number) {
    setSelectedDemoIndex(index);
    const acc = DEMO_ACCOUNTS[index];
    setPhone(acc.phone);
    setOtp(acc.otp);
    setError(null);
  }

  async function handleDemoSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    if (!cleanPhone) {
      setError("Please enter a phone number.");
      return;
    }
    if (!cleanOtp) {
      setError("Please enter the OTP.");
      return;
    }

    setBusy(true);
    try {
      const result = await authService.signInWithDemo(cleanPhone, cleanOtp);
      await finishSignIn(result.token, result.role, result.isNewUser);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleFirebaseSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const token = firebaseToken.trim();
    if (!token) {
      setError("Please enter or paste a valid Firebase ID token.");
      return;
    }

    setBusy(true);
    try {
      const result = await authService.signInWithFirebase(token);
      await finishSignIn(result.token, result.role, result.isNewUser);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function finishSignIn(token: string, role: Role, isNewUser: boolean) {
    const decoded = decodeJwt(token);
    let displayName = decoded?.phone || (role === "admin" ? "Platform Admin" : "User");
    let hospitalName: string | undefined = undefined;

    // Tentatively record token so subsequent profile call is authenticated
    signIn(
      {
        id: decoded?.sub || "user",
        name: displayName,
        phone: decoded?.phone || phone,
        role,
        isNewUser,
      },
      token,
    );

    // Fetch rich name if available
    try {
      if (role === "donor") {
        const profile = await donorService.getProfile();
        if (profile.name && profile.name.trim()) {
          displayName = profile.name.trim();
        }
      } else if (role === "hospital_staff") {
        const hospital = await hospitalService.getProfile();
        if (hospital.name) {
          hospitalName = hospital.name;
          displayName = hospital.contact_name || hospital.name;
        }
      }
    } catch {
      // Continue with token payload display name if profile lookup fails
    }

    const authUser: AuthUser = {
      id: decoded?.sub || "user",
      name: displayName,
      phone: decoded?.phone || phone,
      role,
      hospitalName,
      isNewUser,
    };

    signIn(authUser, token);
    toast.success(`Welcome, ${displayName.split(" ")[0] || "User"}!`);
    void navigate({ to: ROLE_HOME[role], replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-surface hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <Brand />
        <div>
          <h1 className="max-w-md text-3xl font-extrabold">
            Every minute counts when blood is needed.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Sign in to respond to blood requests near you, coordinate your hospital's blood needs,
            or manage network verifications.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Role-enforced verification and security
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Connected to BloodConnect REST API on localhost:3000
        </p>
      </div>

      <div className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <Brand />
          </div>

          <h2 className="mt-8 text-2xl font-bold lg:mt-0">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in using seeded demo accounts or Firebase ID token.
          </p>

          <Tabs
            value={mode}
            onValueChange={(val) => {
              setMode(val as AuthMode);
              setError(null);
            }}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="demo">Demo Accounts</TabsTrigger>
              <TabsTrigger value="firebase">Firebase ID Token</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === "demo" ? (
            <div className="mt-6 space-y-6">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">
                  Select a demo account
                </Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc, index) => {
                    const isSelected = selectedDemoIndex === index;
                    return (
                      <button
                        key={acc.phone}
                        type="button"
                        onClick={() => selectDemoAccount(index)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card hover:border-muted-foreground/30"
                        }`}
                      >
                        <span className="text-xs font-semibold">{acc.label}</span>
                        <span className="mt-1 font-mono text-[11px] text-muted-foreground">
                          {acc.phone}
                        </span>
                        <span className="mt-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                          {acc.role.replace("_", " ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleDemoSignIn} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919999900001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">Fixed demo OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="111111"
                    maxLength={6}
                    className="tracking-[0.3em]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Donor: 111111 · Hospital: 222222 · Admin: 333333
                  </p>
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                  >
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Sign in as {DEMO_ACCOUNTS[selectedDemoIndex]?.label ?? "Demo User"}
                </Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleFirebaseSignIn} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="firebase-token">Firebase ID Token</Label>
                <Textarea
                  id="firebase-token"
                  rows={4}
                  placeholder="Paste Firebase ID token (JWT) containing verified phone number..."
                  value={firebaseToken}
                  onChange={(e) => setFirebaseToken(e.target.value)}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  The backend verifies this token with Firebase Admin SDK and issues an application JWT.
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Verify & Sign in
              </Button>
            </form>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              New hospital looking to join?{" "}
              <Link to="/register-hospital" className="font-semibold text-primary hover:underline">
                Register hospital
              </Link>
            </p>
            <p className="mt-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                ← Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
