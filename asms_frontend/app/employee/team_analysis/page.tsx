"use client";
import React, { useEffect, useState } from 'react';
import { teams as sharedTeams, members as sharedMembers, getTeamAverageProductivity } from '../../lib/teamData';
import projectsApi from '../../lib/projectsApi';
import { Users, Clock, TrendingUp, Activity, CheckCircle, AlertCircle, Award, BarChart3 } from 'lucide-react';

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
    const teamObj = sharedTeams.find((t) => t.id === selectedTeam);
    const teamName = teamObj ? teamObj.name : undefined;

    const filtered = teamName && teamName !== 'All Teams' ? projects.filter((p) => (p.teamName || '') === teamName) : projects;

    const total = filtered.length;
    const active = filtered.filter((p) => p.status === 'In Progress').length;
    const completed = filtered.filter((p) => p.status === 'Completed').length;
    const hours = filtered.reduce((acc, p) => acc + (p.hoursLogged || 0), 0);
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    const avgProductivity = teamName && teamName !== 'All Teams' ? getTeamAverageProductivity(teamName) : getTeamAverageProductivity();

    setTeamStats({
      totalMembers: sharedMembers.length,
      activeProjects: active,
      totalHoursLogged: hours,
      completionRate,
      avgProductivity,
    });
  }, [projects, selectedTeam]);

  const teams = [
    { id: 'all', name: 'All Teams', color: 'bg-gray-500' },
    { id: 'engine', name: 'Engine Team', color: 'bg-blue-500' },
    { id: 'transmission', name: 'Transmission Team', color: 'bg-green-500' },
    { id: 'electrical', name: 'Electrical Team', color: 'bg-yellow-500' },
    { id: 'brakes', name: 'Brakes Team', color: 'bg-red-500' }
  ];

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

  // derive the members to show based on selectedTeam using sharedMembers and assigned projects
  const derivedMembers: any[] = (() => {
    const teamObj = teams.find((t) => t.id === selectedTeam);
    const teamName = teamObj ? teamObj.name : undefined;

    const membersToShow = teamName && teamName !== 'All Teams' ? sharedMembers.filter((m) => m.team === teamName) : sharedMembers;

    // For each member, compute assigned projects (projects where selectedTeam includes member.id)
    return membersToShow.map((m) => {
      // find projects assigned to this member
      const assignedProjects = (projects || []).filter((p: any) => {
        // prefer selectedTeam array saved by ProjectsTable (explicit per-member assignment)
        if (Array.isArray((p as any).selectedTeam) && (p as any).selectedTeam.length > 0) {
          return (p as any).selectedTeam.includes(m.id);
        }

        // next fallback: if project.team array exists with id/name entries, check id or name
        if (Array.isArray((p as any).team) && (p as any).team.length > 0) {
          if ((p as any).team.some((tm: any) => String(tm.id) === String(m.id) || tm.name === m.name)) return true;
        }

        // final fallback: if the project has a teamName string (team-level assignment), match by team name
        if (p && typeof p.teamName === 'string' && p.teamName === m.team) return true;

        return false;
      });

      const activeProjects = assignedProjects.filter((p: any) => p.status === 'In Progress').length;
      const completedProjects = assignedProjects.filter((p: any) => p.status === 'Completed').length;
  // weekly/monthly hours are not tracked per-project in this dataset
      const productivity = m.productivity ?? getTeamAverageProductivity(m.team);
      // On-time delivery: percent of completed projects finished on or before their due date
      const completedAssigned = assignedProjects.filter((p: any) => p.status === 'Completed');
      const completedOnTime = completedAssigned.filter((p: any) => {
        try {
          if (!p.completedDate || !p.due) return false;
          const completed = new Date(p.completedDate);
          const due = new Date(p.due);
          // treat equal or earlier as on-time
          return completed.getTime() <= due.getTime();
        } catch (e) {
          return false;
        }
      }).length;
  const onTimeDelivery = completedAssigned.length ? Math.round((completedOnTime / completedAssigned.length) * 100) : null;
      const projectProgress = assignedProjects.map((p: any) => ({ name: p.name, progress: p.progress ?? 0, status: p.status ?? 'Pending' }));

      return {
        id: m.id,
        name: m.name,
        team: m.team,
        teamColor: m.teamColor,
        avatar: m.avatar || m.name.split(' ').map(n=>n[0]).join('').slice(0,2),
        activeProjects,
        completedProjects,
  // removed weekly/monthly hour fields
        productivity,
        onTimeDelivery,
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

          {/* Team Filter */}
          <div className="flex gap-2 mt-6">
            {teams.map((team) => (
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
        </div>
      </div>
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
                          <span className={`text-sm font-semibold ${getProductivityRating(member.productivity).color}`}>
                            {getProductivityRating(member.productivity).label} Performer
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
                  <div className="grid grid-cols-2 gap-4 mb-6">
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

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
                        <span className="text-lg font-bold text-gray-900">{member.onTimeDelivery === null ? 'N/A' : `${member.onTimeDelivery}%`}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${member.onTimeDelivery ?? 0}%` }}
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