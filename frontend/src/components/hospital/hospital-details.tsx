import type { Hospital } from "@/lib/types";
import { formatDate, titleCase } from "@/lib/format";

export function HospitalDetails({ hospital: h }: { hospital: Hospital }) {
  const groups: { title: string; items: [string, string][] }[] = [
    {
      title: "Registration",
      items: [
        ["Registration number", h.registrationNumber],
        ["Hospital type", titleCase(h.type)],
        ["Registered on", formatDate(h.createdAt)],
        ["Alerts created", String(h.alertsCreated)],
      ],
    },
    {
      title: "Blood bank licence",
      items: [
        ["Licence number", h.licenseNumber],
        ["Issued", formatDate(h.licenseIssuedDate)],
        ["Expires", formatDate(h.licenseExpiryDate)],
      ],
    },
    {
      title: "Contact",
      items: [
        ["Contact person", h.contactName],
        ["Phone", h.contactPhone],
        ["Email", h.contactEmail],
      ],
    },
    {
      title: "Location",
      items: [
        ["Address", h.address],
        ["City / State", `${h.city}, ${h.state}`],
        ["Pincode", h.pincode],
        ["Coordinates", `${h.latitude}, ${h.longitude}`],
      ],
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map((g) => (
        <section key={g.title} className="rounded-2xl border border-border bg-card p-6 card-elevated">
          <h3 className="font-semibold">{g.title}</h3>
          <dl className="mt-4 space-y-3">
            {g.items.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,10rem)_1fr] gap-3 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
