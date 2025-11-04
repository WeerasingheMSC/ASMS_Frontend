"use client";
import React, { useEffect, useState } from "react";
import styles from "../employee/employee.module.css";
import projectsApi from "../lib/projectsApi";

type Project = {
  name: string;
  client: string;
  status: string;
  progress: number;
  due: string;
};

const defaultSample: Project[] = [
  { name: "Client Website Redesign", client: "Innovate Inc.", status: "In Progress", progress: 75, due: "2024-12-15" },
  { name: "Mobile App Development", client: "Synergy Corp.", status: "Completed", progress: 100, due: "2024-10-30" },
  { name: "API Integration", client: "Tech Solutions", status: "On Hold", progress: 10, due: "2025-01-20" },
  { name: "Service Automation", client: "Acme Ltd.", status: "In Progress", progress: 45, due: "2025-02-05" },
];

function countByStatus(projects: Project[]) {
  const counts: Record<string, number> = { Completed: 0, "In Progress": 0, "On Hold": 0 };
  for (const p of projects) {
    if (p.status === "Completed") counts.Completed++;
    else if (p.status === "In Progress") counts["In Progress"]++;
    else counts["On Hold"]++;
  }
  return counts;
}

function WorkloadOverview({ projects: initial }: { projects?: Project[] }) {
  const [projects, setProjects] = useState<Project[]>(initial || defaultSample);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("asms_projects");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setProjects(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const counts = countByStatus(projects);
  const total = projects.length || 0;
  const completed = counts.Completed || 0;
  const inProgress = counts["In Progress"] || 0;
  const onHold = counts["On Hold"] || 0;

  const circumference = 2 * Math.PI * 60;
  const completedLen = circumference * (total ? completed / total : 0);
  const inProgressLen = circumference * (total ? inProgress / total : 0);
  const onHoldLen = circumference * (total ? onHold / total : 0);

  return (
    <div className={styles.workloadContainer}>
      <div className={styles.chartWrapper}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <g transform="rotate(-90 80 80)">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#eef2f7" strokeWidth="14" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#16a34a" strokeWidth="14" strokeDasharray={`${completedLen} ${circumference - completedLen}`} strokeLinecap="round" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#2563eb" strokeWidth="14" strokeDasharray={`${inProgressLen} ${circumference - inProgressLen}`} strokeDashoffset={-completedLen} strokeLinecap="round" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" strokeWidth="14" strokeDasharray={`${onHoldLen} ${circumference - onHoldLen}`} strokeDashoffset={-(completedLen + inProgressLen)} strokeLinecap="round" />
          </g>
        </svg>

        <div className={styles.chartCenter}>
          <div className={styles.chartNumber}>{inProgress}</div>
          <div className={styles.chartLabel}>Active</div>
        </div>
      </div>

        <div className={styles.legendContainer}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotCompleted}`} />
            <div className={styles.legendText}>Completed <span className={styles.legendCount}>({completed})</span></div>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotInProgress}`} />
            <div className={styles.legendText}>In Progress <span className={styles.legendCount}>({inProgress})</span></div>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDotOnHold}`} />
            <div className={styles.legendText}>On Hold <span className={styles.legendCount}>({onHold})</span></div>
          </div>
        </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const [projectsData, setProjectsData] = useState<Project[]>(defaultSample);

  useEffect(() => {
    let mounted = true;
    projectsApi.fetchProjects().then((data) => {
      if (!mounted) return;
      if (data && data.length > 0) setProjectsData(data as Project[]);
    }).catch(() => {
      // ignore - keep defaults or localStorage fallback handled in helper
    });
    return () => { mounted = false; };
  }, []);

  const inProgressProjects = projectsData.filter((p) => p.status === "In Progress");
  const inProgressCount = inProgressProjects.length;
  const totalProjects = projectsData.length || 0;
  // percent of projects that are In Progress (out of all projects)
  const percentInProgress = totalProjects ? Math.round((inProgressCount / totalProjects) * 100) : 0;

  useEffect(() => {
    // listen for updates from other components that write to localStorage
    function handleUpdate() {
      try {
        const raw = localStorage.getItem("asms_projects");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setProjectsData(parsed as Project[]);
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener("asms_projects_updated", handleUpdate);
    // also listen to storage events for cross-tab updates
    function onStorage(e: StorageEvent) {
      if (e.key === "asms_projects") handleUpdate();
    }
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("asms_projects_updated", handleUpdate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // helper to normalize different due date formats to YYYY-MM-DD
  function normalizeToISO(d: string) {
    if (!d) return null;
    // if already in YYYY-MM-DD form
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    // try parsing other common formats
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return null;
  }

  function normalizeDateDisplay(d: string) {
    const iso = normalizeToISO(d);
    if (!iso) return d || "";
    const parsed = new Date(iso);
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  const todayDisplay = today.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const scheduledToday = projectsData.filter((p) => {
    const iso = normalizeToISO(p.due);
    return iso === todayISO && p.status !== "Completed";
  });

  return (
    <div className="space-y-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Welcome !</h1>
          <p className="text-gray-500 mt-1">Manage your tasks and appointments.</p>
        </header>
  <section className="grid grid-cols-2 gap-6">
    <div className={`col-span-1 bg-white p-6 rounded-lg shadow-sm ${styles.projectsCard}`}>
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-xl font-semibold">My Projects</h2>
            <a href="/employee/projects" className="text-sm text-blue-600">View All</a>
          </div>

          {/* Summary for In Progress projects (aggregate percentage) */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryLeft}>
                <div className={styles.summaryTitle}>In Progress</div>
              <div className={styles.summaryCount}>{inProgressCount} project{inProgressCount !== 1 ? "s" : ""}</div>
            </div>

            <div className={styles.summaryRight}>
              <div className={styles.progressBarWrapper}>
                {/* Dynamic width requires inline style - progress percentage is calculated at runtime */}
                <div className={styles.progressBarTrack}>
                  {/* @ts-expect-error CSS custom property for dynamic value */}
                  <div className={styles.progressBarFill} style={{ '--progress-percentage': percentInProgress }} />
                </div>
                <div className={styles.progressBarLabel}>{percentInProgress}% In Progress</div>
              </div>
            </div>
          </div>

          <ul className={`${styles.myProjects} space-y-4`}>
            {inProgressProjects.length === 0 ? (
              <li className={styles.projectItem}>
                <div className={styles.noProjects}>No projects in progress</div>
              </li>
            ) : (
              inProgressProjects.map((p) => (
                <li key={p.name} className={styles.projectItem}>
                  <div className={styles.projectLeft}>
                    <div className={`${styles.iconBox} ${styles.iconBoxInProgress}`}>
                      {/* simple status glyph */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h18" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className={"project-meta"}>
                      <div className="title">{p.name}</div>
                      <div className="client">Client: {p.client}</div>
                    </div>
                  </div>
                  <div className={styles.projectRight}>
                    {/* due date kept optional; if you previously removed due dates, we can hide this */}
                    <div className={styles.dueDate}>{p.due}</div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

  <div className="col-span-1 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className={`${styles.cardHeading} text-base`}>Today's Schedule</h3>
              <div className={styles.scheduleDate}>{todayDisplay}</div>
            </div>
            <a href="/employee/projects" className="text-sm text-blue-600">View All</a>
          </div>

          <ul className={`${styles.scheduleList} space-y-4`}> 
            {scheduledToday.length === 0 ? (
              <li className={styles.scheduleItem}>
                <div className={styles.scheduleLeft}>
                  <div className={styles.noProjects}>No projects scheduled for today</div>
                </div>
              </li>
            ) : (
              scheduledToday.map((p) => (
                <li key={p.name} className={styles.scheduleItem}>
                  <div className={styles.scheduleLeft}>
                    <span className={`${styles.dot} ${styles.dotBlue}`} />
                    <div>
                      <div className={styles.eventTime}>Due: {normalizeDateDisplay(p.due)}</div>
                      <div className={styles.eventTitle}>{p.name}</div>
                      <div className={styles.eventClient}>Client: {p.client}</div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className={`bg-white p-4 rounded-lg shadow-sm ${styles.workloadSection}`}>
        <h3 className="font-semibold mb-3">Workload Overview</h3>
        <div>
          {/* client component reads projects from localStorage or falls back to sample */}
          <WorkloadOverview />
        </div>
      </section>
    </div>
  );
}


