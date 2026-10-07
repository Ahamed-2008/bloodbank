import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/common/state";
import { StatusBadge } from "@/components/common/badges";
import { hospitalService } from "@/services/hospital-service";
import { HospitalDetails } from "@/components/hospital/hospital-details";

export const Route = createFileRoute("/hospital/profile")({
  head: () => ({
    meta: [
      { title: "Hospital profile — BloodLink" },
      {
        name: "description",
        content: "Your hospital's registration, licence, contact and location details.",
      },
      { property: "og:title", content: "Hospital profile — BloodLink" },
      { property: "og:description", content: "Registered hospital details on BloodLink." },
    ],
  }),
  component: HospitalProfilePage,
});

function HospitalProfilePage() {
  const query = useQuery({
    queryKey: ["hospital", "profile"],
    queryFn: hospitalService.getProfile,
  });

  if (query.isPending) return <LoadingState rows={3} />;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;

  const h = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital profile"
        description="Official registration, licence, and contact records stored on BloodLink."
      />

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border brand-surface p-6">
        <span className="grid size-14 place-items-center rounded-2xl bg-background/20">
          <Building2 className="size-7" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{h.name}</h2>
          <p className="text-sm opacity-90">
            {h.city}, {h.state} · Reg #{h.registration_number}
          </p>
        </div>
        <StatusBadge
          status={h.is_verified ? "Approved" : "Pending"}
          className="bg-background"
        />
      </section>

      <HospitalDetails hospital={h} />
    </div>
  );
}
