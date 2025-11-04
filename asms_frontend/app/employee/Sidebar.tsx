"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GrDashboard, GrDocumentPerformance } from "react-icons/gr";
import { MdOutlineHomeRepairService } from "react-icons/md";
import { FaRegUser } from "react-icons/fa";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  useEffect(() => {
    // sync active label with current pathname on client
    if (!pathname) return;
    if (pathname === "/employee" || pathname === "/employee/") setActiveLabel("Dashboard");
    else if (pathname.startsWith("/employee/projects")) setActiveLabel("Services");
    else if (pathname.startsWith("/employee/team_analysis")) setActiveLabel("Team Analysis");
    else if (pathname.startsWith("/employee/team")) setActiveLabel("Team");
    else setActiveLabel(null);
  }, [pathname]);

  const nav = [
    { href: "/employee", label: "Dashboard", icon: <GrDashboard className="mr-2 text-2xl" /> },
    { href: "/employee/projects", label: "Services", icon: <MdOutlineHomeRepairService className="mr-2 text-2xl" /> },
    { href: "/employee/team_analysis", label: "Team Analysis", icon: <GrDocumentPerformance className="mr-2 text-2xl" /> },
    { href: "/employee/team", label: "Team", icon: <FaRegUser className="mr-2 text-2xl" /> },
  ];

  return (
    <nav className="mt-6 flex-1">
      <ul className="mt-5 text-white font-semibold text-lg space-y-6 ml-6">
        {nav.map((n) => {
          const isActive = activeLabel === n.label;
          return (
            <li
              key={n.label}
              onClick={() => {
                // set active immediately for instant visual feedback, then navigate
                setActiveLabel(n.label);
                router.push(n.href);
              }}
              className={`cursor-pointer flex text-lg p-2 ${isActive ? "bg-white text-black rounded-l-2xl" : "rounded hover:bg-white hover:text-black"}`}
            >
              {n.icon}
              <span className="ml-2">{n.label}</span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
