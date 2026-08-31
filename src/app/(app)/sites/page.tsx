import Link from "next/link";
import { listSitesWithMachineCount } from "@/lib/data/site";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const sites = await listSitesWithMachineCount();

  return (
    <div className="min-h-screen bg-[#F6F2E8] p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E3A2B]">Sites</h1>
        <p className="text-sm text-[#8A9184]">
          {sites.length} site{sites.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-3">
        {sites.map((site) => (
          <Link
            key={site.id}
            href={`/sites/${site.id}`}
            className="rounded-2xl bg-[#EDE7D9] border-l-[6px] border-[#4C8C5B] p-6 flex items-center justify-between transition-colors hover:bg-[#E4DDC9]"
          >
            <h2 className="font-medium text-[#1E3A2B]">{site.name}</h2>
            <span className="text-sm text-[#8A9184]">
              {site._count.machines} machine{site._count.machines === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
