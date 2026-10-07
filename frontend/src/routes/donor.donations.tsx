import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/donor/donations")({
  head: () => ({
    meta: [
      { title: "Donation history — BloodLink" },
      { name: "description", content: "Every blood donation you've made through BloodLink, with hospital, date and status." },
      { property: "og:title", content: "Donation history — BloodLink" },
      { property: "og:description", content: "Your past blood donations." },
    ],
  }),
  component: DonationsPage,
});

function DonationsPage() {
  const q = useQuery({ queryKey: ["donor", "donations"], queryFn: donorService.getDonations });
  return (
    <div className="space-y-6">
      <PageHeader title="Donation history" description="All donations recorded by hospitals on BloodLink." />
      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="No donations yet" description="Your first confirmed donation will appear here." icon={<ClipboardList className="size-6" aria-hidden />} />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="hidden sm:table-cell">Units</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="font-medium">{d.hospitalName}</p>
                    <p className="text-xs text-muted-foreground">{d.city}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(d.date)}</TableCell>
                  <TableCell><BloodGroupBadge group={d.bloodGroup} size="sm" /></TableCell>
                  <TableCell className="hidden sm:table-cell">{d.units}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
