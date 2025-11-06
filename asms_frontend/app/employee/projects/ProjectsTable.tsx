"use client";
import React, { useState, useEffect } from "react";
import projStyles from "./projects.module.css";
import Link from "next/link";
import { getToken } from "../../utils/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

type Project = {
  id?: string;
  projectId?: number;
  name: string;
  client: string;
  status: string;
  progress: number;
  completedDate?: string | null;
  due: string;
  startDate?: string | null;
  teamId?: string;
  teamName?: string;
  description?: string;
  // optional team members belonging to the project
  team?: { id: string; name: string; avatar?: string }[];
  // selected team member ids (persisted)
  selectedTeam?: string[];
};

type Member = {
  id: string;
  employeeId?: string;
  userId?: string;
  name: string;
  fullName?: string;
  username?: string;
  team?: string;
  teamName?: string;
  specialization?: string;
  productivity?: number;
};

type Team = {
  id: string;
  teamId?: string;
  name: string;
  teamName?: string;
  specialization?: string;
  speciality?: string;
  totalMembers?: number;
};

type ProjectsTableProps = {
  projects?: Project[];
  onUpdate?: () => void; // Callback when a project is updated
};

export default function ProjectsTable({ projects = [], onUpdate }: ProjectsTableProps) {
  console.log('🔧 ProjectsTable loaded with', projects?.length || 0, 'projects');
  console.log('🌐 API_URL:', API_URL);
  
  const getInitials = (name: string | undefined) => {
    if (!name) return "T";
    const parts = name.split(/\s+/).filter(Boolean);
    return parts.length === 0 ? "T" : parts.map(p => p.charAt(0).toUpperCase()).slice(0,2).join("");
  };

  const [rows, setRows] = useState<Project[]>(projects || []);
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);
  const [openTeamUpIndex, setOpenTeamUpIndex] = useState<number | null>(null);
  const [dropdownStyles, setDropdownStyles] = useState<Record<number, React.CSSProperties>>({});
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [rowSpecs, setRowSpecs] = useState<Record<number, string>>({});
  
  // Backend data states
  const [teams, setTeams] = useState<Team[]>([]);
  const [backendMembers, setBackendMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Temp selection for team dropdown
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  // Get employee ID from token
  const getEmployeeId = () => {
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.employeeId || payload.userId || payload.id || '1';
      }
    } catch (e) {
      console.error('Error parsing token:', e);
    }
    return '1';
  };

  const employeeId = getEmployeeId();

  // Sync rows when parent projects prop changes
  useEffect(() => {
    console.log('🔄 ProjectsTable useEffect - projects prop changed:', projects?.length);
    if (!projects || !Array.isArray(projects)) {
      setRows([]);
      return;
    }
    const withCompleted = projects.map((p) => ({
      ...p,
      completedDate: p.completedDate ?? null,
      team: p.team ?? [],
      selectedTeam: p.selectedTeam ?? [],
    }));
    console.log('🔄 Setting rows to:', withCompleted.length, 'projects');
    setRows(withCompleted);
    
    const specsInit: Record<number, string> = {};
    withCompleted.forEach((p, idx) => { 
      specsInit[idx] = p.teamName ? 'All' : 'All'; 
    });
    setRowSpecs(specsInit);
  }, [projects]);

  // Fetch teams and members from backend - Try multiple endpoints
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    
    if (!token) {
      console.warn('No auth token found');
      return;
    }

    const fetchBackendData = async () => {
      try {
        // Fetch teams - try multiple endpoints
        const teamEndpoints = [
          `${API_URL}/api/employee/teams/all`,
          `${API_URL}/api/teams`,
          `${API_URL}/api/employee/teams`
        ];

        let teamsSuccess = false;
        for (const endpoint of teamEndpoints) {
          try {
            const teamsRes = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (teamsRes.ok) {
              const teamsData = await teamsRes.json();
              if (!mounted) return;
              const teamsList = Array.isArray(teamsData) ? teamsData : (teamsData.data || teamsData.teams || []);
              console.log('✅ Teams loaded:', teamsList.length);
              setTeams(teamsList);
              teamsSuccess = true;
              break;
            }
          } catch (err) {
            // Silent fail, try next endpoint
          }
        }

        if (!teamsSuccess) {
          console.info('ℹ️ Using local team data (backend unavailable)');
          setTeams([
            { id: '1', name: 'Powertrain', specialization: 'Powertrain' },
            { id: '2', name: 'Electrical', specialization: 'Electrical' },
            { id: '3', name: 'Brakes', specialization: 'Brakes' },
            { id: '4', name: 'General', specialization: 'General' }
          ]);
        }

        // Fetch members - try multiple endpoints
        const memberEndpoints = [
          `${API_URL}/api/employee/allteam`,
          `${API_URL}/api/employees`,
          `${API_URL}/api/employee/all`,
          `${API_URL}/api/team-members`
        ];

        let membersSuccess = false;
        for (const endpoint of memberEndpoints) {
          try {
            const membersRes = await fetch(endpoint, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (membersRes.ok) {
              const membersData = await membersRes.json();
              if (!mounted) return;
              const membersList = Array.isArray(membersData) ? membersData : (membersData.data || membersData.employees || membersData.members || []);
              
              // Normalize member data
              const normalizedMembers = membersList.map((m: any) => ({
                id: String(m.id ?? m.employeeId ?? m.userId ?? Math.random().toString()),
                employeeId: m.employeeId,
                userId: m.userId,
                name: m.fullName || m.name || m.username || m.firstName && m.lastName ? `${m.firstName} ${m.lastName}` : `Employee ${m.id}`,
                fullName: m.fullName,
                username: m.username,
                team: m.team || m.teamName || m.specialization || m.department,
                teamName: m.teamName,
                specialization: m.specialization || m.department,
                productivity: m.productivity || m.productivityScore
              }));
              
              console.log('✅ Members loaded:', normalizedMembers.length);
              setBackendMembers(normalizedMembers);
              membersSuccess = true;
              break;
            }
          } catch (err) {
            // Silent fail, try next endpoint
          }
        }

        if (!membersSuccess) {
          console.info('ℹ️ Using local member data (backend unavailable)');
          setBackendMembers([
            { id: '1', name: 'John Doe', team: 'Powertrain', specialization: 'Powertrain' },
            { id: '2', name: 'Jane Smith', team: 'Electrical', specialization: 'Electrical' },
            { id: '3', name: 'Mike Johnson', team: 'Brakes', specialization: 'Brakes' },
            { id: '4', name: 'Sarah Williams', team: 'General', specialization: 'General' }
          ]);
        }

      } catch (err) {
        console.error('Error fetching backend data:', err);
        if (mounted) {
          setError('Failed to load team data, using defaults');
          // Set fallback data
          setTeams([
            { id: '1', name: 'Powertrain', specialization: 'Powertrain' },
            { id: '2', name: 'Electrical', specialization: 'Electrical' },
            { id: '3', name: 'Brakes', specialization: 'Brakes' },
            { id: '4', name: 'General', specialization: 'General' }
          ]);
          setBackendMembers([
            { id: '1', name: 'John Doe', team: 'Powertrain', specialization: 'Powertrain' },
            { id: '2', name: 'Jane Smith', team: 'Electrical', specialization: 'Electrical' },
            { id: '3', name: 'Mike Johnson', team: 'Brakes', specialization: 'Brakes' },
            { id: '4', name: 'Sarah Williams', team: 'General', specialization: 'General' }
          ]);
        }
      }
    };

    fetchBackendData();
    return () => { mounted = false; };
  }, []);

  // Derive specialization list from backend teams
  const specializations = React.useMemo(() => {
    if (teams && teams.length > 0) {
      const set = new Set<string>();
      teams.forEach((t) => {
        const spec = t.specialization || t.speciality || 'General';
        set.add(spec);
      });
      return ['All', ...Array.from(set)];
    }
    return ['All', 'Powertrain', 'Electrical', 'Brakes', 'General'];
  }, [teams]);

  // Convert display status to backend format
  const convertStatusToBackend = (status: string): string => {
    const statusMap: Record<string, string> = {
      'Pending': 'PENDING',
      'Confirmed': 'CONFIRMED',
      'In Progress': 'IN_SERVICE',
      'Ready': 'READY',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED',
      'Overdue': 'OVERDUE'
    };
    return statusMap[status] || status.toUpperCase().replace(/\s+/g, '_');
  };

  // Update project status via API - Use correct backend endpoint
  const updateProjectStatus = async (projectId: string | number, status: string, progress: number, completedDate?: string | null) => {
    const token = getToken();
    if (!token) {
      console.warn('No token available for project status update');
      return false;
    }

    // Convert status to backend format
    const backendStatus = convertStatusToBackend(status);
    
    console.log(`🔄 Updating appointment ${projectId}:`, {
      displayStatus: status,
      backendStatus: backendStatus,
      progress: progress,
      completedDate: completedDate
    });

    // Use the correct endpoint from backend
    const endpoint = `${API_URL}/api/employee/appointments/${projectId}/status`;
    
    const payload = {
      status: backendStatus
    };
    
    try {
      console.log(`📤 Sending PUT to: ${endpoint} with payload:`, payload);
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log(`📡 Response status: ${response.status}`);

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        console.log(`✅ Status updated successfully:`, responseData);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ PUT ${endpoint} returned ${response.status}:`, errorText);
        return false;
      }
    } catch (err) {
      console.error(`❌ Failed to update status:`, err);
      return false;
    }
  };

  // Update project team assignment via API - Try multiple endpoints
  const updateProjectTeam = async (projectId: string | number, teamId: string, memberIds: string[]) => {
    const token = getToken();
    if (!token) {
      console.warn('No token available for team assignment update');
      return true; // Return true to keep local changes
    }

    const endpoints = [
      `${API_URL}/api/employee/projects/${projectId}/team`,
      `${API_URL}/api/projects/${projectId}/team`,
      `${API_URL}/api/employee/${employeeId}/projects/${projectId}/assign`,
      `${API_URL}/api/projects/${projectId}/assign-team`
    ];

    const payload = {
      teamId,
      employeeIds: memberIds,
      // Include alternative field names
      team_id: teamId,
      employee_ids: memberIds,
      memberIds: memberIds,
      assignedEmployees: memberIds
    };

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log('✅ Team assigned successfully');
          return true;
        }
      } catch (err) {
        // Silent fail, try next endpoint
      }
    }

    console.info('ℹ️ Backend unavailable - team assignment saved locally only');
    return true; // Keep local changes even if backend fails
  };

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

  const selectClass = (status: string) => {
    switch (status) {
      case "Completed":
        return `${projStyles.filterBtn} ${projStyles.selectCompleted}`;
      case "In Progress":
        return `${projStyles.filterBtn} ${projStyles.selectInProgress}`;
      case "Ready":
        return `${projStyles.filterBtn} ${projStyles.selectConfirmed}`;
      case "Confirmed":
        return `${projStyles.filterBtn} ${projStyles.selectConfirmed}`;
      case "Overdue":
        return `${projStyles.filterBtn} ${projStyles.selectOverdue}`;
      case "Cancelled":
        return `${projStyles.filterBtn} ${projStyles.selectCancelled}`;
      case "Pending":
      default:
        return `${projStyles.filterBtn} ${projStyles.selectPending}`;
    }
  };

  async function handleStatusChange(index: number, value: string) {
    const project = rows[index];
    if (!project) return;

    const prevStatus = project.status;
    let newProgress = project.progress;
    let newCompletedDate = project.completedDate;
    let newStartDate = project.startDate;

    // Auto-set progress, dates based on status
    if (value === "Completed") {
      newProgress = 100;
      if (prevStatus !== "Completed") {
        const d = new Date();
        newCompletedDate = d.toISOString().split('T')[0];
      }
    } else if (value === "In Progress") {
      // Set progress to 50% if not already set
      newProgress = newProgress < 50 ? 50 : newProgress;
      newCompletedDate = null;
      // Set start date if not already set
      if (!newStartDate) {
        const d = new Date();
        newStartDate = d.toISOString().split('T')[0];
      }
    } else if (value === "Ready") {
      newProgress = 40;
      newCompletedDate = null;
    } else if (value === "Confirmed") {
      newProgress = 25;
      newCompletedDate = null;
    } else if (value === "Pending") {
      newProgress = 0;
      newCompletedDate = null;
    } else if (value === "Overdue") {
      // Keep current progress
      newCompletedDate = null;
    } else {
      newCompletedDate = null;
    }

    // Update locally first
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        status: value,
        progress: newProgress,
        completedDate: newCompletedDate,
        startDate: newStartDate
      };
      return copy;
    });

    // Update backend
    const projectId = project.id || project.projectId;
    if (projectId) {
      const success = await updateProjectStatus(projectId, value, newProgress, newCompletedDate);
      if (!success) {
        // Revert on failure
        setRows((prev) => {
          const copy = [...prev];
          copy[index] = project;
          return copy;
        });
        alert('Failed to update project status. Please try again.');
      } else {
        console.log(`✅ Status changed from "${prevStatus}" to "${value}"`);
        // Show success message in console
        console.log(`✅ Status updated to "${value}" successfully!`);
        
        if (onUpdate) {
          // Notify parent to refetch data on success
          console.log('🔄 Triggering data refresh...');
          setTimeout(() => onUpdate(), 500); // Small delay to allow backend to update
        }
      }
    }
  }

  function toggleTeamDropdown(index: number, triggerEl?: HTMLElement) {
    setOpenTeamIndex((prev) => {
      const next = prev === index ? null : index;
      
      if (next === index) {
        const current = rows[index]?.selectedTeam ?? [];
        setTempSelected(Array.isArray(current) ? [...current] : []);
        
        try {
          if (triggerEl) {
            const rect = triggerEl.getBoundingClientRect();
            const dropdownEstimate = 300;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = spaceBelow < dropdownEstimate && rect.top > dropdownEstimate;
            setOpenTeamUpIndex(openUp ? index : null);
            
            setDropdownStyles((prev) => ({
              ...prev,
              [index]: {
                position: 'fixed',
                left: rect.left,
                top: openUp ? Math.max(8, rect.top - dropdownEstimate) : rect.bottom,
                minWidth: Math.max(rect.width, 240),
                zIndex: 1000
              },
            }));
          }
        } catch (e) {
          console.error('Error positioning dropdown:', e);
        }
      } else {
        setTempSelected([]);
        setOpenTeamUpIndex(null);
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
    setTempSelected((prev) => {
      const s = new Set(prev);
      if (s.has(memberId)) {
        s.delete(memberId);
      } else {
        s.add(memberId);
      }
      return Array.from(s);
    });
  }

  async function confirmTeamSelection(rowIndex: number) {
    const project = rows[rowIndex];
    if (!project) return;

    const teamName = project.teamName;
    const teamId = project.teamId || teams.find(t => t.name === teamName || t.teamName === teamName)?.id;

    // Update locally
    setRows((prev) => {
      const copy = [...prev];
      const row = { ...copy[rowIndex] };
      row.selectedTeam = [...tempSelected];
      
      // Ensure team array is populated
      if (!row.team || row.team.length === 0) {
        if (teamName && backendMembers.length > 0) {
          row.team = backendMembers
            .filter((m) => 
              m.team === teamName || 
              m.teamName === teamName || 
              m.specialization === teamName
            )
            .map((m) => ({
              id: m.id,
              name: m.name
            }));
        }
      }
      
      copy[rowIndex] = row;
      return copy;
    });

    // Update backend
    const projectId = project.id || project.projectId;
    if (projectId && teamId) {
      const success = await updateProjectTeam(projectId, teamId, tempSelected);
      if (!success) {
        alert('Failed to update team assignment');
      }
    }

    setOpenTeamIndex(null);
    setTempSelected([]);
  }

  function cancelTeamSelection() {
    setOpenTeamIndex(null);
    setTempSelected([]);
  }

  function openDetails(rowIndex: number) {
    setSelectedProject(rows[rowIndex]);
  }

  function closeDetails() {
    setSelectedProject(null);
  }

  async function markSelectedComplete() {
    if (!selectedProject) return;
    
    const idx = rows.findIndex((r) => 
      (r.id && r.id === selectedProject.id) || 
      (r.name === selectedProject.name && r.due === selectedProject.due)
    );
    
    if (idx === -1) return;
    
    await handleStatusChange(idx, "Completed");
    
    setTimeout(() => {
      setSelectedProject((prev) => {
        if (!prev) return null;
        return { ...rows[idx] };
      });
    }, 100);
  }

  async function saveSelectedProject() {
    if (!selectedProject) return;
    
    const idx = rows.findIndex((r) => 
      (r.id && r.id === selectedProject.id) || 
      (r.name === selectedProject.name && r.due === selectedProject.due)
    );
    
    if (idx === -1) return;

    // Update locally
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...selectedProject };
      return copy;
    });

    // Update backend - try multiple endpoints
    const projectId = selectedProject.id || selectedProject.projectId;
    if (projectId) {
      const token = getToken();
      if (token) {
        const endpoints = [
          `${API_URL}/api/employee/projects/${projectId}`,
          `${API_URL}/api/projects/${projectId}`,
          `${API_URL}/api/employee/${employeeId}/projects/${projectId}`
        ];

        const payload = {
          startDate: selectedProject.startDate,
          completedDate: selectedProject.completedDate,
          progress: selectedProject.progress,
          status: selectedProject.status,
          // Alternative field names
          start_date: selectedProject.startDate,
          completed_date: selectedProject.completedDate,
          percentComplete: selectedProject.progress,
          projectStatus: selectedProject.status
        };

        let saveSuccess = false;
        for (const endpoint of endpoints) {
          try {
            console.log('Attempting to save project at:', endpoint);
            const response = await fetch(endpoint, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              console.log('✅ Project saved successfully');
              saveSuccess = true;
              break;
            } else {
              const errorText = await response.text();
              console.warn(`Save failed at ${endpoint}: ${response.status} - ${errorText}`);
            }
          } catch (err) {
            console.error(`Error saving at ${endpoint}:`, err);
          }
        }

        if (!saveSuccess) {
          console.warn('⚠️ Failed to save to backend, changes kept locally');
          // Don't show alert, just keep local changes
        }
      }
    }

    setTimeout(() => {
      setSelectedProject({ ...rows[idx] });
    }, 100);
  }

  // Get members for a specific team
  const getMembersForTeam = (teamName: string): Member[] => {
    if (!teamName || !backendMembers.length) return [];
    
    return backendMembers.filter((m) => 
      m.team === teamName || 
      m.teamName === teamName || 
      m.specialization === teamName
    );
  };

  return (
    <div className={projStyles.tableWrap}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-500">
                No projects found
              </td>
            </tr>
          ) : (
            rows.map((p, i) => (
              <tr key={p.id || p.name}>
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
                    <option>Confirmed</option>
                    <option>Ready</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Overdue</option>
                    <option>Cancelled</option>
                  </select>
                </td>
                <td style={{ color: "#6b7280" }}>{p.due}</td>
                <td style={{ color: "#6b7280" }}>
                  {p.completedDate || "Pending"}
                </td>
                <td>
                  <div style={{ position: "relative" }}>
                    <div>
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <div style={{ fontWeight: 700 }}>{rowSpecs[i] ?? 'All'}</div>
                          <div style={{ color: '#6b7280' }}>{p.teamName ?? 'Select team'}</div>
                        </div>
                      </div>
                      <div
                        className={projStyles.teamAvatars}
                        data-row-index={i}
                        onClick={(e) => toggleTeamDropdown(i, e.currentTarget as HTMLElement)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            toggleTeamDropdown(i, e.currentTarget as HTMLElement);
                          }
                        }}
                        aria-label={`Team members for ${p.name}`}
                      >
                        {(() => {
                          const teamName = p.teamName;
                          const allMembers = getMembersForTeam(teamName || '');
                          
                          const assigned = p.selectedTeam && p.selectedTeam.length > 0
                            ? allMembers.filter((m) => p.selectedTeam?.includes(m.id))
                            : [];
                          
                          const shown = assigned.length > 0 
                            ? assigned.slice(0, 3) 
                            : allMembers.slice(0, 3);

                          if (allMembers.length === 0) {
                            return (
                              <div className={projStyles.avatarInitialSmall} title="No members">
                                T
                              </div>
                            );
                          }

                          return (
                            <>
                              {shown.map((m) => (
                                <div 
                                  key={m.id} 
                                  className={projStyles.avatarInitialSmall} 
                                  title={m.name}
                                >
                                  {getInitials(m.name)}
                                </div>
                              ))}
                              {assigned.length > 3 && (
                                <div className={projStyles.memberChipOverflow}>
                                  +{assigned.length - 3}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {openTeamIndex === i && (
                        <div 
                          className={`${projStyles.teamDropdown} ${openTeamUpIndex === i ? projStyles.teamDropdownUp : ""}`}
                          style={dropdownStyles[i]}
                          role="dialog" 
                          aria-label={`Select team members for ${p.name}`}
                        >
                          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexDirection: 'column' }}>
                              {/* Specialization select */}
                              <select
                                aria-label={`Select specialization for ${p.name}`}
                                value={rowSpecs[i] ?? 'All'}
                                onChange={(e) => {
                                  const spec = e.target.value;
                                  setRowSpecs((prev) => ({ ...prev, [i]: spec }));
                                  
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[i] = {
                                      ...copy[i],
                                      teamName: '',
                                      teamId: undefined,
                                      team: [],
                                      selectedTeam: []
                                    };
                                    return copy;
                                  });
                                  setTempSelected([]);
                                }}
                                className={projStyles.teamSelect}
                                style={{ width: '100%' }}
                              >
                                {specializations.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>

                              {/* Team select */}
                              <select
                                aria-label={`Select team for ${p.name}`}
                                value={p.teamName ?? ''}
                                onChange={(e) => {
                                  const teamName = e.target.value;
                                  const selectedTeam = teams.find(t => 
                                    t.name === teamName || t.teamName === teamName
                                  );
                                  
                                  const members = getMembersForTeam(teamName);
                                  
                                  setRows((prev) => {
                                    const copy = [...prev];
                                    copy[i] = {
                                      ...copy[i],
                                      teamName: teamName,
                                      teamId: selectedTeam?.id,
                                      team: members.map(m => ({ id: m.id, name: m.name }))
                                    };
                                    return copy;
                                  });
                                  
                                  setTempSelected(p.selectedTeam || []);
                                }}
                                className={projStyles.teamSelect}
                                style={{ width: '100%' }}
                              >
                                <option value="">Select team</option>
                                {teams
                                  .filter((t) => {
                                    const spec = t.specialization || t.speciality || 'General';
                                    return rowSpecs[i] === 'All' || spec === rowSpecs[i];
                                  })
                                  .map((t) => (
                                    <option key={t.id} value={t.name || t.teamName}>
                                      {t.name || t.teamName}
                                    </option>
                                  ))
                                }
                              </select>
                            </div>
                          </div>

                          <div className={projStyles.teamList}>
                            {(() => {
                              const members = getMembersForTeam(p.teamName || '');
                              
                              if (members.length === 0) {
                                return (
                                  <div className={projStyles.teamRow}>
                                    <div style={{ color: '#6b7280' }}>
                                      No members for selected team
                                    </div>
                                  </div>
                                );
                              }

                              return members.map((m) => (
                                <label key={m.id} className={projStyles.teamRow}>
                                  <input
                                    type="checkbox"
                                    checked={tempSelected.includes(m.id)}
                                    onChange={() => handleMemberToggle(i, m.id)}
                                  />
                                  <span style={{ marginLeft: 8 }}>{m.name}</span>
                                </label>
                              ));
                            })()}
                          </div>

                          <div className={projStyles.teamDropdownFooter}>
                            <button 
                              className={projStyles.btnSecondary} 
                              onClick={cancelTeamSelection}
                            >
                              Cancel
                            </button>
                            <button 
                              className={projStyles.btnPrimary} 
                              onClick={() => confirmTeamSelection(i)}
                            >
                              Confirm
                            </button>
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
                    className="p-2 rounded hover:bg-indigo-50 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5z" fill="#6b46f6" />
                      <circle cx="12" cy="12" r="2.6" fill="#ffffff" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Details Modal */}
      {selectedProject && (
        <div>
          <div
            className="fixed top-0 right-0 bottom-0 bg-black/40 backdrop-blur-sm z-50"
            style={{ left: "16.666667%" }}
            onClick={closeDetails}
          ></div>
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <div className={projStyles.modal} role="dialog" aria-label={`Details for ${selectedProject.name}`}>
              <div className={projStyles.modalHeader}>
                <h2>{selectedProject.name}</h2>
                <div className={projStyles.modalSubtitle}>{selectedProject.client}</div>
              </div>

              <div className={projStyles.modalBody}>
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Status</div>
                  <div className={projStyles.modalValue}>
                    <span className={statusBadgeClass(selectedProject.status)}>
                      {selectedProject.status}
                    </span>
                  </div>
                </div>
                
                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Progress</div>
                  <div className={projStyles.modalValue}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={selectedProject.progress}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        setSelectedProject((prev) => prev ? { ...prev, progress: val } : null);
                      }}
                      className={projStyles.inputField}
                      style={{ width: '80px' }}
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>

                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Start Date</div>
                  <div className={projStyles.modalValue}>
                    <input
                      id="startDateInput"
                      type="date"
                      value={selectedProject.startDate || ""}
                      onChange={(e) => {
                        setSelectedProject((prev) => 
                          prev ? { ...prev, startDate: e.target.value } : null
                        );
                      }}
                      className={projStyles.inputField}
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
                    <input
                      id="completedDateInput"
                      type="date"
                      value={selectedProject.completedDate || ""}
                      onChange={(e) => {
                        setSelectedProject((prev) => 
                          prev ? { ...prev, completedDate: e.target.value } : null
                        );
                      }}
                      className={projStyles.inputField}
                      disabled={selectedProject.status !== 'Completed'}
                    />
                  </div>
                </div>

                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Days to Complete</div>
                  <div className={projStyles.modalValue}>
                    {selectedProject.startDate && selectedProject.completedDate
                      ? `${Math.round(
                          (new Date(selectedProject.completedDate).getTime() - 
                           new Date(selectedProject.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )} day(s)`
                      : "—"}
                  </div>
                </div>

                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Team</div>
                  <div className={projStyles.modalValue}>{selectedProject.teamName || 'Not assigned'}</div>
                </div>

                <div className={projStyles.modalRow}>
                  <div className={projStyles.modalField}>Assigned Members</div>
                  <div className={projStyles.modalValue}>
                    {(() => {
                      const members = getMembersForTeam(selectedProject.teamName || '');
                      const assigned = selectedProject.selectedTeam || [];
                      
                      if (assigned.length === 0) return 'None';
                      
                      return assigned
                        .map(id => members.find(m => m.id === id)?.name)
                        .filter(Boolean)
                        .join(', ') || 'None';
                    })()}
                  </div>
                </div>
              </div>

              <div className={projStyles.modalActions}>
                {selectedProject.status !== 'Completed' ? (
                  <button 
                    className={projStyles.btnPrimary} 
                    onClick={markSelectedComplete}
                  >
                    Mark Complete
                  </button>
                ) : (
                  <div className="text-sm text-gray-600">Project completed</div>
                )}
                <div className="flex gap-2">
                  <button 
                    className={projStyles.btnPrimary} 
                    onClick={saveSelectedProject}
                  >
                    Save Changes
                  </button>
                  <button 
                    className={projStyles.btnSecondary} 
                    onClick={closeDetails}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}