"use client"

import { useState } from "react"
import { X, CheckCircle2, Car, Wrench, Calendar, FileCheck } from "lucide-react"
import VehicleStep from "./booking-steps/vehicle-step"
import ServiceStep from "./booking-steps/service-step"
import DateTimeStep from "./booking-steps/date-time-step"
import ConfirmationStep from "./booking-steps/confirmation-step"
import { createAppointment } from "../../lib/appointmentsApi"

interface BookingWizardProps {
  onClose: () => void
}

interface FormData {
  vehicle: {
    type: string
    brand: string
    model: string
    year: string
    registrationNumber: string
    fuelType: string
  }
  service: {
    category: string
    type: string
    requirements: string
  }
  datetime: {
    date: string
    time: string
  }
}

const STEPS = [
  { number: 1, label: "Vehicle Info", icon: Car, color: "blue" },
  { number: 2, label: "Service", icon: Wrench, color: "purple" },
  { number: 3, label: "Date & Time", icon: Calendar, color: "orange" },
  { number: 4, label: "Confirmation", icon: FileCheck, color: "green" },
]

export default function BookingWizard({ onClose }: BookingWizardProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    vehicle: {
      type: "",
      brand: "",
      model: "",
      year: "",
      registrationNumber: "",
      fuelType: "",
    },
    service: {
      category: "",
      type: "",
      requirements: "",
    },
    datetime: {
      date: "",
      time: "",
    },
  })

  const handleNext = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }))
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const appointmentData = {
        vehicle: formData.vehicle,
        service: formData.service,
        datetime: formData.datetime,
      }

      const result = await createAppointment(appointmentData)
      console.log("Booking confirmed:", result)
      alert("Appointment booked successfully!")
      onClose()
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to book appointment. Please try again."
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStepColor = (stepNum: number) => {
    if (stepNum < step) return "completed"
    if (stepNum === step) return "active"
    return "upcoming"
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Book New Appointment</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete the steps below to schedule your service
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="relative">
          {/* Progress Bar Background */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full" />
          
          {/* Active Progress Bar */}
          <div 
            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-gray-600 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />

          {/* Steps */}
          <div className="relative flex items-center justify-between">
            {STEPS.map((s, index) => {
              const status = getStepColor(s.number)
              const Icon = s.icon
              
              return (
                <div key={s.number} className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div
                    className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center transition-all duration-300 shadow-sm z-10 ${
                      status === "completed"
                        ? "bg-green-500 text-white scale-105"
                        : status === "active"
                          ? "bg-gray-600 text-white scale-110 shadow-lg ring-4 ring-primary/20"
                          : "bg-white text-gray-00 border-2 border-gray-200"
                    }`}
                  >
                    {status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span
                    className={`mt-2 text-xs font-medium transition-colors ${
                      status === "active"
                        ? "text-black"
                        : status === "completed"
                          ? "text-green-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step Content with Animation */}
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {step === 1 && <VehicleStep data={formData.vehicle} onNext={handleNext} />}
            {step === 2 && <ServiceStep data={formData.service} onNext={handleNext} onBack={handleBack} />}
            {step === 3 && <DateTimeStep data={formData.datetime} onNext={handleNext} onBack={handleBack} />}
            {step === 4 && (
              <ConfirmationStep 
                data={formData} 
                onConfirm={handleConfirm} 
                onBack={handleBack} 
                onCancel={onClose}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer with Step Info */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-6 py-4 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Step</span>
              <span className="font-bold text-primary text-lg">{step}</span>
              <span className="text-muted-foreground">of</span>
              <span className="font-bold text-foreground text-lg">4</span>
            </div>
            <div className="text-muted-foreground">
              {step === 1 && "Enter your vehicle details"}
              {step === 2 && "Choose service type"}
              {step === 3 && "Select date and time"}
              {step === 4 && "Review and confirm"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}