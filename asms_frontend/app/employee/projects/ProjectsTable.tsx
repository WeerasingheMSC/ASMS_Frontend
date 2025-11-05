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
  startDate?: string | null; // Add startDate to project type
  // optional team members belonging to the project
  team?: { id: string; name: string; avatar?: string }[];
  // selected team member ids (persisted)
  selectedTeam?: string[];
};

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const [rows, setRows] = useState<Project[]>(projects);
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);
  const [openTeamUpIndex, setOpenTeamUpIndex] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Default fallback team list when a row doesn't include a team array
  const defaultTeam = [
    { id: "member-1", name: "Mike Johnson" },
    { id: "member-2", name: "Sarah Williams" },
    { id: "member-3", name: "Tom Anderson" },
  ];
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
      // ensure the row has a team array so selectedTeam ids can be resolved to names
      if (!row.team || row.team.length === 0) {
        row.team = defaultTeam as any;
      }
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

  // Open the project details modal
  function openDetails(rowIndex: number) {
    setSelectedProject(rows[rowIndex]);
  }

  function closeDetails() {
    setSelectedProject(null);
  }

  // Mark the currently selected project as completed and compute completedDate
  function markSelectedComplete() {
    if (!selectedProject) return;
    const idx = rows.findIndex((r) => r.name === selectedProject.name && r.due === selectedProject.due);
    if (idx === -1) return;
    handleStatusChange(idx, "Completed");
    // refresh selected project from rows after state update
    setTimeout(() => {
      setSelectedProject((prev) => {
        if (!prev) return null;
        const updated = rows[idx];
        if (!updated) return null;
        return { ...updated };
      });
    }, 50);
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
                    {/* render selected members as compact chips (initial + short name) */}
                    {(() => {
                      const assigned = p.selectedTeam && p.selectedTeam.length > 0
                        ? p.team?.filter((m) => p.selectedTeam?.includes(m.id))
                        : [];
                      const shown = assigned && assigned.length > 0 ? assigned.slice(0, 3) : (p.team ? p.team.slice(0, 3) : []);
                      return (
                        <>
                          {shown.map((m) => m && (
                            <div key={m.id} className={projStyles.avatarInitialSmall} title={m.name}>
                              {m.name.charAt(0)}
                            </div>
                          ))}
                          {assigned && assigned.length > 3 && (
                            <div className={projStyles.memberChipOverflow}>+{assigned.length - 3}</div>
                          )}
                          {/* fallback when no team members */}
                          {(!p.team || p.team.length === 0) && (
                            <div className={projStyles.avatarInitialSmall} title="No members">T</div>
                          )}
                        </>
                      );
                    })()}
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
                <button
                  onClick={() => openDetails(i)}
                  title="View Details"
                  aria-label={`View details for ${p.name}`}
                  className="p-2 rounded hover:bg-indigo-50"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z" fill="#6b46f6" />
                      <circle cx="12" cy="12" r="2.6" fill="#ffffff" />
                    </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Details modal */}
      {selectedProject && (
        <div>
          <div
            className="fixed top-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-50"
            style={{ left: "16.666667%" }}
            onClick={closeDetails}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-60 p-4">
            <div className={projStyles.modal} role="dialog" aria-label={`Details for ${selectedProject.name}`}>
              <div className={projStyles.modalHeader}>
                <h2>{selectedProject.name}</h2>
                <div className={projStyles.modalSubtitle}>{selectedProject.client}</div>
              </div>

              <div className={projStyles.modalBody}>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Status</div>
                  <div className={projStyles.modalValue}>{selectedProject.status}</div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Progress</div>
                  <div className={projStyles.modalValue}>{selectedProject.progress}%</div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Start Date</div>
                  <div className={projStyles.modalValue}>
                    <label htmlFor="startDateInput" className="sr-only">Start Date</label>
                    <input
                      id="startDateInput"
                      type="date"
                      value={selectedProject.startDate || ""}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setSelectedProject((prev) => prev ? { ...prev, startDate: newDate } : null);
                      }}
                      className={projStyles.inputField}
                      placeholder="Select start date"
                    />
                  </div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Due Date</div>
                  <div className={projStyles.modalValue}>{selectedProject.due}</div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Completed Date</div>
                  <div className={projStyles.modalValue}>
                    <label htmlFor="completedDateInput" className="sr-only">Completed Date</label>
                    <input
                      id="completedDateInput"
                      type="date"
                      value={selectedProject.completedDate || ""}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setSelectedProject((prev) => prev ? { ...prev, completedDate: newDate } : null);
                      }}
                      className={projStyles.inputField}
                      placeholder="Select completed date"
                    />
                  </div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Days to Complete</div>
                  <div className={projStyles.modalValue}>
                    {selectedProject.startDate && selectedProject.completedDate
                      ? `${Math.round(
                          (new Date(selectedProject.completedDate).getTime() - new Date(selectedProject.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} day(s)`
                      : "—"}
                  </div>
                </div>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Assigned Members</div>
                  <div className={projStyles.modalValue}>
                    {(() => {
                      const fallback = [{ id: "member-1", name: "Alice" }, { id: "member-2", name: "Bob" }, { id: "member-3", name: "Cara" }];
                      const teamList = selectedProject.team && selectedProject.team.length > 0 ? selectedProject.team : fallback;
                      if (selectedProject.selectedTeam && selectedProject.selectedTeam.length > 0) {
                        return selectedProject.selectedTeam
                          .map((id) => teamList.find((m) => String(m.id) === String(id))?.name)
                          .filter(Boolean)
                          .join(", ") || 'None';
                      }
                      return 'None';
                    })()}
                  </div>
                </div>
              </div>

              <div className={projStyles.modalActions}>
                {selectedProject.status !== 'Completed' ? (
                  <button className={projStyles.btnPrimary} onClick={markSelectedComplete}>Mark Complete</button>
                ) : (
                  <div className="text-sm text-gray-600">Project already completed</div>
                )}
                <button className={projStyles.btnSecondary} onClick={closeDetails}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
