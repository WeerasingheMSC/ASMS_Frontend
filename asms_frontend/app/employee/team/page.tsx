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
  employeeId?: string
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

        // Transform the API response to match your Team interface
        const transformedTeams: Team[] = teamsData.map((team: any) => ({
          id: team.id?.toString() || Math.random().toString(),
          name: team.name || team.teamName || "Unnamed Team",
          specialization: team.specialization || "General",
          memberCount: team.memberCount || 0,
          totalWorkingHours: team.totalWorkingHours || 0,
          averageAge: team.averageAge || 0,
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

        // Handle both direct array and ApiResponse format
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

        // Handle both direct array and ApiResponse format
        const membersData = responseData.data || responseData;
        
        if (Array.isArray(membersData)) {
          // Transform the API response to match TeamMember interface
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

  const handleTeamAdded = () => {
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
  const totalMembers = teamStats.reduce((sum, team) => sum + team.totalMembers, 0)
  const totalWorkingHours = teamStats.reduce((sum, team) => sum + team.totalWorkingHours, 0)
  const averageAgeAll = teamStats.length > 0 
    ? Math.round(teamStats.reduce((sum, team) => sum + team.averageAge, 0) / teamStats.length)
    : 0

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

  // Get team data for display - prefer stats data if available, fallback to basic teams data
  const getDisplayTeams = () => {
    if (teamStats.length > 0) {
      return teamStats.map(stat => ({
        id: stat.teamId.toString(),
        name: stat.teamName,
        specialization: stat.specialization,
        memberCount: stat.totalMembers,
        totalWorkingHours: stat.totalWorkingHours,
        averageAge: stat.averageAge,
        description: "",
        employeeId: "",
        employeeName: ""
      }))
    }
    return teams
  }

  const displayTeams = getDisplayTeams()

  return (
    <div className={styles.teamPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerMain}>
            <div>
              <h1>Team Management</h1>
              <p className={styles.pageSubtitle}>Manage your teams and team members</p>
            </div>
            {/* Employee Info */}
            <div className={styles.employeeInfo}>
              {employeeLoading ? (
                <div className={styles.employeeLoading}>
                  <div className={styles.loadingSpinnerSmall}></div>
                  <span>Loading employee info...</span>
                </div>
              ) : employeeError ? (
                <div className={styles.employeeError}>
                  <div>Using fallback employee data</div>
                  <div className={styles.errorDetails}>{employeeError}</div>
                  <div className={styles.employeeActions}>
                    <button 
                      onClick={retryFetchEmployee}
                      className={styles.retryButton}
                    >
                      Retry
                    </button>
                    <button 
                      onClick={handleLogout}
                      className={styles.logoutButton}
                    >
                      Login Again
                    </button>
                  </div>
                </div>
              ) : employee ? (
                <div className={styles.employeeCard}>
                  <div className={styles.employeeAvatar}>
                    {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className={styles.employeeDetails}>
                    <div className={styles.employeeName}>{employee.name}</div>
                    <div className={styles.employeeId}>Employee ID: {employee.id}</div>
                    <div className={styles.employeeRole}>
                      {employee.position || 'Team Manager'} 
                      {employee.department && ` • ${employee.department}`}
                    </div>
                    {employee.email && (
                      <div className={styles.employeeEmail}>{employee.email}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.employeeError}>
                  <div>No employee data available</div>
                  <div className={styles.employeeActions}>
                    <button 
                      onClick={retryFetchEmployee}
                      className={styles.retryButton}
                    >
                      Retry
                    </button>
                    <button 
                      onClick={handleLogout}
                      className={styles.logoutButton}
                    >
                      Login
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>👥</div>
            <div className={styles.summaryContent}>
              <h3>{teamMembers.length > 0 ? teamMembers.length : totalMembers}</h3>
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
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🎂</div>
            <div className={styles.summaryContent}>
              <h3>{averageAgeAll}</h3>
              <p>Average Age</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>🏢</div>
            <div className={styles.summaryContent}>
              <h3>{displayTeams.length}</h3>
              <p>Total Teams</p>
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
            <div className={styles.teamsGrid}>
              {displayTeams.map((team) => (
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
                        <span className={styles.statLabel}>Hours/Day</span>
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
    </div>
  )
}