import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatusBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";
import { formatDate, titleCase } from "@/lib/format";

export const Route = createFileRoute("/admin/hospitals/")({
  head: () => ({
    meta: [
      { title: "Hospital verification — BloodLink" },
      { name: "description", content: "Review hospital applications and filter by verification status." },
      { property: "og:title", content: "Hospital verification — BloodLink" },
      { property: "og:description", content: "Approve or reject hospital applications." },
    ],
  }),
  component: HospitalsPage,
});

function HospitalsPage() {
  const q = useQuery({ queryKey: ["admin", "hospitals"], queryFn: adminService.getHospitals });
  const [filter, setFilter] = useState("all");
  const rows = (q.data ?? []).filter((h) => filter === "all" || h.verificationStatus === filter);
  const count = (s: string) => (q.data ?? []).filter((h) => h.verificationStatus === s).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Hospitals" description="Verify licences before hospitals can raise blood alerts." />
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending ({count("pending")})</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      {q.isPending ? <LoadingState /> : q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : rows.length === 0 ? (
        <EmptyState title="No hospitals here" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader><TableRow><TableHead>Hospital</TableHead><TableHead className="hidden md:table-cell">Type</TableHead><TableHead className="hidden lg:table-cell">Applied</TableHead><TableHead>Status</TableHead><TableHead className="text-right"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((h) => (
                <TableRow key={h.id}>
                  <TableCell><p className="font-medium">{h.name}</p><p className="text-xs text-muted-foreground">{h.city}, {h.state}</p></TableCell>
                  <TableCell className="hidden md:table-cell">{titleCase(h.type)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(h.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={h.verificationStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant={h.verificationStatus === "pending" ? "default" : "outline"}>
                      <Link to="/admin/hospitals/$hospitalId" params={{ hospitalId: h.id }}>{h.verificationStatus === "pending" ? "Review" : "View"}</Link>
                    </Button>
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
