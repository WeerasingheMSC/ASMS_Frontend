"use client"

import { useEffect, useState, useCallback } from "react"
import styles from "../../styles/team.module.css"

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

interface Team {
  id: string
  name: string
  specialization: string
}

interface TeamMembersTableProps {
  teams: Team[]
  teamMembers: TeamMember[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// City enum to match backend
const CityEnum = {
  AMPARA: "AMPARA",
  ANURADHAPURA: "ANURADHAPURA",
  BADULLA: "BADULLA",
  BATTICALOA: "BATTICALOA",
  COLOMBO: "COLOMBO",
  GALLE: "GALLE",
  GAMPAHA: "GAMPAHA",
  HAMBANTOTA: "HAMBANTOTA",
  JAFFNA: "JAFFNA",
  KALUTARA: "KALUTARA",
  KANDY: "KANDY",
  KEGALLE: "KEGALLE",
  KILINOCHCHI: "KILINOCHCHI",
  KURUNEGALA: "KURUNEGALA",
  MANNAR: "MANNAR",
  MATALE: "MATALE",
  MATARA: "MATARA",
  MONERAGALA: "MONERAGALA",
  MULLAITIVU: "MULLAITIVU",
  NUWARA_ELIYA: "NUWARA_ELIYA",
  POLONNARUWA: "POLONNARUWA",
  PUTTALAM: "PUTTALAM",
  RATNAPURA: "RATNAPURA",
  TRINCOMALEE: "TRINCOMALEE",
  VAVUNIYA: "VAVUNIYA"
} as const;

// Specialization enum to match backend
const SpecializationEnum = {
  ENGINE: "ENGINE",
  TRANSMISSION: "TRANSMISSION",
  SUSPENSION: "SUSPENSION",
  BRAKES: "BRAKES",
  ELECTRICAL: "ELECTRICAL",
  BODYWORK: "BODYWORK",
  INTERIOR: "INTERIOR",
  DIAGNOSTICS: "DIAGNOSTICS"
} as const;

export default function TeamMembersTable({ teams = [], teamMembers = [] }: TeamMembersTableProps) {
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [modalMode, setModalMode] = useState<"view" | "edit">("view")

  // Use useCallback to prevent unnecessary re-renders
  const filterMembers = useCallback(() => {
    const membersArray = Array.isArray(teamMembers) ? teamMembers : []
    
    let filtered = [...membersArray]

    if (selectedTeam !== "all") {
      filtered = filtered.filter(member => member.teamId === selectedTeam)
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(member =>
        member.fullName?.toLowerCase().includes(term) ||
        member.nic?.toLowerCase().includes(term) ||
        member.contactNo?.toLowerCase().includes(term) ||
        member.specialization?.toLowerCase().includes(term) ||
        member.city?.toLowerCase().includes(term) ||
        member.teamId?.toLowerCase().includes(term)
      )
    }

    setFilteredMembers(filtered)
  }, [teamMembers, selectedTeam, searchTerm])

  useEffect(() => {
    filterMembers()
  }, [filterMembers])

  const handleViewMember = (member: TeamMember) => {
    setSelectedMember(member)
    setModalMode("view")
    setShowMemberModal(true)
  }

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member)
    setModalMode("edit")
    setShowMemberModal(true)
  }

  const handleDeleteMember = async (memberId: number) => {
    if (!confirm("Are you sure you want to delete this team member?")) {
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_URL}/api/employee/${memberId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        alert("Team member deleted successfully")
        window.location.reload()
      } else {
        let errorMessage = "Failed to delete team member";
        if (response.status === 403) {
          errorMessage = "Access forbidden. You don't have permission to delete team members.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting team member:", error)
      alert("Failed to delete team member. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMember = async (updatedMember: TeamMember) => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        alert("No authentication token found. Please log in again.");
        return;
      }

      // Transform the data to match your DTO structure with proper enums
      const teamMemberDTO = {
        fullName: updatedMember.fullName,
        nic: updatedMember.nic,
        contactNo: updatedMember.contactNo,
        birthDate: updatedMember.birthDate,
        address: updatedMember.address,
        city: updatedMember.city, // This should be the enum value like "COLOMBO", "KANDY"
        specialization: updatedMember.specialization, // This should be the enum value like "ENGINE", "ELECTRICAL"
        joinedDate: updatedMember.joinedDate,
        workingHoursPerDay: updatedMember.workingHoursPerDay,
        teamId: updatedMember.teamId,
        supervisorId: updatedMember.supervisorId
      }

      console.log("Sending update request:", {
        url: `${API_URL}/api/employee/${updatedMember.id}`,
        data: teamMemberDTO
      });

      const response = await fetch(`${API_URL}/api/employee/${updatedMember.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamMemberDTO),
      })

      if (response.ok) {
        alert("Team member updated successfully")
        setShowMemberModal(false)
        window.location.reload()
      } else {
        let errorMessage = "Failed to update team member";
        if (response.status === 403) {
          errorMessage = "Access forbidden. You don't have permission to update team members.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (response.status === 400) {
          errorMessage = "Invalid data. Please check all fields and try again.";
        }
        
        // Try to get more detailed error message
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
          }
        } catch {
          // Ignore error reading response body
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating team member:", error)
      alert("Failed to update team member. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.name : `Team ${teamId}`
  }

  // Ensure teams is always an array
  const teamsArray = Array.isArray(teams) ? teams : []
  const membersArray = Array.isArray(teamMembers) ? teamMembers : []

  return (
    <div className={styles.teamMembersTable}>
      {/* Header with Search and Filters */}
      <div className={styles.tableHeader}>
        <div className={styles.headerLeft}>
          <h3>Team Members ({filteredMembers.length})</h3>
          <p>Manage all team members across different teams</p>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name, NIC, contact, specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <div className={styles.filterSection}>
            <select 
              value={selectedTeam} 
              onChange={(e) => setSelectedTeam(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Teams</option>
              {teamsArray.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {filteredMembers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <h4>No team members found</h4>
            <p>
              {searchTerm || selectedTeam !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "No team members available in the system"
              }
            </p>
          </div>
        ) : (
          <table className={styles.membersTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>NIC</th>
                <th>Team</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Age</th>
                <th>City</th>
                <th>Joined Date</th>
                <th>Hours/Day</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className={styles.memberName}>
                    <div className={styles.nameAvatar}>
                      {member.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    {member.fullName}
                  </td>
                  <td>{member.nic}</td>
                  <td>
                    <span className={styles.teamBadge}>
                      {getTeamName(member.teamId)}
                    </span>
                  </td>
                  <td>
                    <span className={styles.specializationBadge}>
                      {member.specialization}
                    </span>
                  </td>
                  <td>{member.contactNo}</td>
                  <td>{member.age}</td>
                  <td>{member.city}</td>
                  <td>{new Date(member.joinedDate).toLocaleDateString()}</td>
                  <td>
                    <span className={styles.hoursBadge}>
                      {member.workingHoursPerDay}h
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleViewMember(member)}
                        className={styles.btnView}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditMember(member)}
                        className={styles.btnEdit}
                        title="Edit Member"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className={styles.btnDelete}
                        title="Delete Member"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Member Detail/Edit Modal */}
      {showMemberModal && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.memberModal}>
            <div className={styles.modalHeader}>
              <h2>
                {modalMode === "view" ? "Team Member Details" : "Edit Team Member"}
              </h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div className={styles.modalContent}>
              {modalMode === "view" ? (
                <div className={styles.memberDetails}>
                  <div className={styles.detailSection}>
                    <h3>Personal Information</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <label>Full Name:</label>
                        <span>{selectedMember.fullName}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>NIC:</label>
                        <span>{selectedMember.nic}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Birth Date:</label>
                        <span>{new Date(selectedMember.birthDate).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Age:</label>
                        <span>{selectedMember.age} years</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Contact:</label>
                        <span>{selectedMember.contactNo}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h3>Work Information</h3>
                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <label>Team:</label>
                        <span>{getTeamName(selectedMember.teamId)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Specialization:</label>
                        <span>{selectedMember.specialization}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Working Hours:</label>
                        <span>{selectedMember.workingHoursPerDay} hours/day</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>Joined Date:</label>
                        <span>{new Date(selectedMember.joinedDate).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <label>City:</label>
                        <span>{selectedMember.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.detailSection}>
                    <h3>Address</h3>
                    <div className={styles.detailItemFull}>
                      <label>Full Address:</label>
                      <span>{selectedMember.address}</span>
                    </div>
                  </div>

                  {selectedMember.supervisorName && (
                    <div className={styles.detailSection}>
                      <h3>Supervisor</h3>
                      <div className={styles.detailItem}>
                        <label>Supervisor:</label>
                        <span>{selectedMember.supervisorName}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.editForm}>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    handleSaveMember(selectedMember)
                  }}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={selectedMember.fullName || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            fullName: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>NIC *</label>
                        <input
                          type="text"
                          value={selectedMember.nic || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            nic: e.target.value
                          })}
                          required
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Contact Number *</label>
                        <input
                          type="tel"
                          value={selectedMember.contactNo || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            contactNo: e.target.value
                          })}
                          required
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Working Hours *</label>
                        <select
                          value={selectedMember.workingHoursPerDay || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            workingHoursPerDay: e.target.value
                          })}
                          required
                        >
                          <option value="4">4 hours</option>
                          <option value="6">6 hours</option>
                          <option value="8">8 hours</option>
                          <option value="10">10 hours</option>
                          <option value="12">12 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Team *</label>
                        <select
                          value={selectedMember.teamId || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            teamId: e.target.value
                          })}
                          required
                        >
                          {teamsArray.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Specialization *</label>
                        <select
                          value={selectedMember.specialization || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            specialization: e.target.value
                          })}
                          required
                        >
                          {Object.entries(SpecializationEnum).map(([key, value]) => (
                            <option key={value} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>City *</label>
                        <select
                          value={selectedMember.city || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            city: e.target.value
                          })}
                          required
                        >
                          {Object.entries(CityEnum).map(([key, value]) => (
                            <option key={value} value={value}>
                              {key.charAt(0) + key.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Address *</label>
                      <textarea
                        value={selectedMember.address || ""}
                        onChange={(e) => setSelectedMember({
                          ...selectedMember,
                          address: e.target.value
                        })}
                        rows={3}
                        required
                      />
                    </div>

                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        onClick={() => setShowMemberModal(false)}
                        className={styles.btnSecondary}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.btnPrimary}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {modalMode === "view" && (
              <div className={styles.modalActions}>
                <button
                  onClick={() => setModalMode("edit")}
                  className={styles.btnPrimary}
                >
                  Edit Member
                </button>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className={styles.btnSecondary}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}