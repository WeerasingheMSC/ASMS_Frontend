"use client"

import { useState, useEffect } from "react"
import styles from "../../styles/team.module.css"
import TeamMembersTable from "../../components/team/team-members-table"
import TeamForm from "../../components/team/team-form"
import FullTeamForm from "../../components/team/full-team-form"

interface Team {
  id: string
  name: string
  specialization: string
  memberCount: number
  totalWorkingHours: number
  averageAge: number
}

interface Employee {
  id: number
  name: string
}

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [employeeLoading, setEmployeeLoading] = useState(true)
  const [employeeError, setEmployeeError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"teams" | "members">("teams")

  useEffect(() => {
    fetchTeams()
    fetchEmployee()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoading(true)
      // Mock data for demonstration
      const mockTeams: Team[] = [
        { id: "1", name: "Engine Team", specialization: "Engine", memberCount: 8, totalWorkingHours: 64, averageAge: 32 },
        { id: "2", name: "Transmission Team", specialization: "Transmission", memberCount: 5, totalWorkingHours: 40, averageAge: 29 },
        { id: "3", name: "Electrical Team", specialization: "Electrical", memberCount: 6, totalWorkingHours: 48, averageAge: 35 },
        { id: "4", name: "Brakes Team", specialization: "Brakes", memberCount: 4, totalWorkingHours: 32, averageAge: 31 },
        { id: "5", name: "Suspension Team", specialization: "Suspension", memberCount: 7, totalWorkingHours: 56, averageAge: 34 },
        { id: "6", name: "Diagnostics Team", specialization: "Diagnostics", memberCount: 3, totalWorkingHours: 24, averageAge: 30 },
      ]
      setTeams(mockTeams)
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployee = async () => {
    try {
      setEmployeeLoading(true)
      setEmployeeError(null)
      
      console.log("Fetching employee profile...")
      
      // Try multiple endpoints - one of these should work
      const endpoints = [
        "http://localhost:8080/api/employee/profile",
        "http://localhost:8080/api/users/current",
        "http://localhost:8080/api/auth/me"
      ];
      
      let response = null;
      let userData = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            credentials: "include" // Important for session cookies
          });

          if (response.ok) {
            userData = await response.json();
            console.log(`Success with endpoint: ${endpoint}`, userData);
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      // If no endpoint worked, try a simple test endpoint
      if (!userData) {
        console.log("Trying fallback endpoint...");
        response = await fetch("http://localhost:8080/api/employee/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include"
        });

        if (response.ok) {
          // If dashboard works but profile doesn't, create a mock employee
          userData = {
            id: 1, // Default ID
            firstName: "Current",
            lastName: "Employee",
            username: "employee"
          };
        }
      }

      if (!userData) {
        throw new Error("All endpoints failed. Please check if you're logged in.");
      }

      const employeeInfo: Employee = {
        id: userData.id || 1, // Fallback to 1 if no ID
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : userData.username || userData.name || "Current Employee"
      }
      
      setEmployee(employeeInfo)
      console.log("Employee info set:", employeeInfo)
      
    } catch (error) {
      console.error("Error fetching employee:", error)
      setEmployeeError(error instanceof Error ? error.message : "Unknown error occurred")
      
      // Set a fallback employee if fetch fails
      const fallbackEmployee: Employee = {
        id: 1,
        name: "Current Employee"
      }
      setEmployee(fallbackEmployee)
    } finally {
      setEmployeeLoading(false)
    }
  }

  const handleAddMember = (teamId?: string) => {
    setSelectedTeam(teamId || null)
    setShowForm(true)
  }

  const handleAddTeam = () => {
    setShowTeamForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setSelectedTeam(null)
  }

  const handleTeamFormClose = () => {
    setShowTeamForm(false)
  }

  const handleMemberAdded = () => {
    fetchTeams()
    handleFormClose()
  }

  const handleTeamAdded = () => {
    fetchTeams()
    handleTeamFormClose()
  }

  // Team summary statistics
  const totalMembers = teams.reduce((sum, team) => sum + team.memberCount, 0)
  const totalWorkingHours = teams.reduce((sum, team) => sum + team.totalWorkingHours, 0)
  const averageAgeAll = teams.length > 0 
    ? Math.round(teams.reduce((sum, team) => sum + team.averageAge, 0) / teams.length)
    : 0

  // Retry employee fetch
  const retryFetchEmployee = () => {
    fetchEmployee()
  }

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
                  <button 
                    onClick={retryFetchEmployee}
                    className={styles.retryButton}
                  >
                    Retry
                  </button>
                </div>
              ) : employee ? (
                <div className={styles.employeeCard}>
                  <div className={styles.employeeAvatar}>
                    {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className={styles.employeeDetails}>
                    <div className={styles.employeeName}>{employee.name}</div>
                    <div className={styles.employeeId}>Employee ID: {employee.id}</div>
                    <div className={styles.employeeRole}>Team Manager</div>
                  </div>
                </div>
              ) : (
                <div className={styles.employeeError}>
                  <div>No employee data available</div>
                  <button 
                    onClick={retryFetchEmployee}
                    className={styles.retryButton}
                  >
                    Retry
                  </button>
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
              <h3>{totalMembers}</h3>
              <p>Total Members</p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryIcon}>⏱️</div>
            <div className={styles.summaryContent}>
              <h3>{totalWorkingHours}</h3>
              <p>Total Hours/Day</p>
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
              <h3>{teams.length}</h3>
              <p>Total Teams</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
          
          {loading ? (
            <div className={styles.loadingState}>Loading teams...</div>
          ) : (
            <div className={styles.teamsGrid}>
              {teams.map((team) => (
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
                    <button
                      onClick={() => handleAddMember(team.id)}
                      className={`${styles.btnPrimary} ${styles.fullWidth}`}
                    >
                      <span className={styles.btnIcon}>+</span>
                      Add Member to {team.name}
                    </button>
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
          <TeamMembersTable teams={teams} />
        </div>
      )}

      {/* Floating Add Member Button */}
      <button
        className={styles.floatingButton}
        onClick={() => handleAddMember()}
        title="Add New Team Member"
      >
        <span className={styles.floatingButtonIcon}>+</span>
        <span className={styles.floatingButtonText}>Add Member</span>
      </button>

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
    </div>
  )
}