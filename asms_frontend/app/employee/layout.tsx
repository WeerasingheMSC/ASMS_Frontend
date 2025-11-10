import Link from "next/link";
import styles from "./employee.module.css";
import Sidebar from "./Sidebar";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "Employee - ASMS",
};

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const newLocal = <Sidebar />;
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className={`${styles.sidebar} w-1/6 sticky top-0 h-screen flex flex-col p-6`}>
        {/* Brand / logo shown at the top of the sidebar */}
        <div className={`flex justify-center items-center mx-auto flex-col pb-5 rounded-lg ${styles.brand}`}>
          <img src="../logo.png" alt="Circular company logo for VX Service centered in the sidebar header, a rounded badge with a light neutral background and bordered rim; sits above the heading VX Service and conveys a friendly professional brand tone" className="rounded-full border-2 border-amber-50 mt-5 w-35 h-35 " />
          <h1 className={styles.brandName}>VX Service</h1>
          <div className={styles.brandDivider} aria-hidden="true" />
        </div>

        {newLocal}

        {/* footer links removed as requested */}
      </aside>

      <main className="flex-1 ml-[16.666%]">
        <Navbar />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
