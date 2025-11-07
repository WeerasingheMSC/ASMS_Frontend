"use client"

import { useState, useEffect } from "react"
import styles from "../../styles/team.module.css"
import TeamMembersTable from "../../components/team/team-members-table"
import TeamForm from "../../components/team/team-form"
import FullTeamForm from "../../components/team/full-team-form"
import TeamDetails from "../../components/team/team-details"
import { getToken, removeToken, getCurrentUser } from "../../utils/auth"

interface Team {
  id: string
  name: string
  specialization: string
  memberCount: number
  totalWorkingHours: number
  averageAge: number
  description?: string
  employeeId?: string | number
  employeeName?: string
}

interface Employee {
  id: number
  name: string
  email?: string
  role?: string
  position?: string
  department?: string
}

interface TeamMember {
  id: number
  fullName: string
  nic: string
  contactNo: string
  birthDate: string
  age: number
  address: string
  city: string
  specialization: string
  joinedDate: string
  workingHoursPerDay: string
  teamId: string
  supervisorId?: number
  supervisorName?: string
}

interface TeamStatsDTO {
  teamId: number
  teamName: string
  specialization: string
  totalMembers: number
  totalWorkingHours: number
  averageAge: number
  teamMembers: TeamMember[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamStats, setTeamStats] = useState<TeamStatsDTO[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showTeamDetails, setShowTeamDetails] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [employeeError, setEmployeeError] = useState<string | null>(null)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"teams" | "members">("teams")
  const [teamsPerView, setTeamsPerView] = useState<number>(4)
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  })

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    // Auto hide after 5 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 5000)
  }

  // Hide toast manually
  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  // Listen for toast events from child components
  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const { message, type } = event.detail;
      showToast(message, type);
    };

    // Add event listener for custom toast events
    window.addEventListener('showToast', handleToastEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('showToast', handleToastEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    fetchTeams()
    fetchTeamMembers()
    fetchTeamStats()
    fetchEmployee()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setTeamsError(null)
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      console.log("Fetching teams from API...");
      
      const response = await fetch(`${API_URL}/api/employee/teams/all`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Teams response status:", response.status, response.statusText);

      if (response.ok) {
        const teamsData = await response.json();
        console.log("Teams data received:", teamsData);

        const transformedTeams: Team[] = teamsData.map((team: any) => ({
          id: team.id?.toString() || Math.random().toString(),
          name: team.name || team.teamName || "Unnamed Team",
          specialization: team.specialization || "General",
          memberCount: team.memberCount || 0,
          totalWorkingHours: team.totalWorkingHours || 0,
          averageAge: Math.round(team.averageAge) || 0,
          description: team.description,
          employeeId: team.employeeId?.toString(),
          employeeName: team.employeeName
        }));

        setTeams(transformedTeams);
      } else if (response.status === 401) {
        const errorMessage = "Token expired or invalid. Please log in again.";
        removeToken();
        window.location.href = '/signin';
        throw new Error(errorMessage);
      } else {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error("Error fetching teams:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while fetching teams";
      setTeamsError(errorMessage);
      setTeams([]);
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      console.log("Fetching team stats from API...");
      
      const response = await fetch(`${API_URL}/api/employee/all-teams-stats`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Team stats response status:", response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Team stats data received:", responseData);

        const statsData = responseData.data || responseData;
        
        if (Array.isArray(statsData)) {
          setTeamStats(statsData);
        } else {
          console.error("Team stats data is not an array:", statsData);
          setTeamStats([]);
        }
      } else if (response.status === 401) {
        const errorMessage = "Token expired or invalid. Please log in again.";
        removeToken();
        window.location.href = '/signin';
        throw new Error(errorMessage);
      } else {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error("Error fetching team stats:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while fetching team stats";
      setStatsError(errorMessage);
      setTeamStats([]);
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      setMembersLoading(true)
      setMembersError(null)
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      console.log("Fetching team members from API...");
      
      const response = await fetch(`${API_URL}/api/employee/allteam`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Team members response status:", response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log("Team members data received:", responseData);

        const membersData = responseData.data || responseData;
        
        if (Array.isArray(membersData)) {
          const transformedMembers: TeamMember[] = membersData.map((member: any) => ({
            id: member.id || 0,
            fullName: member.fullName || "",
            nic: member.nic || "",
            contactNo: member.contactNo || "",
            birthDate: member.birthDate || "",
            age: member.age || 0,
            address: member.address || "",
            city: member.city || "",
            specialization: member.specialization || "",
            joinedDate: member.joinedDate || "",
            workingHoursPerDay: member.workingHoursPerDay || "",
            teamId: member.teamId || "",
            supervisorId: member.supervisorId,
            supervisorName: member.supervisorName
          }));

          setTeamMembers(transformedMembers);
        } else {
          console.error("Team members data is not an array:", membersData);
          setTeamMembers([]);
        }
      } else if (response.status === 401) {
        const errorMessage = "Token expired or invalid. Please log in again.";
        removeToken();
        window.location.href = '/signin';
        throw new Error(errorMessage);
      } else {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }
      
    } catch (error) {
      console.error("Error fetching team members:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while fetching team members";
      setMembersError(errorMessage);
      setTeamMembers([]);
    } finally {
      setMembersLoading(false)
    }
  }

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
        removeToken();
        window.location.href = '/signin';
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
  }

  const handleAddMember = (teamId?: string) => {
    setSelectedTeam(teamId || null)
    setShowForm(true)
  }

  const handleAddTeam = () => {
    setShowTeamForm(true)
  }

  const handleViewTeamDetails = (teamId: string) => {
    setSelectedTeamDetails(teamId)
    setShowTeamDetails(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedTeam(null)
  }

  const handleTeamFormClose = () => {
    setShowTeamForm(false)
  }

  const handleTeamDetailsClose = () => {
    setShowTeamDetails(false)
    setSelectedTeamDetails(null)
  }

  const handleMemberAdded = () => {
    fetchTeams()
    fetchTeamMembers()
    fetchTeamStats()
    handleFormClose()
  }

  const handleTeamAdded = (newTeam: Team) => {
    fetchTeams()
    fetchTeamMembers()
    fetchTeamStats()
    handleTeamFormClose()
  }

  const handleTeamUpdated = () => {
    fetchTeams()
    fetchTeamMembers()
    fetchTeamStats()
  }

  // Calculate summary statistics from team stats
  const getDisplayTeams = () => {
    if (teamStats.length > 0) {
      return teamStats.map(stat => ({
        id: stat.teamId.toString(),
        name: stat.teamName,
        specialization: stat.specialization,
        memberCount: stat.totalMembers,
        totalWorkingHours: stat.totalWorkingHours,
        averageAge: Math.round(stat.averageAge) || 0,
        description: "",
        employeeId: "",
        employeeName: ""
      }))
    }
    return teams
  }

  const displayTeams = getDisplayTeams()

  const totalMembers = teamStats.length > 0 
    ? teamStats.reduce((sum, team) => sum + team.totalMembers, 0)
    : teamMembers.length

  const totalWorkingHours = teamStats.length > 0
    ? teamStats.reduce((sum, team) => sum + team.totalWorkingHours, 0)
    : teams.reduce((sum, team) => sum + team.totalWorkingHours, 0)

  const averageAgeAll = teamStats.length > 0 
    ? Math.round(teamStats.reduce((sum, team) => sum + team.averageAge, 0) / teamStats.length)
    : teams.length > 0
    ? Math.round(teams.reduce((sum, team) => sum + team.averageAge, 0) / teams.length)
    : 0

  // Get teams to display based on current selection
  const visibleTeams = displayTeams.slice(0, teamsPerView)

  // Retry fetches
  const retryFetchEmployee = () => {
    fetchEmployee()
  }

  const retryFetchTeams = () => {
    fetchTeams()
  }

  const retryFetchMembers = () => {
    fetchTeamMembers()
  }

  const retryFetchStats = () => {
    fetchTeamStats()
  }

  const handleLogout = () => {
    removeToken();
    window.location.href = '/signin';
  }

  return (
    <div className={styles.teamPage}>
      {/* Toast Notification */}
      {toast.show && (
        <div 
          className={`fixed top-4 right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className={`ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current ${
                toast.type === 'success' ? 'hover:text-green-600' : 'hover:text-red-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress bar */}
          <div 
            className={`absolute bottom-0 left-0 h-1 rounded-b-lg transition-all duration-5000 ease-linear ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: '100%', animation: 'shrink 5s linear forwards' }}
          />
        </div>
      )}

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerMain}>
            <div>
              <h1>Team Management</h1>
              <p className={styles.pageSubtitle}>Manage your teams and team members</p>
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🏢</div>
            <div className={styles.summaryContent}>
              <h3>{displayTeams.length}</h3>
              <p>Total Teams</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>👥</div>
            <div className={styles.summaryContent}>
              <h3>{totalMembers}</h3>
              <p>Total Members</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>⏱️</div>
            <div className={styles.summaryContent}>
              <h3>{totalWorkingHours}</h3>
              <p>Total ManHours/Day</p>
            </div>
          </div>
          
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab("teams")}
          className={`${styles.tab} ${activeTab === "teams" ? styles.tabActive : styles.tabInactive}`}
        >
          Teams Overview
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`${styles.tab} ${activeTab === "members" ? styles.tabActive : styles.tabInactive}`}
        >
          Team Members
        </button>
      </div>

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <div className={styles.teamsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderRow}>
              <div>
                <h2>Teams Overview</h2>
                <p>Manage and view details of all specialized teams</p>
              </div>
              <div className={styles.viewControls}>
                <span className={styles.viewLabel}>Show:</span>
                <select 
                  value={teamsPerView} 
                  onChange={(e) => setTeamsPerView(Number(e.target.value))}
                  className={styles.viewSelect}
                >
                  <option value={4}>4 Teams</option>
                  <option value={8}>8 Teams</option>
                  <option value={16}>16 Teams</option>
                  <option value={displayTeams.length}>All Teams</option>
                </select>
                <button
                  onClick={handleAddTeam}
                  className={`${styles.btnPrimary} ${styles.addTeamButton}`}
                  disabled={!employee}
                >
                  <span className={styles.btnIcon}>+</span>
                  Add New Team
                </button>
              </div>
            </div>
          </div>
          
          {loading || statsLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              Loading teams...
            </div>
          ) : teamsError || statsError ? (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Failed to load teams</h3>
              <p>{teamsError || statsError}</p>
              <div className={styles.errorActions}>
                <button 
                  onClick={retryFetchTeams}
                  className={styles.retryButton}
                >
                  Retry Teams
                </button>
                <button 
                  onClick={retryFetchStats}
                  className={styles.retryButton}
                >
                  Retry Stats
                </button>
              </div>
            </div>
          ) : displayTeams.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏢</div>
              <h3>No Teams Found</h3>
              <p>Get started by creating your first team to organize your members.</p>
              <button
                onClick={handleAddTeam}
                className={styles.btnPrimary}
                disabled={!employee}
              >
                <span className={styles.btnIcon}>+</span>
                Create Your First Team
              </button>
            </div>
          ) : (
            <>
              <div className={styles.teamsGrid}>
                {visibleTeams.map((team) => (
                  <div key={team.id} className={styles.teamCard}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{team.name}</h3>
                      <span className={styles.specializationBadge}>{team.specialization}</span>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.teamStats}>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Members</span>
                          <span className={styles.statValue}>{team.memberCount}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Mhrs/Day</span>
                          <span className={styles.statValue}>{team.totalWorkingHours}</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.statLabel}>Avg Age</span>
                          <span className={styles.statValue}>{team.averageAge}</span>
                        </div>
                      </div>
                      {teamStats.find(stat => stat.teamId.toString() === team.id) && (
                        <div className={styles.teamDetails}>
                          <p className={styles.teamDetailText}>
                            This team has {team.memberCount} members working {team.totalWorkingHours} hours per day.
                          </p>
                        </div>
                      )}
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => handleAddMember(team.id)}
                          className={`${styles.btnPrimary} ${styles.cardButton}`}
                        >
                          <span className={styles.btnIcon}>+</span>
                          Add Member
                        </button>
                        <button
                          onClick={() => handleViewTeamDetails(team.id)}
                          className={`${styles.btnSecondary} ${styles.cardButton}`}
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Teams Count Info */}
              <div className={styles.teamsCountInfo}>
                <p>
                  Showing {visibleTeams.length} of {displayTeams.length} teams
                  {teamsPerView < displayTeams.length && (
                    <span className={styles.moreTeamsHint}>
                      {" "}• Use the dropdown above to view more teams
                    </span>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className={styles.membersSection}>
          <div className={styles.sectionHeader}>
            <h2>Team Members</h2>
            <p>View and manage all team members across different specializations</p>
          </div>
          {membersLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner}></div>
              Loading team members...
            </div>
          ) : membersError ? (
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Failed to load team members</h3>
              <p>{membersError}</p>
              <button 
                onClick={retryFetchMembers}
                className={styles.retryButton}
              >
                Try Again
              </button>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👥</div>
              <h3>No Team Members Available</h3>
              <p>There are no team members in the system yet.</p>
              <button
                onClick={() => handleAddMember()}
                className={styles.btnPrimary}
                disabled={!employee}
              >
                <span className={styles.btnIcon}>+</span>
                Add First Team Member
              </button>
            </div>
          ) : (
            <TeamMembersTable teams={displayTeams} teamMembers={teamMembers} />
          )}
        </div>
      )}

      {/* Floating Add Member Button - Only show if we have teams */}
      {displayTeams.length > 0 && (
        <button
          className={styles.floatingButton}
          onClick={() => handleAddMember()}
          title="Add New Team Member"
        >
          <span className={styles.floatingButtonIcon}>+</span>
          <span className={styles.floatingButtonText}>Add Member</span>
        </button>
      )}

      {/* Team Member Form Modal */}
      {showForm && (
        <TeamForm 
          teamId={selectedTeam || ""} 
          onClose={handleFormClose} 
          onSuccess={handleMemberAdded} 
        />
      )}

      {/* Team Form Modal */}
      {showTeamForm && (
        <FullTeamForm 
          onClose={handleTeamFormClose} 
          onSuccess={handleTeamAdded} 
        />
      )}

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeamDetails && (
        <TeamDetails 
          teamId={selectedTeamDetails}
          onClose={handleTeamDetailsClose}
          onTeamUpdated={handleTeamUpdated}
        />
      )}

      {/* Add CSS for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}