import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge, UrgencyBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/admin/alerts")({
  head: () => ({
    meta: [
      { title: "Active blood alerts — BloodLink admin" },
      { name: "description", content: "Every open blood request across the BloodLink network with hospital and urgency." },
      { property: "og:title", content: "Active blood alerts — BloodLink admin" },
      { property: "og:description", content: "Open blood requests across the network." },
    ],
  }),
  component: AdminAlertsPage,
});

const ORDER = { critical: 0, urgent: 1, routine: 2 } as const;

function AdminAlertsPage() {
  const q = useQuery({ queryKey: ["admin", "alerts"], queryFn: adminService.getActiveAlerts });
  return (
    <div className="space-y-6">
      <PageHeader title="Active alerts" description="Open requests across all hospitals, most urgent first." />
      {q.isPending ? <LoadingState /> : q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : q.data.length === 0 ? (
        <EmptyState title="No active alerts" description="All requests are currently fulfilled." icon={<BellRing className="size-6" aria-hidden />} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader><TableRow><TableHead>Group</TableHead><TableHead>Hospital</TableHead><TableHead>Urgency</TableHead><TableHead className="hidden md:table-cell">Units</TableHead><TableHead className="hidden lg:table-cell">Needed by</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...q.data].sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]).map((a) => (
                <TableRow key={a.id}>
                  <TableCell><BloodGroupBadge group={a.bloodGroup} size="sm" /></TableCell>
                  <TableCell><p className="font-medium">{a.hospitalName}</p><p className="text-xs text-muted-foreground">{a.city}</p></TableCell>
                  <TableCell><UrgencyBadge urgency={a.urgency} /></TableCell>
                  <TableCell className="hidden md:table-cell tabular-nums">{a.unitsFulfilled}/{a.unitsRequired}</TableCell>
                  <TableCell className="hidden lg:table-cell whitespace-nowrap">{formatDateTime(a.neededBy)}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
