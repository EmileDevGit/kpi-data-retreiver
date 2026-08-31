"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Sites", href: "/sites" },
  { label: "Debug", href: "/debug" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#F6F2E8]/90 backdrop-blur border-b border-[#8A9184]/20">
      <div className="flex items-center justify-between px-8 md:px-16 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C0392B]" />
          <span className="text-lg font-bold text-[#1E3A2B]">{process.env.NEXT_PUBLIC_ORG_NAME}</span>
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  active
                    ? "text-[#1E3A2B]"
                    : "text-[#8A9184] hover:text-[#1E3A2B]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
