import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ClipboardList } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge } from "@/components/common/badges";
import { donorService } from "@/services/donor-service";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/donor/donations")({
  head: () => ({
    meta: [
      { title: "Donation history — BloodLink" },
      {
        name: "description",
        content: "Every blood donation you've made through BloodLink, with hospital, date and status.",
      },
      { property: "og:title", content: "Donation history — BloodLink" },
      { property: "og:description", content: "Your past blood donations." },
    ],
  }),
  component: DonationsPage,
});

function DonationsPage() {
  const query = useQuery({
    queryKey: ["donor", "donations"],
    queryFn: donorService.getDonations,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donation history"
        description="All past blood requests you responded to and completed donations."
      />
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No donations recorded yet"
          description="Your accepted and confirmed blood donations will appear here."
          icon={<ClipboardList className="size-6" aria-hidden />}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Accepted on</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
                <TableHead className="hidden md:table-cell">Points</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((d) => (
                <TableRow key={d.response_id}>
                  <TableCell>
                    <p className="font-medium">{d.alerts?.hospitals?.name ?? "Hospital"}</p>
                    <p className="text-xs text-muted-foreground">{d.alerts?.hospitals?.city ?? ""}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(d.accepted_at)}
                  </TableCell>
                  <TableCell>
                    <BloodGroupBadge group={d.alerts?.blood_group ?? "O+"} size="sm" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {d.alerts?.department ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {d.points_awarded ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Award className="size-3.5" /> +{d.points_awarded}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={d.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
