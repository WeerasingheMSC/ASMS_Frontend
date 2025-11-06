"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken, removeToken } from "../../utils/auth"
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
  teamId: string | number
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Use useCallback to prevent unnecessary re-renders
  const filterMembers = useCallback(() => {
    const membersArray = Array.isArray(teamMembers) ? teamMembers : []
    
    let filtered = [...membersArray]

    if (selectedTeam !== "all") {
      filtered = filtered.filter(member => {
        // Convert both to string for comparison to handle number/string teamIds
        const memberTeamId = String(member.teamId)
        const selectedTeamId = String(selectedTeam)
        return memberTeamId === selectedTeamId
      })
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(member => {
        // Safe string conversion for all fields
        const fullName = member.fullName?.toLowerCase() || ''
        const nic = member.nic?.toLowerCase() || ''
        const contactNo = member.contactNo?.toLowerCase() || ''
        const specialization = member.specialization?.toLowerCase() || ''
        const city = member.city?.toLowerCase() || ''
        const teamId = String(member.teamId).toLowerCase() || ''

        return (
          fullName.includes(term) ||
          nic.includes(term) ||
          contactNo.includes(term) ||
          specialization.includes(term) ||
          city.includes(term) ||
          teamId.includes(term)
        )
      })
    }

    setFilteredMembers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [teamMembers, selectedTeam, searchTerm])

  useEffect(() => {
    filterMembers()
  }, [filterMembers])

  // Function to show success toast
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
      const token = getToken()
      
      if (!token) {
        showErrorToast("No authentication token found. Please log in again.");
        removeToken();
        window.location.href = '/signin';
        return;
      }

      const response = await fetch(`${API_URL}/api/employee/${memberId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        showSuccessToast("Team member deleted successfully!");
        window.location.reload();
      } else {
        let errorMessage = "Failed to delete team member";
        if (response.status === 403) {
          errorMessage = "Access forbidden. You don't have permission to delete team members.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
          removeToken();
          window.location.href = '/signin';
        }
        showErrorToast(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting team member:", error)
      showErrorToast("Failed to delete team member. Please check your connection.");
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMember = async (updatedMember: TeamMember) => {
    try {
      setLoading(true)
      const token = getToken()
      
      if (!token) {
        showErrorToast("No authentication token found. Please log in again.");
        removeToken();
        window.location.href = '/signin';
        return;
      }

      const teamMemberDTO = {
        fullName: updatedMember.fullName,
        nic: updatedMember.nic,
        contactNo: updatedMember.contactNo,
        birthDate: updatedMember.birthDate,
        address: updatedMember.address,
        city: updatedMember.city,
        specialization: updatedMember.specialization,
        joinedDate: updatedMember.joinedDate,
        workingHoursPerDay: updatedMember.workingHoursPerDay,
        teamId: updatedMember.teamId,
        supervisorId: updatedMember.supervisorId
      }

      const response = await fetch(`${API_URL}/api/employee/${updatedMember.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamMemberDTO),
      })

      if (response.ok) {
        showSuccessToast(`Team member "${updatedMember.fullName}" updated successfully!`);
        setShowMemberModal(false);
        window.location.reload();
      } else {
        let errorMessage = "Failed to update team member";
        if (response.status === 403) {
          errorMessage = "Access forbidden. You don't have permission to update team members.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
          removeToken();
          window.location.href = '/signin';
        } else if (response.status === 400) {
          errorMessage = "Invalid data. Please check all fields and try again.";
        }
        
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
        } catch {}
        
        showErrorToast(errorMessage);
      }
    } catch (error) {
      console.error("Error updating team member:", error)
      showErrorToast("Failed to update team member. Please check your connection.");
    } finally {
      setLoading(false)
    }
  }

  const getTeamName = (teamId: string | number) => {
    // Convert teamId to string for comparison
    const teamIdStr = String(teamId)
    const team = teams.find(t => String(t.id) === teamIdStr)
    return team ? team.name : `Team ${teamId}`
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMembers = filteredMembers.slice(startIndex, endIndex)

  // Ensure teams is always an array
  const teamsArray = Array.isArray(teams) ? teams : []
  const membersArray = Array.isArray(teamMembers) ? teamMembers : []

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1) // Reset to first page
  }

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
            
            {/* Items per page selector */}
            <select 
              value={itemsPerPage} 
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className={styles.filterSelect}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="30">30 per page</option>
              <option value="50">50 per page</option>
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
          <>
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
                {currentMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className={styles.memberName}>
                        <div className={styles.nameAvatar}>
                          {member.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span>{member.fullName}</span>
                      </div>
                    </td>
                    <td>{member.nic}</td>
                    <td>
                      <span className={styles.teamBadge}>
                        {getTeamName(member.teamId)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.teamBadge}>
                        {member.specialization}
                      </span>
                    </td>
                    <td>{member.contactNo}</td>
                    <td>{member.age}</td>
                    <td>{member.city}</td>
                    <td>
                      {new Date(member.joinedDate).toLocaleDateString()}
                    </td>
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
                          disabled={loading}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleEditMember(member)}
                          className={styles.btnEdit}
                          title="Edit Member"
                          disabled={loading}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className={styles.btnDelete}
                          title="Delete Member"
                          disabled={loading}
                        >
                          {loading ? "⏳" : "🗑️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <div className={styles.paginationInfo}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
                </div>
                
                <div className={styles.paginationControls}>
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`${styles.pageButton} ${
                          currentPage === page ? styles.pageButtonActive : ''
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enhanced Popup Modal with Light Background */}
      {showMemberModal && selectedMember && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2>
                  {modalMode === "view" ? "Team Member Details" : "Edit Team Member"}
                </h2>
                <p className={styles.modalSubtitle}>
                  {modalMode === "view" ? "Complete information about the team member" : "Update team member information"}
                </p>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className={styles.closeButton}
                disabled={loading}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalMode === "view" ? (
                <div className={styles.viewContent}>
                  {/* Personal Information */}
                  <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>
                      Personal Information
                    </h3>
                    <div className={styles.detailGrid}>
                      {[
                        { label: "Full Name", value: selectedMember.fullName },
                        { label: "NIC", value: selectedMember.nic },
                        { label: "Birth Date", value: new Date(selectedMember.birthDate).toLocaleDateString() },
                        { label: "Age", value: `${selectedMember.age} years` },
                        { label: "Contact", value: selectedMember.contactNo },
                        { label: "City", value: selectedMember.city }
                      ].map((item, index) => (
                        <div key={index} className={styles.detailItem}>
                          <label className={styles.detailLabel}>
                            {item.label}
                          </label>
                          <div className={styles.detailValue}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>
                      Work Information
                    </h3>
                    <div className={styles.detailGrid}>
                      {[
                        { label: "Team", value: getTeamName(selectedMember.teamId) },
                        { label: "Specialization", value: selectedMember.specialization },
                        { label: "Working Hours", value: `${selectedMember.workingHoursPerDay} hours/day` },
                        { label: "Joined Date", value: new Date(selectedMember.joinedDate).toLocaleDateString() },
                      ].map((item, index) => (
                        <div key={index} className={styles.detailItem}>
                          <label className={styles.detailLabel}>
                            {item.label}
                          </label>
                          <div className={styles.detailValue}>
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  <div className={styles.formSection}>
                    <h3 className={styles.formSectionTitle}>
                      Address Information
                    </h3>
                    <div className={styles.detailItem}>
                      <label className={styles.detailLabel}>
                        Full Address
                      </label>
                      <div className={styles.detailValue}>
                        {selectedMember.address}
                      </div>
                    </div>
                  </div>

                  {/* Supervisor */}
                  {selectedMember.supervisorName && (
                    <div className={styles.formSection}>
                      <h3 className={styles.formSectionTitle}>
                        Supervisor Information
                      </h3>
                      <div className={styles.detailItem}>
                        <label className={styles.detailLabel}>
                          Supervisor Name
                        </label>
                        <div className={styles.detailValue}>
                          {selectedMember.supervisorName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveMember(selectedMember)
                }} className={styles.editForm}>
                  <div className={styles.formGrid}>
                    {/* Personal Information */}
                    <div className={styles.formGroup}>
                      <h3 className={styles.formSectionTitle}>
                        Personal Details
                      </h3>
                      
                      <div className={styles.formFields}>
                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={selectedMember.fullName || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              fullName: e.target.value
                            })}
                            className={styles.formInput}
                            required
                            disabled={loading}
                            placeholder="Enter full name"
                          />
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            NIC *
                          </label>
                          <input
                            type="text"
                            value={selectedMember.nic || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              nic: e.target.value
                            })}
                            className={styles.formInput}
                            required
                            disabled={loading}
                            placeholder="Enter NIC number"
                          />
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            Contact Number *
                          </label>
                          <input
                            type="tel"
                            value={selectedMember.contactNo || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              contactNo: e.target.value
                            })}
                            className={styles.formInput}
                            required
                            disabled={loading}
                            placeholder="Enter contact number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Work Information */}
                    <div className={styles.formGroup}>
                      <h3 className={styles.formSectionTitle}>
                        Work Details
                      </h3>
                      
                      <div className={styles.formFields}>
                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            Team *
                          </label>
                          <select
                            value={String(selectedMember.teamId) || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              teamId: e.target.value
                            })}
                            className={styles.formSelect}
                            required
                            disabled={loading}
                          >
                            {teamsArray.map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            Specialization *
                          </label>
                          <select
                            value={selectedMember.specialization || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              specialization: e.target.value
                            })}
                            className={styles.formSelect}
                            required
                            disabled={loading}
                          >
                            {Object.entries(SpecializationEnum).map(([key, value]) => (
                              <option key={value} value={value}>
                                {key.charAt(0) + key.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            Working Hours *
                          </label>
                          <select
                            value={selectedMember.workingHoursPerDay || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              workingHoursPerDay: e.target.value
                            })}
                            className={styles.formSelect}
                            required
                            disabled={loading}
                          >
                            <option value="4">4 hours</option>
                            <option value="6">6 hours</option>
                            <option value="8">8 hours</option>
                            <option value="10">10 hours</option>
                            <option value="12">12 hours</option>
                          </select>
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.formLabel}>
                            City *
                          </label>
                          <select
                            value={selectedMember.city || ""}
                            onChange={(e) => setSelectedMember({
                              ...selectedMember,
                              city: e.target.value
                            })}
                            className={styles.formSelect}
                            required
                            disabled={loading}
                          >
                            {Object.entries(CityEnum).map(([key, value]) => (
                              <option key={value} value={value}>
                                {key.charAt(0) + key.slice(1).toLowerCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className={styles.formGroup}>
                    <h3 className={styles.formSectionTitle}>
                      Address Information
                    </h3>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>
                        Full Address *
                      </label>
                      <textarea
                        value={selectedMember.address || ""}
                        onChange={(e) => setSelectedMember({
                          ...selectedMember,
                          address: e.target.value
                        })}
                        rows={4}
                        className={styles.formTextarea}
                        required
                        disabled={loading}
                        placeholder="Enter complete address"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className={styles.btnSecondary}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.btnPrimary}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className={styles.loadingText}>
                          <div className={styles.loadingSpinnerSmall}></div>
                          Saving Changes...
                        </span>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* View Mode Actions */}
            {modalMode === "view" && (
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setModalMode("edit")}
                  className={styles.btnPrimary}
                  disabled={loading}
                >
                  Edit Member
                </button>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className={styles.btnSecondary}
                  disabled={loading}
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