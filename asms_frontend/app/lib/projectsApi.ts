// Lightweight frontend helper to fetch/persist projects.
// Tries backend at /api/projects, falls back to localStorage if unavailable.
export type ProjectShape = {
  name: string;
  client: string;
  status: string;
  progress?: number;
  due?: string;
  team?: { id: string; name: string; avatar?: string }[];
  selectedTeam?: string[];
  completedDate?: string | null;
};

const LOCAL_KEY = "asms_projects";

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function fetchProjects(): Promise<ProjectShape[]> {
  // try backend first
  try {
    const resp = await fetchWithTimeout("/api/projects", {}, 3000);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        // persist to localStorage for offline usage
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch (e) {}
        return data as ProjectShape[];
      }
    }
  } catch (e) {
    // network or timeout — fall back to local
  }

  // fallback: localStorage
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ProjectShape[];
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function saveProjects(projects: ProjectShape[]) {
  // attempt to POST to backend, but don't fail if network not available
  try {
    const resp = await fetchWithTimeout("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(projects) }, 3000);
    if (!resp.ok) {
      // still save locally
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(projects)); } catch (e) {}
    }
  } catch (e) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(projects)); } catch (e) {}
  }
}

export function readLocalProjects(): ProjectShape[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ProjectShape[];
    }
  } catch (e) {}
  return [];
}

export function writeLocalProjects(projects: ProjectShape[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(projects)); } catch (e) {}
}

export default { fetchProjects, saveProjects, readLocalProjects, writeLocalProjects };
