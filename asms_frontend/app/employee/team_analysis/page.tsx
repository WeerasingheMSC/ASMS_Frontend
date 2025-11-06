"use client";
import React, { useEffect, useState } from 'react';
import projectsApi from '../../lib/projectsApi';
import { Users, Clock, TrendingUp, Activity, CheckCircle, AlertCircle, Award, BarChart3 } from 'lucide-react';
import TeamDetails from '../../components/team/team-details';
import { getToken } from '../../utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TeamAnalysis() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeProjects: 0,
    totalHoursLogged: 0,
    completionRate: 0,
    avgProductivity: 0,
  });

  type Project = { name?: string; status?: string; teamName?: string; hoursLogged?: number };
  const [projects, setProjects] = useState<Project[]>([]);
  const [backendTeams, setBackendTeams] = useState<any[]>([]);
  const [backendTeamStats, setBackendTeamStats] = useState<any[]>([]);
  const [backendMembers, setBackendMembers] = useState<any[]>([]);
  const [showTeamDetailsModal, setShowTeamDetailsModal] = useState(false);
  const [selectedBackendTeamId, setSelectedBackendTeamId] = useState<string | null>(null);

  // displayTeams is derived from backendTeams when available, otherwise use the static `teams` below
  const displayTeams = backendTeams.length > 0
    ? backendTeams.map((t: any) => ({
        id: String(t.id),
        name: t.name || t.teamName || `Team ${t.id}`,
        color: t.color || 'bg-gray-500',
        specialization: t.specialization || t.speciality || 'General'
      }))
    : null;

  // specialization filter state
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('All');

  // helper to compute average productivity from backend members
  const getAverageProductivity = (tName?: string) => {
    const list = (tName && tName !== 'All Teams') ? backendMembers.filter((m:any) => m.teamName === tName || m.team === tName) : backendMembers;
    if (!list || list.length === 0) return 0;
    const total = list.reduce((acc:any, m:any) => acc + (m.productivity || 0), 0);
    return Math.round(total / list.length);
  };

  // load projects from API or localStorage and listen for updates
  useEffect(() => {
    let mounted = true;

    projectsApi.fetchProjects()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setProjects(data as Project[]);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem('asms_projects');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setProjects(parsed as Project[]);
          }
        } catch (e) {
          // ignore
        }
      });

    function onUpdate() {
      try {
        const raw = localStorage.getItem('asms_projects');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setProjects(parsed as Project[]);
        }
      } catch (e) {
        // ignore
      }
    }

    window.addEventListener('asms_projects_updated', onUpdate);
    const onStorage = (e: StorageEvent) => { if (e.key === 'asms_projects') onUpdate(); };
    window.addEventListener('storage', onStorage);

    return () => { mounted = false; window.removeEventListener('asms_projects_updated', onUpdate); window.removeEventListener('storage', onStorage); };
  }, []);

  // recompute aggregated stats when projects or selectedTeam change
  useEffect(() => {
    // find the selected team name from backend teams (fallback to static teams array)
    const displayTeams = backendTeams.length > 0
      ? backendTeams.map((t: any) => ({ id: String(t.id), name: t.name || t.teamName || `Team ${t.id}`, color: t.color || 'bg-gray-500' }))
      : teams;

    const teamObj = displayTeams.find((t) => t.id === selectedTeam);
    const teamName = teamObj ? teamObj.name : undefined;

    // projects filtered for the selected team
  const filtered = teamName && teamName !== 'All Teams' ? projects.filter((p) => String(p.teamName || '') === String(teamName) || (Array.isArray((p as any).team) && (p as any).team.some((tm:any) => String(tm.name) === String(teamName)))) : projects;

    const total = filtered.length;
    const active = filtered.filter((p) => p.status === 'In Progress').length;
    const completed = filtered.filter((p) => p.status === 'Completed').length;
    const hours = filtered.reduce((acc, p) => acc + (Number(p.hoursLogged || 0)), 0);
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    // compute average productivity based on team members' working-hours using computeMemberProductivity
    const teamMembers = teamName && teamName !== 'All Teams' ? backendMembers.filter((m:any) => String(m.team) === String(teamName) || String(m.teamName) === String(teamName)) : backendMembers;
    const totalMembersCount = teamMembers.length;
    const avgProductivity = totalMembersCount > 0 ? Math.round(teamMembers.reduce((acc:any, mem:any) => acc + computeMemberProductivity(mem), 0) / totalMembersCount) : 0;

    setTeamStats({
      totalMembers: totalMembersCount,
      activeProjects: active,
      totalHoursLogged: hours,
      completionRate,
      avgProductivity,
    });
  }, [projects, selectedTeam]);

  // fetch teams and team stats from backend so we can show the same details as Team page
  useEffect(() => {
    let mounted = true;

    const token = getToken();
    if (!token) return;

    (async () => {
      try {
        const tResp = await fetch(`${API_URL}/api/employee/teams/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (tResp.ok) {
          const tData = await tResp.json();
          if (!mounted) return;
          setBackendTeams(Array.isArray(tData) ? tData : (tData.data || []));
        }
      } catch (e) {
        // ignore - analysis page can still function with local data
      }

      try {
        const sResp = await fetch(`${API_URL}/api/employee/all-teams-stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (sResp.ok) {
          const sData = await sResp.json();
          if (!mounted) return;
          setBackendTeamStats(Array.isArray(sData) ? sData : (sData.data || []));
        }
      } catch (e) {
        // ignore
      }
      // fetch all members
      try {
        const mResp = await fetch(`${API_URL}/api/employee/allteam`, { headers: { Authorization: `Bearer ${token}` } });
        if (mResp.ok) {
          const mData = await mResp.json();
          if (!mounted) return;
          const rawMembers = Array.isArray(mData) ? mData : (mData.data || []);

          // normalize backend member objects to ensure `name`, `team`, `teamColor`, `avatar`, `productivity` exist
          const members = rawMembers.map((m: any) => {
            const fullName = m.fullName || m.full_name || ((m.firstName || m.first_name || '') + ' ' + (m.lastName || m.last_name || '')).trim();
            const name = fullName || m.name || m.username || m.displayName || `Member ${m.id || ''}`;
            const team = m.team || m.teamName || m.team_name || m.specialization || 'Unassigned';
            const teamColor = m.teamColor || m.team_color || m.color || 'bg-gray-500';
                const avatar = m.avatar || (name ? (name.split(' ').map((p: string) => p[0]).join('').slice(0,2)) : '');
                // try to extract any working-hours-like field from backend member object
                const workingHours = m.workingHours ?? m.working_hours ?? m.hoursLogged ?? m.hours ?? m.totalHours ?? m.weekHours ?? m.monthHours ?? null;
                const productivity = m.productivity ?? m.productivityScore ?? m.score ?? null;

            return {
              ...m,
              id: m.id ?? m.employeeId ?? m.userId,
              name,
              fullName: fullName || name,
              team,
              teamColor,
              avatar,
                  productivity,
                  workingHours,
            };
          });

          setBackendMembers(members);
        }
      } catch (e) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, []);

  const teams = [
    { id: 'all', name: 'All Teams', color: 'bg-gray-500' },
    { id: 'engine', name: 'Engine Team', color: 'bg-blue-500' },
    { id: 'transmission', name: 'Transmission Team', color: 'bg-green-500' },
    { id: 'electrical', name: 'Electrical Team', color: 'bg-yellow-500' },
    { id: 'brakes', name: 'Brakes Team', color: 'bg-red-500' }
  ];

  // choose which teams list to render (backend if present, otherwise static)
  const teamsToRender = displayTeams && displayTeams.length > 0 ? displayTeams : teams;

  // compute specialization list from teamsToRender
  const specializations = Array.from(new Set((teamsToRender || []).map((t:any) => (t.specialization || 'General'))));
  const specsToRender = ['All', ...specializations];

  // filtered teams based on selected specialization
  const filteredTeams = (teamsToRender || teams).filter((t:any) => selectedSpecialization === 'All' || (t.specialization || 'General') === selectedSpecialization);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Almost Done': return 'bg-blue-950 text-blue-700';
      case 'On Track': return 'bg-emerald-100 text-emerald-700';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700';
      case 'Started': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProductivityRating = (score: number) => {
    if (score >= 95) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 90) return { label: 'Great', color: 'text-blue-600' };
    if (score >= 85) return { label: 'Good', color: 'text-yellow-600' };
    return { label: 'Average', color: 'text-orange-600' };
  };

  // compute productivity percentage for a member based on working hours and team expected hours
  const computeMemberProductivity = (member: any) => {
    try {
      const memberHours = Number(member.workingHours ?? member.working_hours ?? member.hoursLogged ?? member.hours ?? member.totalHours ?? 0) || 0;

      // find team stat for expected hours
      const stat = backendTeamStats.find((s:any) => String(s.teamId) === String(member.teamId) || (s.teamName || s.team_name) === (member.team || member.teamName));
      const teamTotalHours = stat?.totalWorkingHours ?? stat?.total_working_hours ?? stat?.totalHours ?? null;
      const teamMemberCount = (stat?.totalMembers ?? stat?.memberCount ?? backendMembers.filter((m:any) => (m.team || m.teamName) === (member.team || member.teamName)).length) || 0;

      // expected hours per member: prefer teamTotalHours/teamMemberCount; fallback to 8 (hours/day)
      const expectedPerMember = (typeof teamTotalHours === 'number' && teamMemberCount > 0) ? (teamTotalHours / teamMemberCount) : 8;

      // If we have working-hours data, compute productivity from hours
      if (memberHours > 0) {
        if (expectedPerMember <= 0) return 0;
        let pct = Math.round((memberHours / expectedPerMember) * 100);
        if (!Number.isFinite(pct)) pct = 0;
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        return pct;
      }

      // Fallback: derive productivity from assigned projects' average progress when hours are missing
      try {
        const assigned = (projects || []).filter((p: any) => {
          // same assignment heuristics as derivedMembers
          if (Array.isArray((p as any).selectedTeam) && (p as any).selectedTeam.length > 0) {
            const sel = (p as any).selectedTeam.map((id: any) => String(id));
            if (sel.includes(String(member.id))) return true;
          }
          if (Array.isArray((p as any).team) && (p as any).team.length > 0) {
            if ((p as any).team.some((tm: any) => String(tm.id) === String(member.id) || String(tm.name) === String(member.name))) return true;
          }
          if (p && typeof p.teamName === 'string' && String(p.teamName) === String(member.team)) return true;
          return false;
        });

        if (!assigned || assigned.length === 0) return 0;
        // consider only non-completed projects for productivity estimation
        const relevant = assigned.filter((p: any) => String(p.status) !== 'Completed');
        const src = relevant.length ? relevant : assigned;
        const avgProgress = src.reduce((acc: number, p: any) => acc + (Number(p.progress ?? 0)), 0) / src.length;
        const pct = Math.round(Number.isFinite(avgProgress) ? avgProgress : 0);
        return Math.max(0, Math.min(100, pct));
      } catch (e) {
        return 0;
      }
    } catch (e) {
      return 0;
    }
  };

  // derive the members to show based on selectedTeam using sharedMembers and assigned projects
  const derivedMembers: any[] = (() => {
    const teamObj = teamsToRender.find((t) => t.id === selectedTeam);
    const teamName = teamObj ? teamObj.name : undefined;

    const membersToShow = teamName && teamName !== 'All Teams'
      ? backendMembers.filter((m:any) => (m.team === teamName || m.teamName === teamName))
      : backendMembers;

      // For each member, compute assigned projects (projects where selectedTeam includes member.id)
    return membersToShow.map((m: any) => {
      // find projects assigned to this member
      const assignedProjects = (projects || []).filter((p: any) => {
        // prefer selectedTeam array saved by ProjectsTable (explicit per-member assignment)
        if (Array.isArray((p as any).selectedTeam) && (p as any).selectedTeam.length > 0) {
          // compare ids as strings to avoid number/string mismatches
          const sel = (p as any).selectedTeam.map((id: any) => String(id));
          return sel.includes(String(m.id));
        }

        // next fallback: if project.team array exists with id/name entries, check id or name
        if (Array.isArray((p as any).team) && (p as any).team.length > 0) {
          if ((p as any).team.some((tm: any) => String(tm.id) === String(m.id) || String(tm.name) === String(m.name))) return true;
        }

        // final fallback: if the project has a teamName string (team-level assignment), match by team name
        if (p && typeof p.teamName === 'string' && String(p.teamName) === String(m.team)) return true;

        return false;
      });

    const activeProjects = assignedProjects.filter((p: any) => p.status === 'In Progress').length;
    const completedProjects = assignedProjects.filter((p: any) => p.status === 'Completed').length;
    // Compute productivity from working hours (member-level) relative to team expected hours
    const productivity = computeMemberProductivity(m);
      // (on-time delivery removed) -- we now focus on productivity percentage
      // show only current (non-completed) projects in the "Current Projects Progress" section
      const projectProgress = assignedProjects
        .filter((p: any) => String(p.status) !== 'Completed')
        .map((p: any) => ({ name: p.name, progress: Number(p.progress ?? 0), status: p.status ?? 'Pending' }));

      return {
        id: m.id,
        name: m.name,
        team: m.team || m.teamName,
        teamColor: m.teamColor || m.teamColor,
  avatar: m.avatar || ( (m.name || '').split(' ').map((n: string) => n[0]).join('').slice(0,2) ),
        activeProjects,
        completedProjects,
  // removed weekly/monthly hour fields
        productivity,
        projectProgress,
        assignedProjects,
      };
    });
  })();

  // update project progress (updates projects state and persists to localStorage / backend)
  const updateProjectProgress = async (projectName: string, newProgress: number) => {
    // update local state
    const updated = (projects || []).map((p: any) => {
      if (String(p.name) === String(projectName) && p.status === 'In Progress') {
        return { ...p, progress: Number(newProgress) };
      }
      return p;
    });

    setProjects(updated as Project[]);

    // persist: try to save to backend, and always write local copy
    try {
      await projectsApi.saveProjects(updated as any);
    } catch (e) {
      // ignore save errors
    }
    try { projectsApi.writeLocalProjects(updated as any); } catch (e) {}

    // notify in-tab listeners
    try { window.dispatchEvent(new Event('asms_projects_updated')); } catch (e) {}
  };

  // allow adjusting progress by clicking/dragging the progress bar (pointer events)
  const handleBarPointerDown = (projectName: string) => (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    const computeAndUpdate = (clientX: number) => {
      let percent = Math.round(((clientX - rect.left) / rect.width) * 100);
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;
      updateProjectProgress(projectName, percent);
    };

    // update once on pointer down
    computeAndUpdate((e as any).clientX || 0);

    const onMove = (ev: PointerEvent) => computeAndUpdate(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Analysis</h1>
              <p className="text-gray-600 mt-2">Comprehensive performance analytics and member progress tracking</p>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-950 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamStats.totalMembers}</div>
                  <div className="text-xs text-gray-600">Total Members</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamStats.activeProjects}</div>
                  <div className="text-xs text-gray-600">Active Projects</div>
                </div>
              </div>
            </div>

            {/* Hours This Month card removed per request */}

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamStats.completionRate}%</div>
                  <div className="text-xs text-gray-600">Completion Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{teamStats.avgProductivity}%</div>
                  <div className="text-xs text-gray-600">Avg Productivity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Specialization Filter */}
          <div className="flex gap-2 mt-6">
            {specsToRender.map((spec) => (
              <button
                key={spec}
                onClick={() => { setSelectedSpecialization(spec); setSelectedTeam('all'); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${selectedSpecialization === spec ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Team Filter (filtered by specialization) */}
          <div className="flex gap-2 mt-4">
            {filteredTeams.map((team: any) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTeam === team.id
                    ? `${team.color} text-white`
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>

          {/* Team Summary - show details for selected team if backend data available or fallback to sharedTeams */}
          {selectedTeam !== 'all' && (
            <div className="mt-6">
              {/* try to find a backend stat matching the selected team name first */}
              {(() => {
                const teamObj = teamsToRender.find((t) => t.id === selectedTeam);
                const teamName = teamObj ? teamObj.name : undefined;

                // find backend team by name
                const backendTeam = backendTeams.find((bt: any) => (bt.name || bt.teamName) === teamName);
                const backendStat = backendTeamStats.find((s: any) => String(s.teamName || s.team_name) === teamName || String(s.teamId) === String(backendTeam?.id));

                if (backendTeam || backendStat) {
                  const display = backendTeam ? backendTeam : (backendStat ? {
                    id: backendStat.teamId,
                    name: backendStat.teamName,
                    specialization: backendStat.specialization,
                    memberCount: backendStat.totalMembers,
                    totalWorkingHours: backendStat.totalWorkingHours,
                    averageAge: backendStat.averageAge,
                    description: backendStat.description
                  } : null);

                  // compute team productivity: prefer backend stat if provided, otherwise derive from members' working hours
                  const teamMembers = backendMembers.filter((m:any) => (m.team === display?.name || m.teamName === display?.name));
                  const computedTeamProductivity = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc:any, mem:any) => acc + computeMemberProductivity(mem), 0) / teamMembers.length) : 0;
                  const teamProductivity = backendStat?.averageProductivity ?? backendStat?.avgProductivity ?? computedTeamProductivity ?? 0;

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-semibold">{display?.name}</h2>
                          <p className="text-sm text-gray-600">{display?.specialization || 'Specialization: -'}</p>
                          {display?.description && <p className="text-sm text-gray-700 mt-2">{display.description}</p>}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">Members: {display?.memberCount ?? '-'}</div>
                          <div className="text-sm text-gray-600">Hours/Day: {display?.totalWorkingHours ?? '-'}</div>
                          <div className="text-sm text-gray-600">Avg Age: {display?.averageAge ?? '-'}</div>
                          <div className="text-sm text-gray-600">Productivity: {Number.isFinite(teamStats.avgProductivity) ? `${teamStats.avgProductivity}%` : `${teamProductivity}%`}</div>
                          {backendTeam && (
                            <div className="mt-2">
                              <button
                                onClick={() => { setSelectedBackendTeamId(String(backendTeam.id)); setShowTeamDetailsModal(true); }}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md"
                              >
                                View Full Team Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // fallback: show a simple card using local shared data

            {/* Team Members quick progress list: show each member's current projects progress in one compact view */}
            {selectedTeam !== 'all' && (
              <div className="mt-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Team Members — Current Projects Progress</h3>
                  <div className="space-y-3">
                    {derivedMembers.map((member) => {
                      const current = (member.projectProgress || []);
                      const avg = current.length ? Math.round(current.reduce((acc: number, p: any) => acc + Number(p.progress || 0), 0) / current.length) : null;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.teamColor || 'bg-gray-400'}`}>
                              {member.avatar}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-600">{member.activeProjects} active project{member.activeProjects !== 1 ? 's' : ''}</div>
                            </div>
                          </div>

                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${avg ?? 0}%` }} />
                            </div>
                          </div>

                          <div className="w-12 text-right font-semibold text-gray-900">{avg === null ? 'N/A' : `${avg}%`}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
                const fallback = teamsToRender.find((t) => t.id === selectedTeam);
                return fallback ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-semibold">{fallback.name}</h2>
                      </div>
                      <div className="text-right">
                        <button onClick={() => alert('Open team page to see details')} className="px-3 py-1 bg-gray-200 rounded-md">Open Team</button>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>
      {/* TeamDetails modal from Team page (reused) */}
      {showTeamDetailsModal && selectedBackendTeamId && (
        <TeamDetails
          teamId={selectedBackendTeamId}
          onClose={() => { setShowTeamDetailsModal(false); setSelectedBackendTeamId(null); }}
          onTeamUpdated={() => { /* refresh backend lists if needed */ }}
        />
      )}
          {/* Member Analytics */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="space-y-6">
              {derivedMembers.map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  {/* Member Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 ${member.teamColor} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                        <p className="text-gray-600">{member.team}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className={`text-sm font-semibold ${getProductivityRating(Number(member.productivity)).color}`}>
                            {getProductivityRating(Number(member.productivity)).label} Performer
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{member.activeProjects}</div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{member.completedProjects}</div>
                        <div className="text-xs text-gray-600">Completed</div>
                      </div>
                      {/* Weekly/monthly hours removed as they are not tracked */}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Productivity Score</span>
                        <span className="text-lg font-bold text-gray-900">{member.productivity}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${member.productivity}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Project Progress */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-gray-700" />
                      <h4 className="font-semibold text-gray-900">Current Projects Progress</h4>
                    </div>
                    <div className="space-y-3">
                      {member.projectProgress.map((project: any, idx: React.Key | null | undefined) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{project.name}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(String(project.status ?? ''))}`}>
                              {project.status ?? 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              {/* Progress bar is clickable/draggable to update progress inline */}
                              <div
                                className="relative w-full bg-gray-200 rounded-full h-2 cursor-pointer"
                                onPointerDown={handleBarPointerDown(project.name)}
                                role="slider"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Number(project.progress)}
                                aria-label={`Progress for ${project.name}`}
                              >
                                <div
                                  className={`${member.teamColor} h-2 rounded-full transition-all`}
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                              {project.progress}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }