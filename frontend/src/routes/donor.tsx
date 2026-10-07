import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BellRing,
  ClipboardList,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  Settings,
  UserRound,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

export const Route = createFileRoute("/donor")({
  component: DonorLayout,
});

const NAV: NavItem[] = [
  { to: "/donor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/donor/alerts", label: "Blood alerts", icon: BellRing },
  { to: "/donor/donations", label: "Donations", icon: ClipboardList },
  { to: "/donor/statistics", label: "Statistics", icon: Gauge },
  { to: "/donor/eligibility", label: "Eligibility", icon: HeartPulse },
  { to: "/donor/profile", label: "Profile", icon: UserRound },
  { to: "/donor/location", label: "Location", icon: MapPin },
  { to: "/donor/settings", label: "Settings", icon: Settings },
];

function DonorLayout() {
  return (
    <AppShell role="donor" roleLabel="Donor" items={NAV}>
      <Outlet />
    </AppShell>
  );
}
