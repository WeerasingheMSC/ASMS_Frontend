"use client";
import React, { useEffect, useState } from "react";
import ProjectsContainer from "./ProjectsContainer";
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
  team?: { id: string; name: string; avatar?: string }[];
  selectedTeam?: string[];
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Map appointment status to project status
  const mapAppointmentStatusToProjectStatus = (status: string): string => {
    if (!status) return 'Pending';
    
    // Normalize status to uppercase for consistent mapping
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'IN_SERVICE': 'In Progress',
      'IN_PROGRESS': 'In Progress',
      'READY': 'Ready',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'OVERDUE': 'Overdue',
      'RESCHEDULED': 'Pending'
    };
    
    return statusMap[normalized] || 'Pending';
  };

  // Calculate progress based on status
  const calculateProgress = (status: string): number => {
    if (!status) return 0;
    
    const normalized = status.toUpperCase().replace(/\s+/g, '_');
    
    const progressMap: Record<string, number> = {
      'PENDING': 0,
      'CONFIRMED': 25,
      'READY': 40,
      'IN_SERVICE': 50,
      'IN_PROGRESS': 50,
      'COMPLETED': 100,
      'CANCELLED': 0,
      'OVERDUE': 0,
      'RESCHEDULED': 10
    };
    
    return progressMap[normalized] || 0;
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    const token = getToken();
    if (!token) {
      setError("Please log in to view services");
      setLoading(false);
      return;
    }

    const employeeId = getEmployeeId();

    try {
      // ✅ Fetch appointments/services assigned to employee
      // Try the working endpoint first (same as dashboard)
      const endpoints = [
        `${API_URL}/api/employee/appointments`,  // ✅ This works for dashboard
        `${API_URL}/api/appointments/employee/${employeeId}`,
        `${API_URL}/api/employee/${employeeId}/appointments`,
        `${API_URL}/api/employee/${employeeId}/projects`,
        `${API_URL}/api/projects/employee/${employeeId}`,
        `${API_URL}/api/employee/projects`,
        `${API_URL}/api/projects`
      ];

      let projectsList = [];
      let fetchSuccess = false;

      for (const endpoint of endpoints) {
        try {
          console.log('🔍 Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Response data:', data);
            console.log('✅ Response data type:', typeof data, 'isArray:', Array.isArray(data));
            projectsList = Array.isArray(data) ? data : (data.data || data.projects || data.appointments || []);
            console.log('✅ Projects list after extraction:', projectsList.length, projectsList);
            
            // Check if data has employeeId field and log it
            if (projectsList.length > 0) {
              console.log('📋 First item structure:', projectsList[0]);
              console.log('📋 First item employeeId:', projectsList[0].employeeId);
              console.log('📋 Token employeeId:', employeeId);
            }
            
            // Don't filter if endpoint is /api/employee/appointments (already filtered by backend)
            // Only filter for generic endpoints
            const isEmployeeSpecificEndpoint = endpoint.includes('/employee/appointments') || endpoint.includes(`/employee/${employeeId}`);
            
            if (!isEmployeeSpecificEndpoint && projectsList.length > 0 && projectsList[0].employeeId) {
              const beforeFilter = projectsList.length;
              projectsList = projectsList.filter((p: any) => 
                String(p.employeeId) === String(employeeId)
              );
              console.log(`✅ Filtered from ${beforeFilter} to ${projectsList.length} for employee ${employeeId}`);
            } else {
              console.log(`ℹ️ Skipping filter - using all ${projectsList.length} items from employee-specific endpoint`);
            }
            
            fetchSuccess = true;
            console.log(`✅ Successfully fetched ${projectsList.length} services from ${endpoint}`);
            break;
          } else {
            // Log as warning instead of error since we have fallbacks
            console.warn(`⚠️ Endpoint ${endpoint} returned ${response.status}, trying next endpoint...`);
          }
        } catch (endpointError) {
          console.warn(`⚠️ Endpoint ${endpoint} unavailable, trying next...`);
        }
      }

      if (!fetchSuccess) {
        // Use mock data as fallback
        console.info('ℹ️ All backend endpoints unavailable. Using local mock data for development.');
        projectsList = getMockProjects();
      }
      
      // Note: Don't use mock data if backend returns empty array - that's valid data
      console.log('📊 Final projects list count:', projectsList.length);

      // Normalize the data to match Project type (convert appointments to projects)
      const normalizedProjects = projectsList.map((p: any) => ({
        id: p.id || p.appointmentId || p.projectId || Math.random().toString(),
        projectId: p.projectId || p.appointmentId || p.id,
        name: p.serviceName || p.name || p.projectName || p.service || 'Unnamed Service',
        client: p.customerName || p.client || p.customer || 'Unknown Customer',
        status: mapAppointmentStatusToProjectStatus(p.status || 'Pending'),
        progress: calculateProgress(p.status),
        completedDate: p.completedDate || p.completed_date || (p.status === 'Completed' ? new Date().toISOString().split('T')[0] : null),
        due: p.appointmentDate || p.due || p.dueDate || p.due_date || new Date().toISOString().split('T')[0],
        startDate: p.startDate || p.start_date || (p.status === 'In Service' || p.status === 'In Progress' ? new Date().toISOString().split('T')[0] : null),
        teamId: p.teamId || p.team_id,
        teamName: p.teamName || p.team_name || p.team || 'General',
        description: p.notes || p.description || '',
        team: Array.isArray(p.team) ? p.team : [],
        selectedTeam: Array.isArray(p.selectedTeam) ? p.selectedTeam : []
      }));

      console.log('✅ Normalized projects:', normalizedProjects);
      setProjects(normalizedProjects);
      setError(null); // Clear any previous errors

    } catch (err) {
      console.error('Error loading projects:', err);
      setError("Error loading projects. Using mock data.");
      // Use mock data on error
      setProjects(getMockProjects());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Mock data function
  const getMockProjects = (): Project[] => {
    return [
      {
        id: '1',
        name: 'Engine Overhaul',
        client: 'John Doe',
        status: 'In Progress',
        progress: 45,
        due: '2024-12-15',
        startDate: '2024-11-01',
        teamName: 'Powertrain',
        description: 'Complete engine rebuild for 2015 Toyota Camry',
        team: [],
        selectedTeam: []
      },
      {
        id: '2',
        name: 'Transmission Repair',
        client: 'Jane Smith',
        status: 'Pending',
        progress: 0,
        due: '2024-12-20',
        startDate: null,
        teamName: 'Powertrain',
        description: 'Transmission fluid leak repair',
        team: [],
        selectedTeam: []
      },
      {
        id: '3',
        name: 'Brake System Service',
        client: 'Mike Johnson',
        status: 'Completed',
        progress: 100,
        due: '2024-11-30',
        startDate: '2024-11-15',
        completedDate: '2024-11-28',
        teamName: 'Brakes',
        description: 'Replace brake pads and rotors',
        team: [],
        selectedTeam: []
      },
      {
        id: '4',
        name: 'Electrical Diagnostics',
        client: 'Sarah Williams',
        status: 'In Progress',
        progress: 60,
        due: '2024-12-10',
        startDate: '2024-11-20',
        teamName: 'Electrical',
        description: 'Diagnose battery drain issue',
        team: [],
        selectedTeam: []
      },
      {
        id: '5',
        name: 'AC System Repair',
        client: 'Robert Brown',
        status: 'Overdue',
        progress: 30,
        due: '2024-11-25',
        startDate: '2024-11-10',
        teamName: 'General',
        description: 'AC not blowing cold air',
        team: [],
        selectedTeam: []
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Projects</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('📦 Rendering ProjectsContainer with', projects.length, 'projects:', projects);
  return <ProjectsContainer projects={projects} onUpdate={fetchProjects} />;
}