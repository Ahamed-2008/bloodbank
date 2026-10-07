import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, LoadingState, EmptyState, ErrorState } from "@/components/common/state";
import { BloodGroupBadge, StatusBadge } from "@/components/common/badges";
import { adminService } from "@/services/admin-service";
import { BLOOD_GROUPS } from "@/lib/types";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/donors")({
  head: () => ({
    meta: [
      { title: "Donor management — BloodLink" },
      { name: "description", content: "Search and filter registered blood donors by name, city, blood group and eligibility." },
      { property: "og:title", content: "Donor management — BloodLink" },
      { property: "og:description", content: "All registered donors on BloodLink." },
    ],
  }),
  component: DonorsPage,
});

function DonorsPage() {
  const q = useQuery({ queryKey: ["admin", "donors"], queryFn: adminService.getDonors });
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [elig, setElig] = useState("all");
  const term = search.trim().toLowerCase();
  const rows = (q.data ?? []).filter(
    (d) =>
      (!term || d.name.toLowerCase().includes(term) || d.city.toLowerCase().includes(term) || d.phone.includes(term)) &&
      (group === "all" || d.bloodGroup === group) &&
      (elig === "all" || (elig === "eligible") === d.eligible),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Donors" description="Everyone registered to receive blood requests." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder="Search name, city or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search donors" />
        </div>
        <Select value={group} onValueChange={setGroup}>
          <SelectTrigger className="sm:w-40" aria-label="Blood group"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={elig} onValueChange={setElig}>
          <SelectTrigger className="sm:w-44" aria-label="Eligibility"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any eligibility</SelectItem>
            <SelectItem value="eligible">Eligible</SelectItem>
            <SelectItem value="not">Not eligible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {q.isPending ? <LoadingState /> : q.isError ? <ErrorState onRetry={() => void q.refetch()} /> : rows.length === 0 ? (
        <EmptyState title="No donors found" description="Try a different search or filter." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <Table>
            <TableHeader><TableRow><TableHead>Donor</TableHead><TableHead>Group</TableHead><TableHead className="hidden md:table-cell">City</TableHead><TableHead className="hidden sm:table-cell">Donations</TableHead><TableHead className="hidden lg:table-cell">Last donation</TableHead><TableHead>Eligibility</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell><p className="font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{d.phone}</p></TableCell>
                  <TableCell><BloodGroupBadge group={d.bloodGroup} size="sm" /></TableCell>
                  <TableCell className="hidden md:table-cell">{d.city}, {d.state}</TableCell>
                  <TableCell className="hidden sm:table-cell tabular-nums">{d.totalDonations}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(d.lastDonationDate)}</TableCell>
                  <TableCell><StatusBadge status={d.eligible ? "eligible" : "not_eligible"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
