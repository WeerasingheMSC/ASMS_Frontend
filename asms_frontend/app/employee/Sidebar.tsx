"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./employee.module.css";

export default function Sidebar() {
  const pathname = usePathname() || "/";

  const nav = [
    { href: "/employee", label: "Dashboard", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12l9-7 9 7v7a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { href: "/employee/projects", label: "Services", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { href: "/employee/team-analysis", label: "Team Analysis", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="6" y="10" width="3" height="8" fill="currentColor"/><rect x="11" y="6" width="3" height="12" fill="currentColor"/><rect x="16" y="2" width="3" height="16" fill="currentColor"/></svg>
    ) },
    { href: "/employee/team", label: "Team", icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 20c0-2.5 3.582-4.5 8-4.5s8 2 8 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
  ];

  const isActive = (href: string) => {
    if (href === "/employee") return pathname === "/employee" || pathname === "/employee/";
    if (href === "#reports") return pathname.startsWith("/reports") || pathname === "/reports";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="mt-6 flex-1">
      <ul className="space-y-2">
        {nav.map((n) => (
          <li key={n.label}>
            <Link href={n.href} className={`${styles.navLink} ${isActive(n.href) ? styles.active : ""}`}>
              <span className={styles.navIcon} aria-hidden="true">{n.icon}</span>
              <span className={styles.navLabel}>{n.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
