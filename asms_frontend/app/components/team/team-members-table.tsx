"use client"

import { useEffect, useState } from "react"
import styles from "../../styles/team.module.css"

interface TeamMember {
  id: string
  fullName: string
  teamName: string
  specialization: string
  contactNo: string
  age: number
  joinedDate: string
  workingHoursPerDay: number
  city: string
  nic: string
  address: string
  birthDate: string
}

interface Team {
  id: string
  name: string
}

interface TeamMembersTableProps {
  teams: Team[]
}

export default function TeamMembersTable({ teams }: TeamMembersTableProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<string>("all")

  useEffect(() => {
    fetchMembers()
  }, [teams, selectedTeam])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const url = selectedTeam === "all" 
        ? "/api/team-members" 
        : `/api/team-members?teamId=${selectedTeam}`
      
      const response = await fetch(url)
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.teamMembersTable}>
      <div className={styles.tableHeader}>
        <h3>All Team Members</h3>
        <div className={styles.filterSection}>
          <label>Filter by Team:</label>
          <select 
            value={selectedTeam} 
            onChange={(e) => setSelectedTeam(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>Loading team members...</div>
        ) : members.length === 0 ? (
          <div className={styles.emptyState}>No team members found</div>
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
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.fullName}</td>
                  <td>{member.nic}</td>
                  <td>{member.teamName}</td>
                  <td>{member.specialization}</td>
                  <td>{member.contactNo}</td>
                  <td>{member.age}</td>
                  <td>{member.city}</td>
                  <td>{new Date(member.joinedDate).toLocaleDateString()}</td>
                  <td>{member.workingHoursPerDay}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}