"use client"

import { useState, useEffect } from "react"
import styles from "../../styles/team.module.css"

interface Team {
  id: string
  name: string
  specialization: string
  memberCount: number
  totalWorkingHours: number
  averageAge: number
  description: string
  supervisorId: number
}

interface Supervisor {
  id: number
  name: string
}

interface TeamRequestDTO {
  name: string
  specialization: string
  memberCount: number
  totalWorkingHours: number
  averageAge: number
  description: string
  supervisorId: number
}

interface NewTeamFormProps {
  onClose: () => void
  onSuccess: (newTeam: Team) => void
}

export default function FullTeamForm({ onClose, onSuccess }: NewTeamFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    memberCount: 0,
    totalWorkingHours: 0,
    averageAge: 0,
    description: "",
    supervisorId: 0
  })
  const [loading, setLoading] = useState(false)
  const [supervisor, setSupervisor] = useState<Supervisor | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const specializations = [
    "ENGINE",
    "TRANSMISSION",
    "ELECTRICAL",
    "BRAKES",
    "SUSPENSION",
    "DIAGNOSTICS",
    "BODYWORK",
    "PAINTING",
    "INTERIOR",
    "QUALITY_CONTROL",
    "OTHER"
  ]

  // Fetch current supervisor info
  useEffect(() => {
    const fetchCurrentSupervisor = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/employee/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Failed to fetch supervisor profile")
        }

        const userData = await response.json()
        const supervisorInfo: Supervisor = {
          id: userData.id,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.username || "Current User"
        }
        
        setSupervisor(supervisorInfo)
        setFormData(prev => ({ ...prev, supervisorId: supervisorInfo.id }))
      } catch (error) {
        console.error("Error fetching supervisor:", error)
        setErrors({ submit: "Failed to load supervisor information." })
      } finally {
        setUserLoading(false)
      }
    }

    fetchCurrentSupervisor()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Team name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Team name must be at least 2 characters long"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Team name cannot exceed 100 characters"
    }

    if (!formData.specialization) {
      newErrors.specialization = "Specialization is required"
    }

    if (formData.memberCount < 0) {
      newErrors.memberCount = "Member count cannot be negative"
    } else if (formData.memberCount > 50) {
      newErrors.memberCount = "Member count cannot exceed 50"
    }

    if (formData.totalWorkingHours < 0) {
      newErrors.totalWorkingHours = "Working hours cannot be negative"
    } else if (formData.totalWorkingHours > 80) {
      newErrors.totalWorkingHours = "Working hours cannot exceed 80 hours per day"
    }

    if (formData.averageAge < 18 || formData.averageAge > 65) {
      newErrors.averageAge = "Average age must be between 18 and 65"
    }

    if (formData.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const teamRequestDTO: TeamRequestDTO = {
        name: formData.name.trim(),
        specialization: formData.specialization,
        memberCount: formData.memberCount,
        totalWorkingHours: formData.totalWorkingHours,
        averageAge: formData.averageAge,
        description: formData.description.trim(),
        supervisorId: formData.supervisorId
      }

      const response = await fetch("http://localhost:8080/api/employee/teams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamRequestDTO),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`)
      }

      const createdTeam: Team = await response.json()
      onSuccess(createdTeam)
      
    } catch (error) {
      console.error("Error creating team:", error)
      setErrors({ 
        submit: error instanceof Error 
          ? error.message 
          : "Failed to create team. Please try again." 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("Count") || name.includes("Hours") || name.includes("Age") || name.includes("Id")
        ? Number(value) 
        : value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (userLoading) {
    return (
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div className={styles.modalContent}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading supervisor information...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Create New Team</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.teamForm}>
          <div className={styles.formGrid}>
            {/* Team Name */}
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>
                Team Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${styles.formInput} ${errors.name ? styles.inputError : ""}`}
                placeholder="Enter team name"
                disabled={loading}
                maxLength={100}
              />
              {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            </div>

            {/* Specialization */}
            <div className={styles.formGroup}>
              <label htmlFor="specialization" className={styles.formLabel}>
                Specialization *
              </label>
              <select
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className={`${styles.formSelect} ${errors.specialization ? styles.inputError : ""}`}
                disabled={loading}
              >
                <option value="">Select specialization</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec.replace("_", " ")}
                  </option>
                ))}
              </select>
              {errors.specialization && (
                <span className={styles.errorText}>{errors.specialization}</span>
              )}
            </div>

            {/* Supervisor Display (Read-only) */}
            <div className={styles.formGroup}>
              <label htmlFor="supervisor" className={styles.formLabel}>
                Supervisor
              </label>
              <input
                type="text"
                id="supervisor"
                name="supervisor"
                value={supervisor ? supervisor.name : "Loading..."}
                className={styles.formInput}
                disabled
                readOnly
              />
              <div className={styles.helperText}>
                You are automatically assigned as the supervisor
              </div>
            </div>

            {/* Member Count */}
            <div className={styles.formGroup}>
              <label htmlFor="memberCount" className={styles.formLabel}>
                Member Count
              </label>
              <input
                type="number"
                id="memberCount"
                name="memberCount"
                value={formData.memberCount}
                onChange={handleChange}
                min="0"
                max="50"
                className={`${styles.formInput} ${errors.memberCount ? styles.inputError : ""}`}
                disabled={loading}
              />
              {errors.memberCount && (
                <span className={styles.errorText}>{errors.memberCount}</span>
              )}
            </div>

            {/* Total Working Hours */}
            <div className={styles.formGroup}>
              <label htmlFor="totalWorkingHours" className={styles.formLabel}>
                Total Working Hours/Day
              </label>
              <input
                type="number"
                id="totalWorkingHours"
                name="totalWorkingHours"
                value={formData.totalWorkingHours}
                onChange={handleChange}
                min="0"
                max="80"
                step="0.5"
                className={`${styles.formInput} ${errors.totalWorkingHours ? styles.inputError : ""}`}
                disabled={loading}
              />
              {errors.totalWorkingHours && (
                <span className={styles.errorText}>{errors.totalWorkingHours}</span>
              )}
            </div>

            {/* Average Age */}
            <div className={styles.formGroup}>
              <label htmlFor="averageAge" className={styles.formLabel}>
                Average Age
              </label>
              <input
                type="number"
                id="averageAge"
                name="averageAge"
                value={formData.averageAge}
                onChange={handleChange}
                min="18"
                max="65"
                className={`${styles.formInput} ${errors.averageAge ? styles.inputError : ""}`}
                disabled={loading}
              />
              {errors.averageAge && (
                <span className={styles.errorText}>{errors.averageAge}</span>
              )}
            </div>

            {/* Description */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="description" className={styles.formLabel}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`${styles.formInput} ${errors.description ? styles.inputError : ""}`}
                placeholder="Enter team description (optional)"
                disabled={loading}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {formData.description.length}/500 characters
              </div>
              {errors.description && (
                <span className={styles.errorText}>{errors.description}</span>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={styles.submitError}>
              {errors.submit}
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
              disabled={loading || !supervisor}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Creating Team...
                </>
              ) : (
                "Create Team"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}