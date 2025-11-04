import Link from "next/link";
import styles from "./employee.module.css";
import Sidebar from "./Sidebar";

export const metadata = {
  title: "Employee - ASMS",
};

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
  <aside className={`${styles.sidebar} w-56 sticky top-0 h-screen flex flex-col p-6`}>
        <div className={styles.brand}>
          <div className={styles.avatarCircle} aria-hidden="true">
            {/* logo placeholder - keep SVG for crisp edges */}
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="32" fill="#0f2340" />
              <g transform="translate(8 8)">
                <circle cx="24" cy="24" r="24" fill="#0b2348" />
                <text x="24" y="30" textAnchor="middle" fill="#4fd1c5" fontWeight="700" fontSize="18">VX</text>
              </g>
            </svg>
          </div>
          <div className={styles.brandName}>VX Service</div>
        </div>

        <Sidebar />

        {/* footer links removed as requested */}
      </aside>

  <main className="flex-1 p-8 ml-56">
        <header className="relative mb-8 py-4">

          <div className={`absolute right-8 top-1/2 transform -translate-y-1/2 flex items-center gap-6 ${styles.headerIcons}`}>
            <div>
              <button aria-label="Notifications" className={`relative p-2 rounded-md hover:bg-gray-100 ${styles.notifyBtn}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className={styles.notifyBadge} aria-hidden="true" />
              </button>
            </div>


            <div className={`${styles.avatarWrap} flex items-center justify-center`} role="img" aria-label="User profile">
              {/* inline avatar SVG as a reliable fallback */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="12" r="12" fill="#f8fafc" />
                <path d="M12 12c1.933 0 3.5-1.567 3.5-3.5S13.933 5 12 5 8.5 6.567 8.5 8.5 10.067 12 12 12zM4.5 19.5c0-2.485 2.686-4.5 7.5-4.5s7.5 2.015 7.5 4.5" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </header>

        <div>{children}</div>
      </main>
    </div>
  );
}
