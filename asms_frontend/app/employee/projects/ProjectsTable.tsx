"use client";
import React, { useState, useEffect } from "react";
import projStyles from "./projects.module.css";
import Link from "next/link";

type Project = {
  name: string;
  client: string;
  status: string;
  progress: number;
  completedDate?: string | null;
  due: string;
  // optional team members belonging to the project
  team?: { id: string; name: string; avatar?: string }[];
  // selected team member ids (persisted)
  selectedTeam?: string[];
};

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [rows, setRows] = useState<Project[]>(projects);
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);
  const [openTeamUpIndex, setOpenTeamUpIndex] = useState<number | null>(null);
  // tempSelected holds selections while dropdown is open (so user can Confirm/Cancel)
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  // keep internal rows in sync when parent passes a new projects prop (e.g., filtered list)
  useEffect(() => {
    // Ensure rows include completedDate property when parent passes projects
    const withCompleted = projects.map((p) => ({
      ...p,
      completedDate: (p as any).completedDate ?? null,
      team: (p as any).team ?? (p as any).team ?? [],
      selectedTeam: (p as any).selectedTeam ?? (p as any).selectedTeam ?? [],
    }));
    setRows(withCompleted);
  }, [projects]);
  // No internal search UI - table renders current rows

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
        return `${projStyles.badge} ${projStyles.statusCompleted}`;
      case "In Progress":
        return `${projStyles.badge} ${projStyles.statusInProgress}`;
      case "Pending":
        return `${projStyles.badge} ${projStyles.statusPending}`;
      case "Overdue":
        return `${projStyles.badge} ${projStyles.statusOverdue}`;
      default:
        return projStyles.badge;
    }
  };

  const progressFillClass = (progress: number, status: string) => {
    if (status === "Completed") return `${projStyles.progressFill} green`;
    if (status === "In Progress") return `${projStyles.progressFill} orange`;
    if (status === "Overdue") return `${projStyles.progressFill} red`;
    return `${projStyles.progressFill} gray`;
  };

  const selectClass = (status: string) => {
    switch (status) {
      case "Completed":
        return `${projStyles.filterBtn} ${projStyles.selectCompleted}`;
      case "In Progress":
        return `${projStyles.filterBtn} ${projStyles.selectInProgress}`;
      case "Overdue":
        return `${projStyles.filterBtn} ${projStyles.selectOverdue}`;
      case "Pending":
      default:
        return `${projStyles.filterBtn} ${projStyles.selectPending}`;
    }
  };

  function handleStatusChange(index: number, value: string) {
    setRows((prev) => {
      const copy = [...prev];
      const prevStatus = copy[index]?.status;
      const updated: Project = { ...copy[index], status: value };
      // if setting to completed, set progress to 100 and record completedDate if newly completed
      if (value === "Completed") {
        updated.progress = 100;
        if (prevStatus !== "Completed") {
          const d = new Date();
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          updated.completedDate = `${yyyy}-${mm}-${dd}`;
        }
      } else {
        // not completed -> clear completedDate
        updated.completedDate = null;
      }
      copy[index] = updated;
      // persist updated rows to localStorage so dashboard and other pages can read it
      try {
        localStorage.setItem("asms_projects", JSON.stringify(copy));
        // notify other components in the same window/tab to reload projects
        try {
          window.dispatchEvent(new Event("asms_projects_updated"));
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore storage errors
      }
      return copy;
    });
  }

  function toggleTeamDropdown(index: number, triggerEl?: HTMLElement) {
    setOpenTeamIndex((prev) => {
      const next = prev === index ? null : index;
      // when opening, seed tempSelected with current row selection
      if (next === index) {
        const current = rows[index]?.selectedTeam ?? [];
        setTempSelected(Array.isArray(current) ? [...current] : []);
        // compute whether dropdown should open upward based on viewport space
        try {
          if (triggerEl) {
            const rect = triggerEl.getBoundingClientRect();
            const dropdownEstimate = 260; // px
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < dropdownEstimate && rect.top > dropdownEstimate;
            setOpenTeamUpIndex(openUp ? index : null);
          } else {
            setOpenTeamUpIndex(null);
          }
        } catch (e) {
          setOpenTeamUpIndex(null);
        }
      } else {
        setTempSelected([]);
        setOpenTeamUpIndex(null);
      }
      return next;
    });
  }

  function handleMemberToggle(rowIndex: number, memberId: string) {
    // update tempSelected while dropdown is open
    setTempSelected((prev) => {
      const s = new Set(prev);
      if (s.has(memberId)) s.delete(memberId);
      else s.add(memberId);
      return Array.from(s);
    });
  }

  function confirmTeamSelection(rowIndex: number) {
    setRows((prev) => {
      const copy = [...prev];
      const row = { ...copy[rowIndex] };
      row.selectedTeam = Array.isArray(tempSelected) ? [...tempSelected] : [];
      copy[rowIndex] = row;
      try {
        localStorage.setItem("asms_projects", JSON.stringify(copy));
        try {
          window.dispatchEvent(new Event("asms_projects_updated"));
        } catch (e) {}
      } catch (e) {}
      return copy;
    });
    setOpenTeamIndex(null);
    setTempSelected([]);
  }

  function cancelTeamSelection() {
    setOpenTeamIndex(null);
    setTempSelected([]);
  }

  return (
    <div className={projStyles.tableWrap}>
      <table className={projStyles.table}>
        <thead>
          <tr>
            <th>Project Name</th>
            <th>Client</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Completed Date</th>
            <th>Team</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => (
            <tr key={p.name}>
              <td>
                <div className={projStyles.projectNameCell}>
                  <span
                    className={projStyles.projectDot}
                    style={{
                      background:
                        p.status === "Completed"
                          ? "#16a34a"
                          : p.status === "In Progress"
                          ? "#fb923c"
                          : p.status === "Overdue"
                          ? "#ef4444"
                          : "#9ca3af",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>{p.client}</div>
                  </div>
                </div>
              </td>
              <td style={{ color: "#6b7280" }}>{p.client}</td>
              <td>
                <select
                  aria-label={`Status for ${p.name}`}
                  value={p.status}
                  onChange={(e) => handleStatusChange(i, e.target.value)}
                  className={selectClass(p.status)}
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Overdue</option>
                </select>
                  {/* Status badge removed to make select the single visible status indicator */}
              </td>
              <td style={{ color: "#6b7280" }}>{p.due}</td>
              <td style={{ color: "#6b7280" }}>{p.completedDate ? p.completedDate : "Pending"}</td>
              <td>
                <div style={{ position: "relative" }}>
                  <div
                    className={projStyles.teamAvatars}
                    onClick={(e) => toggleTeamDropdown(i, e.currentTarget as HTMLElement)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleTeamDropdown(i, e.currentTarget as HTMLElement);
                    }}
                    aria-label={`Team members for ${p.name}`}
                  >
                    {/* show selected members as avatars/initials */}
                    {(p.selectedTeam && p.selectedTeam.length > 0
                      ? p.team?.filter((m) => p.selectedTeam?.includes(m.id))
                      : p.team?.slice(0, 3)
                    )?.map((m) => (
                      m && (
                        <div key={m.id} className={projStyles.avatar} title={m.name} style={{ overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef2f6", fontWeight: 700, color: "#0f1724" }}>
                          {m.avatar ? (
                            <img src={m.avatar} alt={m.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span className={projStyles.avatarInitial}>{m.name.charAt(0)}</span>
                          )}
                        </div>
                      )
                    ))}
                    {/* if there are more selected than shown, show a +n badge */}
                    {p.selectedTeam && p.selectedTeam.length > 3 && (
                      <div className={projStyles.avatar} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", color: "#374151" }}>+{p.selectedTeam.length - 3}</div>
                    )}
                    {/* fallback if no team members available */}
                    {(!p.team || p.team.length === 0) && (
                      <div className={projStyles.avatar} style={{ background: "#f8fafc", color: "#6b7280", fontWeight: 700 }}>T</div>
                    )}
                  </div>

                  {openTeamIndex === i && (
                    <div className={`${projStyles.teamDropdown} ${openTeamUpIndex === i ? projStyles.teamDropdownUp : ""}`} role="dialog" aria-label={`Select team members for ${p.name}`}>
                      <div className={projStyles.teamList}>
                        {(p.team && p.team.length > 0 ? p.team : [{ id: "member-1", name: "Alice" }, { id: "member-2", name: "Bob" }, { id: "member-3", name: "Cara" }]).map((m) => (
                          <label key={m.id} className={projStyles.teamRow}>
                            <input
                              type="checkbox"
                              checked={!!(tempSelected && tempSelected.includes(m.id))}
                              onChange={() => handleMemberToggle(i, m.id)}
                            />
                            <span style={{ marginLeft: 8 }}>{m.name}</span>
                          </label>
                        ))}
                      </div>
                      <div className={projStyles.teamDropdownFooter}>
                        <button className={projStyles.btnSecondary} onClick={cancelTeamSelection}>Cancel</button>
                        <button className={projStyles.btnPrimary} onClick={() => confirmTeamSelection(i)}>Confirm</button>
                      </div>
                    </div>
                  )}
                </div>
              </td>
              <td style={{ color: "#2563eb", fontWeight: 600 }}>
                <Link href="#">View Details</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
