"use client";
import React, { useEffect, useState } from "react";
import styles from "../employee/employee.module.css";
import Link from 'next/link';
import { teams as sharedTeams, members as sharedMembers } from "../lib/teamData";
import { getToken, getCurrentUser } from '../utils/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ✅ Types matching backend DTOs
type AppointmentDTO = {
  id: number;
  customerId: number;
  customerName: string;
  serviceId?: number;
  serviceName: string;
  employeeId?: number;
  employeeName?: string;
  appointmentDate: string;
  status: string;
  notes?: string;
};

type AppointmentStats = {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  inService: number;
  completed: number;
};

// Employee interface
interface Employee {
  id: number;
  name: string;
  email?: string;
  role?: string;
  position?: string;
  department?: string;
}

function WorkloadOverview({ stats }: { stats: AppointmentStats }) {
  const total = stats.total || 0;
  const confirmed = stats.confirmed || 0;
  const inService = stats.inService || 0;
  const completed = stats.completed || 0;

  const circumference = 2 * Math.PI * 60;
  const completedLen = circumference * (total ? completed / total : 0);
  const inServiceLen = circumference * (total ? inService / total : 0);
  const confirmedLen = circumference * (total ? confirmed / total : 0);

  return (
    <div className={styles.workloadContainer}>
      <div className={styles.chartWrapper}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <g transform="rotate(-90 80 80)">
            <circle cx="80" cy="80" r="60" fill="none" stroke="#eef2f7" strokeWidth="14" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#16a34a" strokeWidth="14" strokeDasharray={`${completedLen} ${circumference - completedLen}`} strokeLinecap="round" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#2563eb" strokeWidth="14" strokeDasharray={`${inServiceLen} ${circumference - inServiceLen}`} strokeDashoffset={-completedLen} strokeLinecap="round" />
            <circle cx="80" cy="80" r="60" fill="none" stroke="#f59e0b" strokeWidth="14" strokeDasharray={`${confirmedLen} ${circumference - confirmedLen}`} strokeDashoffset={-(completedLen + inServiceLen)} strokeLinecap="round" />
          </g>
        </svg>

        <div className={styles.chartCenter}>
          <div className={styles.chartNumber}>{inService}</div>
          <div className={styles.chartLabel}>In Service</div>
        </div>
      </div>

      <div className={styles.legendContainer}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotCompleted}`} />
          <div className={styles.legendText}>Completed <span className={styles.legendCount}>({completed})</span></div>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotInProgress}`} />
          <div className={styles.legendText}>In Service <span className={styles.legendCount}>({inService})</span></div>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotOnHold}`} />
          <div className={styles.legendText}>Confirmed <span className={styles.legendCount}>({confirmed})</span></div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  const [backendTeams, setBackendTeams] = useState<any[]>([]);
  const [backendMembers, setBackendMembers] = useState<any[]>([]);
  const [backendTeamStats, setBackendTeamStats] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  
  // ✅ State for appointments and stats
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    inService: 0,
    completed: 0
  });

  // Handle client-side mounting to fix hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch employee data
  const fetchEmployee = async () => {
    try {
      setEmployeeLoading(true);
      setEmployeeError(null);
      
      console.log("Fetching employee profile...");
      
      const token = getToken();
      console.log("JWT Token available:", !!token);
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/employee/current`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Employee response status:", response.status, response.statusText);

      if (response.ok) {
        const userData = await response.json();
        console.log("Employee data received:", userData);

        const employeeInfo: Employee = {
          id: userData.id || 1,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.username || userData.name || "Current Employee",
          email: userData.email,
          role: userData.role,
          position: userData.position,
          department: userData.department
        }
        
        setEmployee(employeeInfo);
        console.log("Employee info set:", employeeInfo);
      } else if (response.status === 401) {
        const errorMessage = "Token expired or invalid. Please log in again.";
        throw new Error(errorMessage);
      } else {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error("Error fetching employee:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setEmployeeError(errorMessage);
      
      const storedUser = getCurrentUser();
      if (storedUser) {
        const fallbackEmployee: Employee = {
          id: storedUser.id || 1,
          name: storedUser.name || storedUser.username || "Current Employee",
          email: storedUser.email,
          role: storedUser.role
        }
        setEmployee(fallbackEmployee);
      } else {
        const fallbackEmployee: Employee = {
          id: 1,
          name: "Current Employee"
        }
        setEmployee(fallbackEmployee);
      }
    } finally {
      setEmployeeLoading(false);
    }
  };

  // ✅ Fetch appointments and calculate stats from backend
  useEffect(() => {
    let mounted = true;
    const token = getToken();
    if (!token) {
      setLoadingAppointments(false);
      return;
    }

    (async () => {
      // Fetch employee data first
      await fetchEmployee();

      // ✅ Fetch appointments
      try {
        const appointmentsResp = await fetch(`${API_URL}/api/employee/appointments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (appointmentsResp.ok) {
          const appointmentsData = await appointmentsResp.json();
          if (mounted) {
            const apts = Array.isArray(appointmentsData) ? appointmentsData : [];
            setAppointments(apts);
            
            // ✅ Calculate stats from appointments
            const stats: AppointmentStats = {
              total: apts.length,
              confirmed: apts.filter((a: AppointmentDTO) => a.status === 'CONFIRMED').length,
              pending: apts.filter((a: AppointmentDTO) => a.status === 'PENDING').length,
              cancelled: apts.filter((a: AppointmentDTO) => a.status === 'CANCELLED').length,
              inService: apts.filter((a: AppointmentDTO) => a.status === 'IN_SERVICE').length,
              completed: apts.filter((a: AppointmentDTO) => a.status === 'COMPLETED').length,
            };
            setAppointmentStats(stats);
          }
        }
      } catch (e) {
        console.error('Error fetching appointments:', e);
      } finally {
        if (mounted) setLoadingAppointments(false);
      }

      // ✅ Keep existing team fetches
      try {
        const tResp = await fetch(`${API_URL}/api/employee/teams/all`, { headers: { Authorization: `Bearer ${token}` } });
        if (tResp.ok) {
          const tData = await tResp.json();
          if (!mounted) return;
          setBackendTeams(Array.isArray(tData) ? tData : (tData.data || []));
        }
      } catch (e) {}

      try {
        const sResp = await fetch(`${API_URL}/api/employee/all-teams-stats`, { headers: { Authorization: `Bearer ${token}` } });
        if (sResp.ok) {
          const sData = await sResp.json();
          if (!mounted) return;
          setBackendTeamStats(Array.isArray(sData) ? sData : (sData.data || []));
        }
      } catch (e) {}

      try {
        const mResp = await fetch(`${API_URL}/api/employee/allteam`, { headers: { Authorization: `Bearer ${token}` } });
        if (mResp.ok) {
          const mData = await mResp.json();
          if (!mounted) return;
          const rawMembers = Array.isArray(mData) ? mData : (mData.data || []);
          const members = rawMembers.map((m: any) => ({
            id: m.id ?? m.employeeId ?? m.userId,
            name: m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim(),
            team: m.team || m.teamName || m.team_name,
            productivity: m.productivity ?? m.productivityScore ?? null
          }));
          setBackendMembers(members);
        }
      } catch (e) {}
    })();

    return () => { mounted = false; };
  }, []);

  function normalizeDateDisplay(d: string) {
    if (!d) return "";
    const parsed = new Date(d);
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  
  // Fix hydration error - only format date on client side
  const todayDisplay = mounted 
    ? today.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : todayISO; // Fallback to ISO format during SSR

  // ✅ Filter today's appointments
  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.appointmentDate);
    const aptISO = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, "0")}-${String(aptDate.getDate()).padStart(2, "0")}`;
    return aptISO === todayISO;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header with Glass Effect */}
      <div className="relative rounded-2xl p-8 shadow-xl overflow-hidden">
        {/* Glass effect background */}
        <div className="absolute rounded-2xl"></div>
        
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-white">
            {employeeLoading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="text-lg">Loading your profile...</span>
              </div>
            ) : employeeError ? (
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
              </div>
            ) : employee ? (
              <div>
                <div className="text-3xl font-bold mb-3  text-blue-1000">
                  <small>Welcome,</small> {employee.name}! 
                </div>
               
                <div className="space-y-1 text-blue-800/90">
                  <p className="text-lg font-medium">
                    {employee.position || 'Team Manager'}
                    {employee.department && ` • ${employee.department}`}
                  </p>
                  {employee.email && (
                    <p className="text-gray-500/80">{employee.email}</p>
                  )}
                  <p className="text-sm text-gray-800/80">Employee ID: {employee.id}</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                <p className="text-blue-100/80">Manage your appointments and tasks</p>
              </div>
            )}
          </div>
          
          {/* Stats Overview in Welcome Header */}
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="text-gray-500">
              <div className="text-2xl font-bold ">{appointmentStats.inService}</div>
              <div className="text-sm text-blue-900/80 font-medium">In Service</div>
            </div>
            <div className="text-gray-500">
              <div className="text-2xl font-bold">{appointmentStats.completed}</div>
              <div className="text-sm  text-blue-900/80 font-medium">Completed</div>
            </div>
            <div className="text-gray-500">
              <div className="text-2xl font-bold">{appointmentStats.confirmed}</div>
              <div className="text-sm  text-blue-900/80 font-medium">Confirmed</div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ My Appointments Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              My Appointments
            </h2>
            <p className="text-sm text-gray-600 mt-1">Appointments assigned to you</p>
          </div>
          <Link href="/employee/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View All ({appointments.length})
          </Link>
        </div>

        {loadingAppointments ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 font-medium">No appointments assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.slice(0, 5).map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{apt.customerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{apt.serviceName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(apt.appointmentDate).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        apt.status === 'IN_SERVICE' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'COMPLETED' ? 'bg-green-200 text-green-900' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ✅ Today's Schedule */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">Today's Schedule</h3>
            <div className="text-sm text-gray-500 mt-1">{todayDisplay}</div>
          </div>
        </div>

        <ul className="space-y-3">
          {todayAppointments.length === 0 ? (
            <li className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              No appointments scheduled for today
            </li>
          ) : (
            todayAppointments.map((apt) => (
              <li key={apt.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{apt.serviceName}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{apt.customerName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    apt.status === 'IN_SERVICE' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* ✅ Dashboard Stats - From Backend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-blue-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-blue-900'>In Service</h3>
            <div className='bg-blue-500 p-3 rounded-full shadow-sm'>
              <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
              </svg>
            </div>
          </div>
          <p className='text-blue-700 mb-2 font-medium'>Active work</p>
          <div>
            <span className='text-3xl font-bold text-blue-900'>{appointmentStats.inService}</span>
            <span className='text-blue-600 ml-2 text-sm'>appointments</span>
          </div>
        </div>

        <div className='bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-green-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-green-900'>Completed</h3>
            <div className='bg-green-500 p-3 rounded-full shadow-sm'>
              <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
          </div>
          <p className='text-green-700 mb-2 font-medium'>Finished</p>
          <div>
            <span className='text-3xl font-bold text-green-900'>{appointmentStats.completed}</span>
            <span className='text-green-600 ml-2 text-sm'>appointments</span>
          </div>
        </div>

        <div className='bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-yellow-200'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-yellow-900'>Confirmed</h3>
            <div className='bg-yellow-500 p-3 rounded-full shadow-sm'>
              <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
          </div>
          <p className='text-yellow-700 mb-2 font-medium'>Scheduled</p>
          <div>
            <span className='text-3xl font-bold text-yellow-900'>{appointmentStats.confirmed}</span>
            <span className='text-yellow-600 ml-2 text-sm'>appointments</span>
          </div>
        </div>
      </div>

      {/* ✅ Workload Overview and Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Workload Overview</h3>
          <WorkloadOverview stats={appointmentStats} />
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Team Overview</h3>
            <Link href="/employee/team_analysis" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {backendTeams.slice(0, 6).map((t) => {
              const teamName = t.name || t.teamName || '';
              const membersOfTeam = backendMembers.filter(m => 
                String(m.team || m.teamName || '').trim() === String(teamName).trim()
              );
              const membersCount = membersOfTeam.length || t.totalMembers || 0;
              
              const stat = backendTeamStats.find(s => {
                const sName = String(s.teamName || s.team_name || s.name || '').trim();
                return sName === String(teamName).trim();
              });
              
              let avgProd = 0;
              if (stat) {
                avgProd = Number(stat.averageProductivity ?? stat.avgProductivity ?? stat.productivity ?? 0) || 0;
              } else if (membersOfTeam.length > 0) {
                const total = membersOfTeam.reduce((acc, m) => acc + (Number(m.productivity) || 0), 0);
                avgProd = Math.round(total / membersOfTeam.length);
              }
              
              avgProd = Math.max(0, Math.min(100, Math.round(avgProd)));
              
              let fillClass = 'bg-orange-400';
              if (avgProd >= 95) fillClass = 'bg-green-500';
              else if (avgProd >= 90) fillClass = 'bg-teal-500';
              else if (avgProd >= 85) fillClass = 'bg-yellow-400';

              return (
                <Link
                  key={t.id || teamName}
                  href={`/employee/team_analysis?team=${encodeURIComponent(teamName)}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{teamName}</div>
                      <div className="text-xs text-gray-500 mt-1">{membersCount} members</div>
                    </div>
                    <div className="text-sm font-bold text-gray-700 ml-2">{avgProd}%</div>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`${fillClass} h-2 transition-all duration-300`} style={{ width: `${avgProd}%` }} />
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">Productivity</div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}