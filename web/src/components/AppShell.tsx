"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import PriceToggle from "./PriceToggle";
import { ReactNode } from "react";

const pageTitles: Record<string, string> = {
  "/": "SwipeStay",
  "/liked": "Liked",
  "/progress": "Progress",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "SwipeStay";
  const isSwipePage = pathname === "/";

  return (
    <div className="flex h-full flex-col bg-[#f8f7ff]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
        </div>
        <PriceToggle />
      </header>

      {/* Page content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
