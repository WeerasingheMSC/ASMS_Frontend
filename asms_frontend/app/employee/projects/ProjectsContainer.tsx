"use client";
import React, { useState, useEffect } from "react";
import projStyles from "./projects.module.css";
import ProjectsTable from "./ProjectsTable";
import projectsApi from "../../lib/projectsApi";

type Project = {
  name: string;
  client: string;
  status: string;
  progress: number;
  due: string;
};

export default function ProjectsContainer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Project[]>(projects);
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    let mounted = true;
    // attempt to fetch from backend, fall back to localStorage, then to props
    projectsApi.fetchProjects().then((fetched) => {
      if (!mounted) return;
      if (fetched && fetched.length > 0) setFiltered(fetched as Project[]);
      else setFiltered(projects);
    }).catch(() => {
      setFiltered(projects);
    });
    return () => { mounted = false; };
  }, [projects]);

  function handleSearchEnter() {
    const q = query.trim().toLowerCase();
    // apply both status filter and query
    let base = projects;
    if (statusFilter && statusFilter !== "All") {
      base = base.filter((p) => p.status === statusFilter);
    }
    if (!q) {
      setFiltered(base);
      return;
    }
    setFiltered(base.filter((p) => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)));
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    const q = query.trim().toLowerCase();
    let base = projects;
    if (value && value !== "All") base = base.filter((p) => p.status === value);
    if (!q) {
      setFiltered(base);
      return;
    }
    setFiltered(base.filter((p) => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)));
  }

  return (
    <div className={projStyles.container}>
      <div className={projStyles.header}>
        <div className={projStyles.titleBlock}>
          <h1 className={projStyles.title}>My Projects</h1>
          <div className={projStyles.subtitle}>Manage your assigned projects and services</div>
        </div>

        <div className={projStyles.controls}>
          <div className={projStyles.search}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/></svg>
            <input
              placeholder="Search projects by name or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearchEnter();
                if (e.key === "Escape") {
                  setQuery("");
                  setFiltered(projects);
                }
              }}
            />
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
              <option>All</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Overdue</option>
            </select>
            
          </div>
        </div>
      </div>

      <ProjectsTable projects={filtered} />

      <div className={projStyles.footer}>
        <div className={projStyles.resultsInfo}>Showing 1 to {filtered.length} of {projects.length} results</div>
        <div className={projStyles.pagination}>
          <button className={projStyles.pageBtn}>&lt;</button>
          <button className={`${projStyles.pageBtn} ${projStyles.active}`}>1</button>
          <button className={projStyles.pageBtn}>&gt;</button>
        </div>
      </div>
    </div>
  );
}
