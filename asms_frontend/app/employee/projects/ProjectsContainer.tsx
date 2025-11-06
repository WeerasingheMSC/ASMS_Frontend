"use client";
import React, { useState, useEffect } from "react";
import projStyles from "./projects.module.css";
import ProjectsTable from "./ProjectsTable";

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
  team?: { id: string; name: string; avatar?: string }[];
  selectedTeam?: string[];
};

type ProjectsContainerProps = {
  projects?: Project[];
  onUpdate?: () => void;
};

export default function ProjectsContainer({ projects = [], onUpdate }: ProjectsContainerProps) {
  console.log('🔧 ProjectsContainer received projects:', projects?.length || 0, projects);
  
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Project[]>(projects || []);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Update filtered when projects prop changes
  useEffect(() => {
    console.log('🔄 ProjectsContainer useEffect triggered, projects:', projects?.length);
    applyFilters();
  }, [projects, statusFilter, query]);

  function applyFilters() {
    const q = query.trim().toLowerCase();
    let result = projects || [];
    
    console.log('🔍 Applying filters - query:', q, 'statusFilter:', statusFilter, 'total projects:', result.length);

    // Apply status filter
    if (statusFilter && statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Apply search query
    if (q) {
      result = result.filter((p) => 
        p.name.toLowerCase().includes(q) || 
        p.client.toLowerCase().includes(q) ||
        (p.teamName && p.teamName.toLowerCase().includes(q))
      );
    }

    setFiltered(result);
    console.log('✅ Filtered results:', result.length, 'projects');
  }

  function handleSearchEnter() {
    applyFilters();
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
  }

  function handleSearchClear() {
    setQuery("");
    setStatusFilter("All");
  }

  // Calculate status counts
  const statusCounts = {
    all: (projects || []).length,
    pending: (projects || []).filter(p => p.status === "Pending").length,
    inProgress: (projects || []).filter(p => p.status === "In Progress").length,
    completed: (projects || []).filter(p => p.status === "Completed").length,
    overdue: (projects || []).filter(p => p.status === "Overdue").length,
  };

  return (
    <div className={projStyles.container}>
      <div className={projStyles.header}>
        <div className={projStyles.titleBlock}>
          <h1 className={projStyles.title}>My Projects</h1>
          <div className={projStyles.subtitle}>
            Manage your assigned projects and services ({(projects || []).length} total)
          </div>
        </div>

        <div className={projStyles.controls}>
          <div className={projStyles.search}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
            <input
              placeholder="Search projects by name, client, or team"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchEnter();
                if (e.key === "Escape") handleSearchClear();
              }}
              aria-label="Search projects"
            />
            {query && (
              <button
                onClick={handleSearchClear}
                className={projStyles.clearBtn}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={projStyles.filterGroup}>
            <select
              className={
                projStyles.filterSelect +
                " " +
                (statusFilter === "All"
                  ? projStyles.filterAll
                  : statusFilter === "Pending"
                  ? projStyles.filterPending
                  : statusFilter === "In Progress"
                  ? projStyles.filterInProgress
                  : statusFilter === "Completed"
                  ? projStyles.filterCompleted
                  : statusFilter === "Overdue"
                  ? projStyles.filterOverdue
                  : projStyles.filterAll)
              }
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All ({statusCounts.all})</option>
              <option value="Pending">Pending ({statusCounts.pending})</option>
              <option value="In Progress">In Progress ({statusCounts.inProgress})</option>
              <option value="Completed">Completed ({statusCounts.completed})</option>
              <option value="Overdue">Overdue ({statusCounts.overdue})</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center my-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No projects found</p>
          <p className="text-sm text-gray-400 mt-1">
            {query || statusFilter !== "All" 
              ? "Try adjusting your filters" 
              : "You don't have any projects assigned yet"}
          </p>
          {(query || statusFilter !== "All") && (
            <button 
              onClick={handleSearchClear}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <ProjectsTable projects={filtered} onUpdate={onUpdate} />
      )}

      <div className={projStyles.footer}>
        <div className={projStyles.resultsInfo}>
          Showing {filtered.length} of {(projects || []).length} project{(projects || []).length !== 1 ? 's' : ''}
        </div>
        <div className={projStyles.pagination}>
          <button className={projStyles.pageBtn} disabled>&lt;</button>
          <button className={`${projStyles.pageBtn} ${projStyles.active}`}>1</button>
          <button className={projStyles.pageBtn} disabled>&gt;</button>
        </div>
      </div>
    </div>
  );
}