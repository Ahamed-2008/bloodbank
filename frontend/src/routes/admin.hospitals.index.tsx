import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { StatusBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";
import { formatDate, titleCase } from "@/lib/format";
import type { AdminHospital, VerificationStatus } from "@/lib/types";

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

function getEffectiveStatus(h: AdminHospital): VerificationStatus {
  if (h.is_verified) return "Approved";
  const primaryStatus = h.hospital_verifications?.[0]?.status;
  if (primaryStatus) return primaryStatus;
  return "Pending";
}

function HospitalsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: ["admin", "hospitals"],
    queryFn: () => adminService.getHospitals(),
  });

  const hospitals = q.data ?? [];

  const counts = useMemo(() => {
    return {
      all: hospitals.length,
      pending: hospitals.filter((h) => {
        const s = getEffectiveStatus(h).toLowerCase();
        return s === "pending";
      }).length,
      approved: hospitals.filter((h) => {
        const s = getEffectiveStatus(h).toLowerCase();
        return s === "approved" || s === "verified";
      }).length,
      rejected: hospitals.filter((h) => {
        const s = getEffectiveStatus(h).toLowerCase();
        return s === "rejected";
      }).length,
    };
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    const term = search.trim().toLowerCase();
    return hospitals.filter((h) => {
      const status = getEffectiveStatus(h).toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && status === "pending") ||
        (filter === "approved" && (status === "approved" || status === "verified")) ||
        (filter === "rejected" && status === "rejected");

      if (!matchesFilter) return false;

      if (!term) return true;
      return (
        h.name.toLowerCase().includes(term) ||
        h.city.toLowerCase().includes(term) ||
        h.registration_number.toLowerCase().includes(term)
      );
    });
  }, [hospitals, filter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospitals"
        description="Verify licences and credentials before hospitals can raise blood alerts."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Search name, city, reg #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search hospitals"
          />
        </div>
      </div>

      {q.isPending ? (
        <LoadingState rows={3} />
      ) : q.isError ? (
        <ErrorState
          message={(q.error as Error)?.message || "Failed to load hospitals"}
          onRetry={() => void q.refetch()}
        />
      ) : filteredHospitals.length === 0 ? (
        <EmptyState
          title="No hospitals found"
          description={
            search
              ? "No hospital matches your search criteria."
              : "No hospital applications match this status filter."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Reg / Licence</TableHead>
                <TableHead className="hidden lg:table-cell">Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHospitals.map((h) => {
                const effectiveStatus = getEffectiveStatus(h);
                const isPending = effectiveStatus.toLowerCase() === "pending";
                const licence = h.hospital_verifications?.[0]?.license_number;

                return (
                  <TableRow key={h.hospital_id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.city}, {h.state}
                      </p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {titleCase(h.hospital_type)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-xs font-mono">{h.registration_number}</p>
                      {licence ? (
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Lic: {licence}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {h.created_at ? formatDate(h.created_at) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={effectiveStatus} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant={isPending ? "default" : "outline"}
                      >
                        <Link
                          to="/admin/hospitals/$hospitalId"
                          params={{ hospitalId: h.hospital_id }}
                        >
                          {isPending ? "Review" : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
