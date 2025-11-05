"use client"

import { useEffect, useState, useCallback } from "react"
import { getToken, removeToken } from "../../utils/auth"

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
      const token = getToken()
      
      if (!token) {
        alert("No authentication token found. Please log in again.");
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
        alert("Team member deleted successfully")
        window.location.reload()
      } else {
        let errorMessage = "Failed to delete team member";
        if (response.status === 403) {
          errorMessage = "Access forbidden. You don't have permission to delete team members.";
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
          removeToken();
          window.location.href = '/signin';
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
      const token = getToken()
      
      if (!token) {
        alert("No authentication token found. Please log in again.");
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
        alert("Team member updated successfully")
        setShowMemberModal(false)
        window.location.reload()
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
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating team member:", error)
      alert("Failed to update team member. Please check your connection.")
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

  // Ensure teams is always an array
  const teamsArray = Array.isArray(teams) ? teams : []
  const membersArray = Array.isArray(teamMembers) ? teamMembers : []

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">Team Members ({filteredMembers.length})</h3>
            <p className="text-gray-600 mt-1">Manage all team members across different teams</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                placeholder="Search by name, NIC, contact, specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <div className="flex gap-3">
              <select 
                value={selectedTeam} 
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-w-40 shadow-sm"
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
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="text-6xl mb-4 opacity-70">👥</div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No team members found</h4>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm || selectedTeam !== "all" 
                ? "Try adjusting your search or filter criteria" 
                : "No team members available in the system"
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">NIC</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Team</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Specialization</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Age</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">City</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Hours/Day</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md group-hover:scale-110 transition-transform duration-200">
                        {member.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{member.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.nic}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {getTeamName(member.teamId)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                      {member.specialization}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.contactNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{member.city}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(member.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      {member.workingHoursPerDay}h
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleViewMember(member)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="View Details"
                        disabled={loading}
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Edit Member"
                        disabled={loading}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        )}
      </div>

      {/* Enhanced Popup Modal with Light Background */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-6xl max-h-[95vh] overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="relative p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {modalMode === "view" ? "Team Member Details" : "Edit Team Member"}
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {modalMode === "view" ? "Complete information about the team member" : "Update team member information"}
                  </p>
                </div>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-2xl transition-all duration-200 disabled:opacity-50 group shadow-sm"
                  disabled={loading}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">×</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
              <div className="p-8">
                {modalMode === "view" ? (
                  <div className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[
                          { label: "Full Name", value: selectedMember.fullName },
                          { label: "NIC", value: selectedMember.nic },
                          { label: "Birth Date", value: new Date(selectedMember.birthDate).toLocaleDateString() },
                          { label: "Age", value: `${selectedMember.age} years` },
                          { label: "Contact", value: selectedMember.contactNo },
                          { label: "City", value: selectedMember.city }
                        ].map((item, index) => (
                          <div key={index} className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {item.label}
                            </label>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Work Information */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                        Work Information
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[
                          { label: "Team", value: getTeamName(selectedMember.teamId) },
                          { label: "Specialization", value: selectedMember.specialization },
                          { label: "Working Hours", value: `${selectedMember.workingHoursPerDay} hours/day` },
                          { label: "Joined Date", value: new Date(selectedMember.joinedDate).toLocaleDateString() },
                        ].map((item, index) => (
                          <div key={index} className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {item.label}
                            </label>
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium hover:bg-gray-100 transition-colors duration-200">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                        Address Information
                      </h3>
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Full Address
                        </label>
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium min-h-[100px] hover:bg-gray-100 transition-colors duration-200 leading-relaxed">
                          {selectedMember.address}
                        </div>
                      </div>
                    </div>

                    {/* Supervisor */}
                    {selectedMember.supervisorName && (
                      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                          Supervisor Information
                        </h3>
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Supervisor Name
                          </label>
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium hover:bg-gray-100 transition-colors duration-200">
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
                  }} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Information */}
                      <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                          Personal Details
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={selectedMember.fullName || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                fullName: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
                              required
                              disabled={loading}
                              placeholder="Enter full name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              NIC *
                            </label>
                            <input
                              type="text"
                              value={selectedMember.nic || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                nic: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
                              required
                              disabled={loading}
                              placeholder="Enter NIC number"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Contact Number *
                            </label>
                            <input
                              type="tel"
                              value={selectedMember.contactNo || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                contactNo: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
                              required
                              disabled={loading}
                              placeholder="Enter contact number"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Work Information */}
                      <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                          Work Details
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Team *
                            </label>
                            <select
                              value={String(selectedMember.teamId) || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                teamId: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
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

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Specialization *
                            </label>
                            <select
                              value={selectedMember.specialization || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                specialization: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
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

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Working Hours *
                            </label>
                            <select
                              value={selectedMember.workingHoursPerDay || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                workingHoursPerDay: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
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

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              City *
                            </label>
                            <select
                              value={selectedMember.city || ""}
                              onChange={(e) => setSelectedMember({
                                ...selectedMember,
                                city: e.target.value
                              })}
                              className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm"
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
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                        Address Information
                      </h3>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Full Address *
                        </label>
                        <textarea
                          value={selectedMember.address || ""}
                          onChange={(e) => setSelectedMember({
                            ...selectedMember,
                            address: e.target.value
                          })}
                          rows={4}
                          className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg shadow-sm resize-vertical"
                          required
                          disabled={loading}
                          placeholder="Enter complete address"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-8 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setShowMemberModal(false)}
                        className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 border border-gray-300 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 text-lg shadow-sm hover:shadow-md"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 text-lg shadow-lg shadow-blue-500/25"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
            </div>

            {/* View Mode Actions */}
            {modalMode === "view" && (
              <div className="flex gap-4 justify-end p-8 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setModalMode("edit")}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 text-lg shadow-lg shadow-blue-500/25"
                  disabled={loading}
                >
                  Edit Member
                </button>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 border border-gray-300 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 text-lg shadow-sm hover:shadow-md"
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