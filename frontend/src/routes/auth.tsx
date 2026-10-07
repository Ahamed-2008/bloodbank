import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brand } from "@/components/layout/brand";
import { ROLE_HOME, useAuth } from "@/lib/auth-context";
import { MOCK_OTP, authService } from "@/services/auth-service";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to BloodLink" },
      {
        name: "description",
        content:
          "Sign in to BloodLink with your mobile number to respond to blood requests, manage hospital alerts, or review verifications.",
      },
      { property: "og:title", content: "Sign in to BloodLink" },
      { property: "og:description", content: "Mobile number sign-in for donors and hospitals." },
    ],
  }),
  component: AuthPage,
});

const ROLE_TABS: { value: Role; label: string; hint: string }[] = [
  { value: "donor", label: "Donor", hint: "Respond to nearby blood requests." },
  { value: "hospital_staff", label: "Hospital", hint: "Raise requests and confirm donations." },
  { value: "admin", label: "Admin", hint: "Verify hospitals and monitor the network." },
];

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, user, isLoading } = useAuth();

  const [role, setRole] = useState<Role>("donor");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) void navigate({ to: ROLE_HOME[user.role], replace: true });
  }, [isLoading, user, navigate]);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      await authService.requestOtp(phone);
      setStep("otp");
      toast.success("Verification code sent", { description: `Demo code: ${MOCK_OTP}` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      const nextUser = await authService.verifyOtp(phone, otp.trim(), role);
      signIn(nextUser);
      toast.success(`Welcome back, ${nextUser.name.split(" ")[0]}`);
      void navigate({ to: ROLE_HOME[nextUser.role], replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code.");
    } finally {
      setBusy(false);
    }
  }

  const activeRole = ROLE_TABS.find((tab) => tab.value === role)!;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-surface hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <Brand />
        <div>
          <h1 className="max-w-md text-3xl font-extrabold">
            Every minute counts when blood is needed.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Sign in to see requests near you, or to coordinate your hospital's blood needs with
            donors who can actually reach you in time.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Only verified hospitals can raise requests
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Demo interface with sample data. No real medical records are stored.
        </p>
      </div>

      <div className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <Brand />
          </div>

          <h2 className="mt-8 text-2xl font-bold lg:mt-0">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll text a one-time code to your mobile number.
          </p>

          <Tabs
            value={role}
            onValueChange={(value) => {
              setRole(value as Role);
              setStep("phone");
              setOtp("");
              setError(null);
            }}
            className="mt-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              {ROLE_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <p className="mt-2 text-xs text-muted-foreground">{activeRole.hint}</p>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="mt-6 space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98450 21188"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "auth-error" : undefined}
                />
              </div>
              {error ? (
                <p id="auth-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Send code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
                Change number
              </button>
              <div className="space-y-2">
                <Label htmlFor="otp">6-digit code sent to {phone}</Label>
                <Input
                  id="otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "otp-error" : "otp-hint"}
                  className="tracking-[0.4em]"
                />
                <p id="otp-hint" className="text-xs text-muted-foreground">
                  Use {MOCK_OTP} for this demo.
                </p>
              </div>
              {error ? (
                <p id="otp-error" role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Verify and continue
              </Button>
            </form>
          )}

          <p className="mt-8 text-sm text-muted-foreground">
            Representing a hospital that isn't registered yet?{" "}
            <Link to="/register-hospital" className="font-semibold text-primary hover:underline">
              Apply here
            </Link>
            .
          </p>
          <p className="mt-3 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
