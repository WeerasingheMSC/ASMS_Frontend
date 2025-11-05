"use client"

import { useState } from "react"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateTimeStepProps {
  data: any
  onNext: (data: any) => void
  onBack: () => void
}

const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
]

// Mock booked slots
const BOOKED_SLOTS = ["09:00 AM", "02:30 PM", "03:00 PM"]

export default function DateTimeStep({ data, onNext, onBack }: DateTimeStepProps) {
  const [formData, setFormData] = useState(data)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = "Date is required"
    if (!formData.time) newErrors.time = "Time is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext({ datetime: formData })
    }
  }

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date.getTime() === today.getTime()
  }

  const isSelected = (day: number) => {
    if (!formData.date) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const selectedDate = new Date(formData.date)
    return date.getTime() === selectedDate.getTime()
  }

  const handleDateSelect = (day: number) => {
    if (!isDateDisabled(day)) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      setFormData({ ...formData, date: date.toISOString().split("T")[0] })
    }
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold text-black mb-6">Select Date & Time</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <h3 className="font-semibold text-black mb-4 text-center">{monthName}</h3>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-200 rounded transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-200 rounded transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {days.map((day) => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                disabled={isDateDisabled(day)}
                className={`aspect-square rounded-lg font-medium text-sm transition-colors ${
                  isDateDisabled(day)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isSelected(day)
                      ? "bg-blue-600 text-white"
                      : isToday(day)
                        ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                        : "bg-gray-50 text-black hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.date && <p className="text-red-600 text-sm mt-2">{errors.date}</p>}
        </div>

        {/* Time Slots */}
        <div>
          <h3 className="font-semibold text-black mb-4">Available Time Slots</h3>
          <div className="grid grid-cols-2 gap-3">
            {TIME_SLOTS.map((slot) => {
              const isBooked = BOOKED_SLOTS.includes(slot)
              return (
                <button
                  key={slot}
                  onClick={() => !isBooked && setFormData({ ...formData, time: slot })}
                  disabled={isBooked}
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    isBooked
                      ? "bg-red-100 text-red-700 cursor-not-allowed opacity-50"
                      : formData.time === slot
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>
          {errors.time && <p className="text-red-600 text-sm mt-2">{errors.time}</p>}

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 rounded" />
              <span className="text-gray-600">Booked (unavailable)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded border border-gray-300" />
              <span className="text-gray-600">Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent text-black border border-gray-300">
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          Review Booking
        </Button>
      </div>
    </Card>
  )
}
