import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BellRing, Building2, LayoutDashboard, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/admin/donors", label: "Donors", icon: Users },
  { to: "/admin/alerts", label: "Alerts", icon: BellRing },
];

function AdminLayout() {
  return (
    <AppShell role="admin" roleLabel="Platform admin" items={NAV}>
      <Outlet />
    </AppShell>
  );
}
