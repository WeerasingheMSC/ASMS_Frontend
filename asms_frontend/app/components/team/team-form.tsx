"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import styles from "../../styles/team.module.css"

// Sri Lankan districts and major cities
const sriLankanDistricts = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
] as const

// Fixed enum schema for automobile service specializations
const specializationEnum = [
  "Engine",
  "Transmission", 
  "Suspension",
  "Brakes",
  "Electrical",
  "Bodywork",
  "Interior",
  "Diagnostics"
] as const

const workingHoursEnum = ["4", "6", "8", "10", "12"] as const

// Create enum types
const DistrictEnum = z.enum(sriLankanDistricts)
const SpecializationEnum = z.enum(specializationEnum)
const WorkingHoursEnum = z.enum(workingHoursEnum)

const teamMemberSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters")
    .transform(val => val.trim()),
  nic: z
    .string()
    .min(1, "NIC is required")
    .regex(/^[0-9]{12}$/, "NIC must be exactly 12 digits")
    .transform((val) => val.trim()),
  contactNo: z.string()
    .min(1, "Contact number is required")
    .regex(/^[0-9]{10,15}$/, "Contact number must be 10-15 digits"),
  birthDate: z.string()
    .min(1, "Birth date is required")
    .refine((date) => {
      const dateObj = new Date(date)
      const today = new Date()
      let age = today.getFullYear() - dateObj.getFullYear()
      const monthDiff = today.getMonth() - dateObj.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
        age--
      }
      return age >= 18 && age <= 80
    }, "Employee must be between 18 and 80 years old"),
  address: z
    .string()
    .min(1, "Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters")
    .transform(val => val.trim()),
  city: z.union([
    DistrictEnum,
    z.literal("")
  ]).refine(
    (val) => val !== "",
    { message: "Please select a city/district" }
  ),
  specialization: z.union([
    SpecializationEnum,
    z.literal("")
  ]).refine(
    (val) => val !== "",
    { message: "Please select a specialization" }
  ),
  joinedDate: z.string()
    .min(1, "Joined date is required")
    .refine((date) => {
      return new Date(date) <= new Date()
    }, "Joined date cannot be in the future"),
  workingHoursPerDay: z.union([
    WorkingHoursEnum,
    z.literal("")
  ]).refine(
    (val) => val !== "",
    { message: "Please select working hours" }
  ),
  teamId: z.string().min(1, "Team selection is required"),
})

type TeamMemberFormData = z.infer<typeof teamMemberSchema>

interface Team {
  id: string
  name: string
  specialization: string
}

interface User {
  id: number
  firstName: string
  lastName: string
  username?: string
  position?: string
}

interface TeamFormProps {
  teamId?: string
  onClose: () => void
  onSuccess: () => void
}

// Auth utility functions
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.token || null;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return localStorage.getItem('jwtToken');
  }
  return null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function TeamForm({ teamId, onClose, onSuccess }: TeamFormProps) {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      fullName: "",
      nic: "",
      contactNo: "",
      birthDate: "",
      address: "",
      city: "",
      specialization: "",
      joinedDate: new Date().toISOString().split("T")[0],
      workingHoursPerDay: "",
      teamId: teamId || "",
    },
  })

  // Fetch current user and teams
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchCurrentUser(), fetchTeams()])
      } catch (error) {
        console.error("Error fetching data:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load required data"
        setErrors({ submit: errorMessage })
      }
    }

    fetchData()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true)
      const token = getToken()
      console.log("Token available for user fetch:", !!token)
      
      if (!token) {
        throw new Error("No authentication token found. Please log in again.")
      }

      const response = await fetch(`${API_URL}/api/employee/current`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("Response status for user fetch:", response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log("User data fetched successfully:", userData)
        
        const userInfo: User = {
          id: userData.id,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          username: userData.username,
          position: userData.position
        }
        
        console.log("Setting current user:", userInfo)
        setCurrentUser(userInfo)
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('jwtToken')
        localStorage.removeItem('user')
        throw new Error("Session expired. Please log in again.")
      } else {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load user information"
      setErrors(prev => ({ ...prev, submit: errorMessage }))
      
      // Set fallback user data
      const fallbackUser: User = {
        id: 1,
        firstName: "Current",
        lastName: "User"
      }
      setCurrentUser(fallbackUser)
    } finally {
      setUserLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true)
      const token = getToken()
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_URL}/api/employee/teams/all`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch teams: ${response.status} - ${errorText}`)
      }

      const teamsData = await response.json()
      console.log("Teams data fetched successfully:", teamsData)
      
      // Transform the API response to match Team interface
      const transformedTeams: Team[] = teamsData.map((team: any) => ({
        id: team.id?.toString() || Math.random().toString(),
        name: team.name || "Unnamed Team",
        specialization: team.specialization || "General"
      }))

      setTeams(transformedTeams)

      // If teamId was provided, set it as the default value
      if (teamId && transformedTeams.some(team => team.id === teamId)) {
        form.setValue("teamId", teamId)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load teams"
      setErrors(prev => ({ ...prev, submit: errorMessage }))
      setTeams([])
    } finally {
      setTeamsLoading(false)
    }
  }

  const onSubmit = async (data: TeamMemberFormData) => {
    try {
      setLoading(true)
      setErrors({})

      // Calculate age from birth date
      const birthDateObj = new Date(data.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birthDateObj.getFullYear()
      const monthDiff = today.getMonth() - birthDateObj.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--
      }

      const token = getToken()
      if (!token) {
        throw new Error("Authentication token missing")
      }

      // Prepare data for backend - convert to uppercase for enums and format dates
      const requestData = {
        fullName: data.fullName.trim(),
        nic: data.nic,
        contactNo: data.contactNo,
        birthDate: data.birthDate,
        address: data.address.trim(),
        city: data.city.toUpperCase().replace(/ /g, "_"),
        specialization: data.specialization.toUpperCase(),
        joinedDate: data.joinedDate,
        workingHoursPerDay: data.workingHoursPerDay,
        teamId: data.teamId,
        supervisorId: currentUser?.id,
        age: age
      }

      console.log("Submitting team member data:", requestData)

      const response = await fetch(`${API_URL}/api/employee/member-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        let errorMessage = "Failed to add team member"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Team member created successfully:", result)

      // Show success message
      setErrors({})
      onSuccess()
      onClose()
      
    } catch (error) {
      console.error("Error submitting form:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred while adding team member"
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const retryDataFetch = () => {
    setUserLoading(true)
    setTeamsLoading(true)
    setErrors({})
    const fetchData = async () => {
      try {
        await Promise.all([fetchCurrentUser(), fetchTeams()])
      } catch (error) {
        console.error("Error retrying data fetch:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load required data"
        setErrors({ submit: errorMessage })
      }
    }
    fetchData()
  }

  if (userLoading || teamsLoading) {
    return (
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div className={styles.modalContent}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add Team Member</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.teamForm}>
          <div className={styles.formGrid}>
            {/* Supervisor Info Display */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>
                Supervisor
              </label>
              <div className={styles.userDisplay}>
                <input
                  type="text"
                  value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "Not available"}
                  className={styles.formInput}
                  disabled
                  readOnly
                />
                {currentUser && (
                  <div className={styles.userDetails}>
                    <div className={styles.helperText}>
                      Employee ID: {currentUser.id} {currentUser.position && `• ${currentUser.position}`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team Selection */}
            <div className={styles.formGroup}>
              <label htmlFor="teamId" className={styles.formLabel}>
                Team *
              </label>
              {teams.length === 0 ? (
                <div className={styles.errorText}>No teams available. Please create a team first.</div>
              ) : (
                <select
                  id="teamId"
                  className={`${styles.formSelect} ${form.formState.errors.teamId ? styles.inputError : ""}`}
                  disabled={loading}
                  {...form.register("teamId")}
                >
                  <option value="">Select Team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.specialization})
                    </option>
                  ))}
                </select>
              )}
              {form.formState.errors.teamId && (
                <span className={styles.errorText}>{form.formState.errors.teamId.message}</span>
              )}
            </div>

            {/* Full Name */}
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.formLabel}>
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="John Doe"
                className={`${styles.formInput} ${form.formState.errors.fullName ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <span className={styles.errorText}>{form.formState.errors.fullName.message}</span>
              )}
            </div>

            {/* NIC */}
            <div className={styles.formGroup}>
              <label htmlFor="nic" className={styles.formLabel}>
                NIC *
              </label>
              <input
                type="text"
                id="nic"
                placeholder="123456789012"
                className={`${styles.formInput} ${form.formState.errors.nic ? styles.inputError : ""}`}
                disabled={loading}
                maxLength={12}
                {...form.register("nic")}
              />
              {form.formState.errors.nic && (
                <span className={styles.errorText}>{form.formState.errors.nic.message}</span>
              )}
            </div>

            {/* Contact Number */}
            <div className={styles.formGroup}>
              <label htmlFor="contactNo" className={styles.formLabel}>
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNo"
                placeholder="0712345678"
                className={`${styles.formInput} ${form.formState.errors.contactNo ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("contactNo")}
              />
              {form.formState.errors.contactNo && (
                <span className={styles.errorText}>{form.formState.errors.contactNo.message}</span>
              )}
            </div>

            {/* Birth Date */}
            <div className={styles.formGroup}>
              <label htmlFor="birthDate" className={styles.formLabel}>
                Birth Date *
              </label>
              <input
                type="date"
                id="birthDate"
                className={`${styles.formInput} ${form.formState.errors.birthDate ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("birthDate")}
              />
              {form.formState.errors.birthDate && (
                <span className={styles.errorText}>{form.formState.errors.birthDate.message}</span>
              )}
            </div>

            {/* Address */}
            <div className={styles.formGroup}>
              <label htmlFor="address" className={styles.formLabel}>
                Address *
              </label>
              <input
                type="text"
                id="address"
                placeholder="Street address"
                className={`${styles.formInput} ${form.formState.errors.address ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <span className={styles.errorText}>{form.formState.errors.address.message}</span>
              )}
            </div>

            {/* City/District */}
            <div className={styles.formGroup}>
              <label htmlFor="city" className={styles.formLabel}>
                City/District *
              </label>
              <select
                id="city"
                className={`${styles.formSelect} ${form.formState.errors.city ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("city")}
              >
                <option value="">Select City/District</option>
                {sriLankanDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {form.formState.errors.city && (
                <span className={styles.errorText}>{form.formState.errors.city.message}</span>
              )}
            </div>

            {/* Specialization */}
            <div className={styles.formGroup}>
              <label htmlFor="specialization" className={styles.formLabel}>
                Specialization *
              </label>
              <select
                id="specialization"
                className={`${styles.formSelect} ${form.formState.errors.specialization ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("specialization")}
              >
                <option value="">Select Specialization</option>
                {specializationEnum.map((specialization) => (
                  <option key={specialization} value={specialization}>
                    {specialization} Specialist
                  </option>
                ))}
              </select>
              {form.formState.errors.specialization && (
                <span className={styles.errorText}>{form.formState.errors.specialization.message}</span>
              )}
            </div>

            {/* Joined Date */}
            <div className={styles.formGroup}>
              <label htmlFor="joinedDate" className={styles.formLabel}>
                Joined Date *
              </label>
              <input
                type="date"
                id="joinedDate"
                className={`${styles.formInput} ${form.formState.errors.joinedDate ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("joinedDate")}
              />
              {form.formState.errors.joinedDate && (
                <span className={styles.errorText}>{form.formState.errors.joinedDate.message}</span>
              )}
            </div>

            {/* Working Hours */}
            <div className={styles.formGroup}>
              <label htmlFor="workingHoursPerDay" className={styles.formLabel}>
                Working Hours Per Day *
              </label>
              <select
                id="workingHoursPerDay"
                className={`${styles.formSelect} ${form.formState.errors.workingHoursPerDay ? styles.inputError : ""}`}
                disabled={loading}
                {...form.register("workingHoursPerDay")}
              >
                <option value="">Select Working Hours</option>
                {workingHoursEnum.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} Hours
                  </option>
                ))}
              </select>
              {form.formState.errors.workingHoursPerDay && (
                <span className={styles.errorText}>{form.formState.errors.workingHoursPerDay.message}</span>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
              {errors.submit.includes("session") || errors.submit.includes("token") ? (
                <button 
                  onClick={() => window.location.href = '/signin'}
                  className={styles.loginRedirectButton}
                >
                  Go to Login
                </button>
              ) : (
                <button 
                  onClick={retryDataFetch}
                  className={styles.retryButton}
                >
                  Retry Loading Data
                </button>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading || !currentUser || teams.length === 0}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Adding Member...
                </>
              ) : (
                "Add Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}