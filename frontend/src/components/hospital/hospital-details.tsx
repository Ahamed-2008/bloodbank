import type { HospitalProfile, AdminHospitalDetail } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function HospitalDetails({
  hospital: h,
}: {
  hospital: HospitalProfile | AdminHospitalDetail;
}) {
  const primaryVerification = h.hospital_verifications?.[0];

  const groups: { title: string; items: [string, string][] }[] = [
    {
      title: "Registration Details",
      items: [
        ["Registration Number", h.registration_number],
        ["Hospital Type", h.hospital_type],
        ["Status", h.is_verified ? "Verified" : "Pending Verification"],
        ["Active in System", h.is_active ? "Yes" : "No"],
      ],
    },
    {
      title: "Blood Bank Licence",
      items: [
        ["Licence Number", primaryVerification?.license_number || "—"],
        [
          "Issued On",
          primaryVerification?.license_issued_at
            ? formatDate(primaryVerification.license_issued_at)
            : "—",
        ],
        [
          "Expires On",
          primaryVerification?.license_expires_at
            ? formatDate(primaryVerification.license_expires_at)
            : "—",
        ],
        ["Licence Status", primaryVerification?.status || "Pending"],
      ],
    },
    {
      title: "Contact Details",
      items: [
        ["Contact Person", h.contact_name || "—"],
        ["Phone Number", h.contact_phone || "—"],
        ["Email Address", h.contact_email || "—"],
      ],
    },
    {
      title: "Location",
      items: [
        ["Address", (h as any).address || "—"],
        ["City / State", `${h.city}, ${h.state}`],
        ["Pincode", (h as any).pincode || "—"],
      ],
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <section
          key={g.title}
          className="rounded-2xl border border-border bg-card p-6 card-elevated"
        >
          <h3 className="font-semibold text-foreground">{g.title}</h3>
          <dl className="mt-4 space-y-3">
            {g.items.map(([k, v]) => (
              <div
                key={k}
                className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 text-sm"
              >
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
