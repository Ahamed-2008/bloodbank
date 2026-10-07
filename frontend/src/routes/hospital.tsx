import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Building2, LayoutDashboard, ListChecks, PlusCircle, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

export const Route = createFileRoute("/hospital")({
  component: HospitalLayout,
});

const NAV: NavItem[] = [
  { to: "/hospital", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/hospital/alerts/new", label: "Create alert", icon: PlusCircle },
  { to: "/hospital/alerts", label: "My alerts", icon: ListChecks, exact: true },
  { to: "/hospital/profile", label: "Hospital profile", icon: Building2 },
  { to: "/hospital/staff", label: "Staff", icon: Users },
];

function HospitalLayout() {
  return (
    <AppShell role="hospital_staff" roleLabel="Hospital staff" items={NAV}>
      <Outlet />
    </AppShell>
  );
}
