"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../../styles/team.module.css"
import { getToken, removeToken } from "../../utils/auth"

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

interface TeamDetailsProps {
  teamId: string
  onClose: () => void
  onTeamUpdated?: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TeamDetails({ teamId, onClose, onTeamUpdated }: TeamDetailsProps) {
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    specialization: "",
    description: ""
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails()
      fetchTeamMembers()
    }
  }, [teamId])

  const fetchTeamDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/employee/teams/${teamId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const teamData = await response.json();
        console.log("Team details received:", teamData);

        const transformedTeam: Team = {
          id: teamData.id?.toString() || teamId,
          name: teamData.name || teamData.teamName || "Unnamed Team",
          specialization: teamData.specialization || "General",
          memberCount: teamData.memberCount || 0,
          totalWorkingHours: teamData.totalWorkingHours || 0,
          averageAge: Math.round(teamData.averageAge) || 0,
          description: teamData.description,
          employeeId: teamData.employeeId?.toString(),
          employeeName: teamData.employeeName
        };

        setTeam(transformedTeam);
        setEditForm({
          name: transformedTeam.name,
          specialization: transformedTeam.specialization,
          description: transformedTeam.description || ""
        });
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
      console.error("Error fetching team details:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while fetching team details";
      setError(errorMessage);
    } finally {
      setLoading(false)
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

      const response = await fetch(`${API_URL}/api/employee/team/${teamId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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

  const handleEdit = () => {
    setIsEditing(true);
  }

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (team) {
      setEditForm({
        name: team.name,
        specialization: team.specialization,
        description: team.description || ""
      });
    }
  }

  const handleSave = async () => {
    try {
      setError(null);
      setActionLoading(true);
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      // Get the current employee ID from the team data or from user session
      const employeeId = team?.employeeId || getCurrentEmployeeId();
      
      if (!employeeId) {
        throw new Error("Employee ID is required for updating the team.");
      }

      const response = await fetch(`${API_URL}/api/employee/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          specialization: editForm.specialization,
          description: editForm.description,
          employeeId: employeeId
        }),
      });

      if (response.ok) {
        const updatedTeam = await response.json();
        console.log("Team updated successfully:", updatedTeam);

        const transformedTeam: Team = {
          id: updatedTeam.id?.toString() || teamId,
          name: updatedTeam.name || updatedTeam.teamName || "Unnamed Team",
          specialization: updatedTeam.specialization || "General",
          memberCount: updatedTeam.memberCount || 0,
          totalWorkingHours: updatedTeam.totalWorkingHours || 0,
          averageAge: Math.round(updatedTeam.averageAge) || 0,
          description: updatedTeam.description,
          employeeId: updatedTeam.employeeId?.toString(),
          employeeName: updatedTeam.employeeName
        };

        setTeam(transformedTeam);
        setIsEditing(false);
        
        // Call the parent callback to refresh data and show toast
        if (onTeamUpdated) {
          onTeamUpdated();
        }
        
        // Show success message
        showSuccessToast(`Team "${transformedTeam.name}" updated successfully!`);
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
      console.error("Error updating team:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while updating team";
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  // Helper function to get current employee ID
  const getCurrentEmployeeId = (): string | null => {
    if (team?.employeeId) {
      return team.employeeId;
    }
    
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id?.toString() || user.employeeId?.toString() || null;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      setError(null);
      setActionLoading(true);
      
      const token = getToken();
      if (!token) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const employeeId = team?.employeeId || getCurrentEmployeeId();
      const teamName = team?.name || "this team";
      
      const response = await fetch(`${API_URL}/api/employee/teams/${teamId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: employeeId ? JSON.stringify({ employeeId }) : undefined,
      });

      if (response.ok) {
        console.log("Team deleted successfully");
        
        // Show success message before closing
        showSuccessToast(`Team "${teamName}" deleted successfully!`);
        
        // Call the parent callback to refresh data
        if (onTeamUpdated) {
          onTeamUpdated();
        }
        
        // Close the modal after a short delay to show the toast
        setTimeout(() => {
          onClose();
        }, 1000);
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
      console.error("Error deleting team:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred while deleting team";
      setError(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  }

  // Function to show success toast (this will be handled by the parent component)
  const showSuccessToast = (message: string) => {
    // Dispatch a custom event that the parent component can listen to
    const event = new CustomEvent('showToast', {
      detail: {
        message,
        type: 'success'
      }
    });
    window.dispatchEvent(event);
  }

  // Function to show error toast
  const showErrorToast = (message: string) => {
    // Dispatch a custom event that the parent component can listen to
    const event = new CustomEvent('showToast', {
      detail: {
        message,
        type: 'error'
      }
    });
    window.dispatchEvent(event);
  }

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            Loading team details...
          </div>
        </div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Failed to load team details</h3>
            <p>{error}</p>
            <div className={styles.errorActions}>
              <button onClick={fetchTeamDetails} className={styles.retryButton}>
                Retry
              </button>
              <button onClick={onClose} className={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? "Edit Team" : "Team Details"}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.inlineError}>
              <div className={styles.errorIcon}>⚠️</div>
              {error}
            </div>
          )}

          {team && (
            <div className={styles.teamDetailsContent}>
              {isEditing ? (
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Team Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editForm.name}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="specialization">Specialization</label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={editForm.specialization}
                      onChange={handleInputChange}
                      className={styles.formSelect}
                    >
                      <option value="General">General</option>
                      <option value="Construction">Construction</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Landscaping">Landscaping</option>
                      <option value="Painting">Painting</option>
                      <option value="Masonry">Masonry</option>
                      <option value="Roofing">Roofing</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={editForm.description}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.teamInfo}>
                  <div className={styles.teamHeader}>
                    <h3 className={styles.teamName}>{team.name}</h3>
                    <span className={styles.specializationBadge}>{team.specialization}</span>
                  </div>
                  
                  {team.description && (
                    <div className={styles.teamDescription}>
                      <p>{team.description}</p>
                    </div>
                  )}
                  
                  <div className={styles.teamStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Maximum Members Count</span>
                      <span className={styles.statValue}>{team.memberCount}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Average Working Hours/Day</span>
                      <span className={styles.statValue}>{team.totalWorkingHours}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Average Age (min)</span>
                      <span className={styles.statValue}>{team.averageAge}</span>
                    </div>
                  </div>
                  
                  {team.employeeName && (
                    <div className={styles.teamManager}>
                      <strong>Team Manager:</strong> {team.employeeName}
                    </div>
                  )}
                </div>
              )}

              {/* Team Members Section */}
              <div className={styles.teamMembersSection}>
                <h4>Team Members ({teamMembers.length})</h4>
                
                {membersLoading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.loadingSpinner}></div>
                    Loading team members...
                  </div>
                ) : membersError ? (
                  <div className={styles.errorState}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <p>{membersError}</p>
                    <button onClick={fetchTeamMembers} className={styles.retryButton}>
                      Retry
                    </button>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No members in this team yet.</p>
                  </div>
                ) : (
                  <div className={styles.membersList}>
                    {teamMembers.map((member) => (
                      <div key={member.id} className={styles.memberCard}>
                        <div className={styles.memberInfo}>
                          <div className={styles.memberName}>{member.fullName}</div>
                          <div className={styles.memberDetails}>
                            <span>Age: {member.age}</span>
                            <span>•</span>
                            <span>Hours: {member.workingHoursPerDay}</span>
                            <span>•</span>
                            <span>{member.specialization}</span>
                          </div>
                          <div className={styles.memberContact}>
                            {member.contactNo} • {member.city}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className={styles.btnPrimary}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button 
                onClick={handleCancelEdit} 
                className={styles.btnSecondary}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEdit} 
                className={styles.btnPrimary}
              >
                Edit Team
              </button>
              <button 
                onClick={handleDelete} 
                className={styles.btnDanger}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span className={styles.loadingSpinner}></span>
                    Deleting...
                  </>
                ) : (
                  "Delete Team"
                )}
              </button>
              <button onClick={onClose} className={styles.btnSecondary}>
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}