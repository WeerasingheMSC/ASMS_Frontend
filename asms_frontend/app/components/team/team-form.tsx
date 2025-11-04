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
  // Fixed: Use union type with empty string and proper validation
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

// Toast hook replacement
const useToast = () => {
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    if (variant === "destructive") {
      console.error(`${title}${description ? `: ${description}` : ""}`)
    } else {
      console.log(`${title}${description ? `: ${description}` : ""}`)
    }
  }
  return { toast }
}

export default function TeamForm({ teamId, onClose, onSuccess }: TeamFormProps) {
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [teamsLoading, setTeamsLoading] = useState(true)
  const [userLoading, setUserLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

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
        setErrors({ 
          submit: "Failed to load required data. Please try again." 
        })
      }
    }

    fetchData()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      setUserLoading(true)
      const token = getToken()
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${API_URL}/api/employee/current`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status}`)
      }

      const userData = await response.json()
      const userInfo: User = {
        id: userData.id,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        username: userData.username,
        position: userData.position
      }
      
      setCurrentUser(userInfo)
    } catch (error) {
      console.error("Error fetching user:", error)
      // Set fallback user for form submission
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
        throw new Error(`Failed to fetch teams: ${response.status}`)
      }

      const teamsData = await response.json()
      
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

      const requestData = {
        ...data,
        supervisorId: currentUser?.id, // Auto-fill supervisor ID from current user
        age,
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
        const error = await response.json()
        throw new Error(error.message || "Failed to add team member")
      }

      toast({
        title: "Success",
        description: "Team member added successfully",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      setErrors({ 
        submit: error instanceof Error ? error.message : "An error occurred" 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  const retryDataFetch = () => {
    setErrors({})
    const fetchData = async () => {
      try {
        await Promise.all([fetchCurrentUser(), fetchTeams()])
      } catch (error) {
        console.error("Error retrying data fetch:", error)
        setErrors({ 
          submit: "Failed to load required data. Please try again." 
        })
      }
    }
    fetchData()
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Add Team Member</h3>
          <button className={styles.closeBtn} onClick={handleClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {/* Supervisor Info Display */}
          <div className={styles.supervisorInfo}>
            <div className={styles.infoCard}>
              <h4>Supervisor Information</h4>
              {userLoading ? (
                <div className={styles.loadingText}>Loading supervisor info...</div>
              ) : currentUser ? (
                <div className={styles.userDetails}>
                  <div className={styles.userName}>
                    {currentUser.firstName} {currentUser.lastName}
                  </div>
                  <div className={styles.userId}>
                    Employee ID: {currentUser.id}
                    {currentUser.position && ` • ${currentUser.position}`}
                  </div>
                </div>
              ) : (
                <div className={styles.errorText}>Unable to load supervisor information</div>
              )}
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            {/* Team Selection Dropdown */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Team *</label>
              {teamsLoading ? (
                <div className={styles.loadingText}>Loading teams...</div>
              ) : teams.length === 0 ? (
                <div className={styles.errorText}>No teams available. Please create a team first.</div>
              ) : (
                <select
                  className={styles.formInput}
                  disabled={loading || teamsLoading}
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
                <p className={styles.formError}>{form.formState.errors.teamId.message}</p>
              )}
            </div>

            {/* Full Name */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Name *</label>
              <input
                type="text"
                placeholder="John Doe"
                className={styles.formInput}
                disabled={loading}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className={styles.formError}>{form.formState.errors.fullName.message}</p>
              )}
            </div>

            {/* NIC */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>NIC *</label>
              <input
                type="text"
                placeholder="123456789012"
                className={styles.formInput}
                disabled={loading}
                maxLength={12}
                {...form.register("nic")}
              />
              {form.formState.errors.nic && (
                <p className={styles.formError}>{form.formState.errors.nic.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Contact Number *</label>
              <input
                type="tel"
                placeholder="0712345678"
                className={styles.formInput}
                disabled={loading}
                {...form.register("contactNo")}
              />
              {form.formState.errors.contactNo && (
                <p className={styles.formError}>{form.formState.errors.contactNo.message}</p>
              )}
            </div>

            {/* Birth Date */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Birth Date *</label>
              <input
                type="date"
                className={styles.formInput}
                disabled={loading}
                {...form.register("birthDate")}
              />
              {form.formState.errors.birthDate && (
                <p className={styles.formError}>{form.formState.errors.birthDate.message}</p>
              )}
            </div>

            {/* Address */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address *</label>
              <input
                type="text"
                placeholder="Street address"
                className={styles.formInput}
                disabled={loading}
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <p className={styles.formError}>{form.formState.errors.address.message}</p>
              )}
            </div>

            {/* City/District Dropdown */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>City/District *</label>
              <select
                className={styles.formInput}
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
                <p className={styles.formError}>{form.formState.errors.city.message}</p>
              )}
            </div>

            {/* Specialization */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Specialization *</label>
              <select
                className={styles.formInput}
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
                <p className={styles.formError}>{form.formState.errors.specialization.message}</p>
              )}
            </div>

            {/* Joined Date */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Joined Date *</label>
              <input
                type="date"
                className={styles.formInput}
                disabled={loading}
                {...form.register("joinedDate")}
              />
              {form.formState.errors.joinedDate && (
                <p className={styles.formError}>{form.formState.errors.joinedDate.message}</p>
              )}
            </div>

            {/* Working Hours Per Day */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Working Hours Per Day *</label>
              <select
                className={styles.formInput}
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
                <p className={styles.formError}>{form.formState.errors.workingHoursPerDay.message}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className={styles.submitError}>
                <div className={styles.errorText}>{errors.submit}</div>
                <button 
                  type="button"
                  onClick={retryDataFetch}
                  className={styles.retryButton}
                >
                  Retry Loading Data
                </button>
              </div>
            )}

            {/* Form Actions */}
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading || teamsLoading || userLoading || teams.length === 0}
              >
                {loading ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}