"use client";
import React, { useState, useEffect } from "react";
import projStyles from "./projects.module.css";
import Link from "next/link";
import { getMembersByTeamName, Member } from "../../lib/teamData";
import { getToken } from "../../utils/auth";

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
  const getInitials = (name: string | undefined) => {
    if (!name) return "T";
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length === 0 ? "T" : parts.map(p => p.charAt(0).toUpperCase()).slice(0,2).join("");
  };
  const [rows, setRows] = useState<Project[]>(projects);
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);
  const [openTeamUpIndex, setOpenTeamUpIndex] = useState<number | null>(null);
  const [dropdownStyles, setDropdownStyles] = useState<Record<number, React.CSSProperties>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rowSpecs, setRowSpecs] = useState<Record<number, string>>({});
  // backend teams and members (fetched when user is signed in)
  const [teams, setTeams] = useState<any[]>([]);
  const [backendMembers, setBackendMembers] = useState<any[]>([]);
  // tempSelected holds selections while dropdown is open (so user can Confirm/Cancel)
  const [tempSelected, setTempSelected] = useState<string[]>([]);
  // keep internal rows in sync when parent passes a new projects prop (e.g., filtered list)
  useEffect(() => {
    // Ensure rows include completedDate property when parent passes projects
    const withCompleted = projects.map((p) => ({
      ...p,
      completedDate: (p as any).completedDate ?? null,
      team: (p as any).team ?? [],
      selectedTeam: (p as any).selectedTeam ?? (p as any).selectedTeam ?? [],
    }));
    setRows(withCompleted);
    // initialize per-row specialization to 'All'
    const specsInit: Record<number, string> = {};
    withCompleted.forEach((p, idx) => { specsInit[idx] = 'All'; });
    setRowSpecs(specsInit);
  }, [projects]);

  // fetch teams and members from backend when signed in; fall back to local teamData when not available
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    if (!token) return;

    (async () => {
      try {
        const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/employee/teams/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (resp.ok) {
          const data = await resp.json();
          if (!mounted) return;
          setTeams(Array.isArray(data) ? data : (data.data || []));
        }
      } catch (e) {
        // ignore
      }

      try {
        const mResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/employee/allteam`, { headers: { Authorization: `Bearer ${token}` } });
        if (mResp.ok) {
          const mData = await mResp.json();
          if (!mounted) return;
          setBackendMembers(Array.isArray(mData) ? mData : (mData.data || []));
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, []);

  // derive specialization list: prefer backend teams' specialization field, else fallback
  const specializations = React.useMemo(() => {
    if (teams && teams.length > 0) {
      const set = new Set<string>();
      teams.forEach((t:any) => set.add((t.specialization || t.speciality || 'General')));
      return ['All', ...Array.from(set)];
    }
    // fallback static list
    return ['All', 'Powertrain', 'Electrical', 'Brakes'];
  }, [teams]);
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
            // set fixed-position style so dropdown won't be clipped by ancestors
            setDropdownStyles((prev) => ({
              ...prev,
              [index]: {
                position: 'fixed',
                left: rect.left,
                top: openUp ? Math.max(8, rect.top - dropdownEstimate) : rect.bottom,
                minWidth: Math.max(rect.width, 220),
              },
            }));
          } else {
            setOpenTeamUpIndex(null);
          }
        } catch (e) {
          setOpenTeamUpIndex(null);
        }
      } else {
        setTempSelected([]);
        setOpenTeamUpIndex(null);
        // remove stored style when closing
        setDropdownStyles((prev) => {
          const copy = { ...prev };
          delete copy[index];
          return copy;
        });
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
        // try to derive members from backendMembers using row.teamName
        const teamName = (row as any).teamName as string | undefined;
        if (teamName) {
          let mapped: { id: string; name: string }[] = [];
          if (backendMembers && backendMembers.length > 0) {
            mapped = backendMembers
              .filter((m:any) => (m.team === teamName || m.teamName === teamName || m.specialization === teamName))
              .map((m:any) => ({ id: m.id ?? m.employeeId ?? m.userId ?? String(m.id), name: m.fullName || m.name || m.username || String(m.id) }));
          }
          if (mapped.length === 0) {
            mapped = getMembersByTeamName(teamName).map((m) => ({ id: m.id, name: m.name }));
          }
          row.team = mapped as any;
        } else {
          row.team = [] as any;
        }
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

  // Save edits made in the modal (startDate, completedDate, progress, etc.) back to rows
  function saveSelectedProject() {
    if (!selectedProject) return;
    const idx = rows.findIndex((r) => r.name === selectedProject.name && r.due === selectedProject.due);
    if (idx === -1) return;
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...selectedProject } as Project;
      try {
        localStorage.setItem('asms_projects', JSON.stringify(copy));
        try { window.dispatchEvent(new Event('asms_projects_updated')); } catch (e) {}
      } catch (e) {}
      return copy;
    });
    // refresh the selectedProject from rows to reflect saved values
    setTimeout(() => {
      setSelectedProject((prev) => {
        if (!prev) return null;
        const updated = rows[idx];
        return updated ? { ...updated } : null;
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
                  <div>
                    <div style={{ marginBottom: 6 }}>
                      {/* Display current specialization and team as labels; full selection happens inside the dropdown */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{rowSpecs[i] ?? 'All'}</div>
                        <div style={{ color: '#6b7280' }}>{(p as any).teamName ?? 'Select team'}</div>
                      </div>
                    </div>
                    <div
                      className={projStyles.teamAvatars}
                      data-row-index={i}
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
                      // derive members for display: prefer explicit p.team, else derive from p.teamName
                      let allMembers = p.team && p.team.length > 0 ? p.team : [];
                      const teamName = (p as any).teamName as string | undefined;
                      if ((!allMembers || allMembers.length === 0) && teamName) {
                        if (backendMembers && backendMembers.length > 0) {
                          allMembers = backendMembers
                            .filter((m:any) => (m.team === teamName || m.teamName === teamName || m.specialization === teamName))
                            .map((m:any) => ({ id: m.id ?? m.employeeId ?? m.userId ?? String(m.id), name: m.fullName || m.name || String(m.id) }));
                        }
                        if (!allMembers || allMembers.length === 0) {
                          allMembers = getMembersByTeamName(teamName);
                        }
                      }

                      const assigned = p.selectedTeam && p.selectedTeam.length > 0
                        ? (allMembers || []).filter((m:any) => p.selectedTeam?.includes(m.id))
                        : [];
                      const shown = assigned && assigned.length > 0 ? assigned.slice(0, 3) : (allMembers ? (allMembers as any).slice(0, 3) : []);

                      if (!allMembers || allMembers.length === 0) {
                        return <div className={projStyles.avatarInitialSmall} title="No members">T</div>;
                      }

                      return (
                        <>
                          {shown.map((m: any) => m && (
                            <div key={m.id} className={projStyles.avatarInitialSmall} title={m.name}>
                              {getInitials(m.name)}
                            </div>
                          ))}
                          {assigned && assigned.length > 3 && (
                            <div className={projStyles.memberChipOverflow}>+{assigned.length - 3}</div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {openTeamIndex === i && (
                    <div className={`${projStyles.teamDropdown} ${openTeamUpIndex === i ? projStyles.teamDropdownUp : ""}`} role="dialog" aria-label={`Select team members for ${p.name}`}>
                      {/* Top: Specialization + Team selects inside the dropdown */}
                      <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <select
                            aria-label={`Select specialization for ${p.name}`}
                            value={rowSpecs[i] ?? 'All'}
                            onChange={(e) => {
                              const spec = e.target.value;
                              setRowSpecs((prev) => ({ ...prev, [i]: spec }));
                              // clear team selection when specialization changes
                              setRows((prev) => {
                                const copy = [...prev];
                                const r = { ...copy[i] } as any;
                                r.teamName = '';
                                r.team = [];
                                r.selectedTeam = [];
                                copy[i] = r;
                                try { localStorage.setItem('asms_projects', JSON.stringify(copy)); window.dispatchEvent(new Event('asms_projects_updated')); } catch (e) {}
                                return copy;
                              });
                              setTempSelected([]);
                            }}
                            className={projStyles.teamSelect}
                          >
                            {specializations.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>

                          <select
                              aria-label={`Select team for ${p.name}`}
                              value={(p as any).teamName ?? ''}
                              onChange={(e) => {
                              const teamName = e.target.value;
                              const alreadySelected = rows[i]?.selectedTeam ?? [];
                              // derive members for the selected team
                              let mapped: { id: string; name: string }[] = [];
                              if (backendMembers && backendMembers.length > 0) {
                                mapped = backendMembers
                                  .filter((m:any) => (m.team === teamName || m.teamName === teamName || m.specialization === teamName))
                                  .map((m:any) => ({ id: String(m.id ?? m.employeeId ?? m.userId ?? m.id), name: m.fullName || m.name || m.username || String(m.id) }));
                              }
                              if (mapped.length === 0) {
                                mapped = getMembersByTeamName(teamName).map((m) => ({ id: m.id, name: m.name }));
                              }

                              setRows((prev) => {
                                const copy = [...prev];
                                const r = { ...copy[i] } as any;
                                r.teamName = teamName;
                                r.team = mapped;
                                copy[i] = r;
                                try { localStorage.setItem('asms_projects', JSON.stringify(copy)); window.dispatchEvent(new Event('asms_projects_updated')); } catch (e) {}
                                return copy;
                              });

                              // seed temporary selection so user can confirm
                                setTempSelected(Array.isArray(alreadySelected) ? [...alreadySelected] : []);
                                // when team selection occurs programmatically, try to position the dropdown near the avatars
                                try {
                                  const el = document.querySelector(`[data-row-index=\"${i}\"]`) as HTMLElement | null;
                                  if (el) {
                                    const rect = el.getBoundingClientRect();
                                    const dropdownEstimate = 260;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUp = spaceBelow < dropdownEstimate && rect.top > dropdownEstimate;
                                    setOpenTeamUpIndex(openUp ? i : null);
                                    setDropdownStyles((prev) => ({
                                      ...prev,
                                      [i]: {
                                        position: 'fixed',
                                        left: rect.left,
                                        top: openUp ? Math.max(8, rect.top - dropdownEstimate) : rect.bottom,
                                        minWidth: Math.max(rect.width, 220),
                                      }
                                    }));
                                  }
                                } catch (e) {
                                  // ignore
                                }
                            }}
                            className={projStyles.teamSelect}
                          >
                            <option value="">Select team</option>
                            {teams && teams.length > 0 ? (
                              teams
                                .filter((t:any) => (rowSpecs[i] === 'All' || (t.specialization || t.speciality || 'General') === rowSpecs[i]))
                                .map((t:any) => (
                                  <option key={t.id ?? t.teamId ?? t.name} value={t.name || t.teamName}>{t.name || t.teamName}</option>
                                ))
                            ) : (
                              (['Engine Team','Transmission Team','Electrical Team','Brakes Team']
                                .filter((tn) => rowSpecs[i] === 'All' ? true : (
                                  (rowSpecs[i] === 'Powertrain' && (tn === 'Engine Team' || tn === 'Transmission Team')) ||
                                  (rowSpecs[i] === 'Electrical' && tn === 'Electrical Team') ||
                                  (rowSpecs[i] === 'Brakes' && tn === 'Brakes Team')
                                ))
                                .map((tn) => <option key={tn} value={tn}>{tn}</option>)
                              )
                            )}
                          </select>
                        </div>
                      </div>

                      <div className={projStyles.teamList}>
                          {(() => {
                            const teamName = (p as any).teamName as string | undefined;
                            let dropdownMembers: { id: string; name: string }[] = [];
                            if (p.team && p.team.length > 0) {
                              dropdownMembers = p.team.map((m) => ({ id: String(m.id), name: m.name }));
                            } else if (teamName) {
                              // prefer backend members if present
                              if (backendMembers && backendMembers.length > 0) {
                                dropdownMembers = backendMembers
                                  .filter((m:any) => (m.team === teamName || m.teamName === teamName || m.specialization === teamName))
                                  .map((m:any) => ({ id: String(m.id ?? m.employeeId ?? m.userId ?? m.id), name: m.fullName || m.name || String(m.id) }));
                              }
                              if (!dropdownMembers || dropdownMembers.length === 0) {
                                dropdownMembers = getMembersByTeamName(teamName).map((mm: Member) => ({ id: mm.id, name: mm.name }));
                              }
                            }

                            if (!dropdownMembers || dropdownMembers.length === 0) {
                              return <div className={projStyles.teamRow}><div style={{ color: '#6b7280' }}>No members for selected team</div></div>;
                            }

                            return dropdownMembers.map((m) => (
                              <label key={m.id} className={projStyles.teamRow}>
                                <input
                                  type="checkbox"
                                  checked={!!(tempSelected && tempSelected.includes(m.id))}
                                  onChange={() => handleMemberToggle(i, m.id)}
                                />
                                <span style={{ marginLeft: 8 }}>{m.name}</span>
                              </label>
                            ));
                          })()}
                      </div>
                      <div className={projStyles.teamDropdownFooter}>
                        <button className={projStyles.btnSecondary} onClick={cancelTeamSelection}>Cancel</button>
                        <button className={projStyles.btnPrimary} onClick={() => confirmTeamSelection(i)}>Confirm</button>
                      </div>
                    </div>
                  )}
                </div>
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
                      const teamName = (selectedProject as any).teamName as string | undefined;
                      let teamList: { id: string; name: string }[] = [];
                      if (selectedProject.team && selectedProject.team.length > 0) teamList = selectedProject.team as any;
                      else if (teamName) {
                        if (backendMembers && backendMembers.length > 0) {
                          teamList = backendMembers
                            .filter((m:any) => (m.team === teamName || m.teamName === teamName || m.specialization === teamName))
                            .map((m:any) => ({ id: m.id ?? m.employeeId ?? m.userId ?? String(m.id), name: m.fullName || m.name || String(m.id) }));
                        }
                        if (!teamList || teamList.length === 0) teamList = getMembersByTeamName(teamName).map((m) => ({ id: m.id, name: m.name }));
                      }

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
                <div className="flex gap-2">
                  <button className={projStyles.btnPrimary} onClick={saveSelectedProject}>Save</button>
                  <button className={projStyles.btnSecondary} onClick={closeDetails}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
