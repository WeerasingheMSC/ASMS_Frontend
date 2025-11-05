"use client"

import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Check } from "lucide-react"

interface ConfirmationStepProps {
  data: any
  onConfirm: () => void
  onBack: () => void
  onCancel: () => void
}

export default function ConfirmationStep({ data, onConfirm, onBack, onCancel }: ConfirmationStepProps) {
  const appointmentDate = new Date(data.datetime.date)
  const dateStr = appointmentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold text-black mb-6">Review Your Booking</h2>

      <div className="space-y-6">
        {/* Vehicle Details */}
        <div className="border-l-4 border-blue-600 pl-4">
          <h3 className="font-semibold text-black mb-3 text-lg">Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-black">{data.vehicle.type}</p>
            </div>
            <div>
              <p className="text-gray-500">Brand</p>
              <p className="font-medium text-black">{data.vehicle.brand}</p>
            </div>
            <div>
              <p className="text-gray-500">Model</p>
              <p className="font-medium text-black">{data.vehicle.model}</p>
            </div>
            <div>
              <p className="text-gray-500">Year</p>
              <p className="font-medium text-black">{data.vehicle.year}</p>
            </div>
            <div>
              <p className="text-gray-500">Registration Number</p>
              <p className="font-medium text-black">{data.vehicle.registrationNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Fuel Type</p>
              <p className="font-medium text-black">{data.vehicle.fuelType}</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="border-l-4 border-green-600 pl-4">
          <h3 className="font-semibold text-black mb-3 text-lg">Service Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium text-black">{data.service.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Type</p>
              <p className="font-medium text-black">{data.service.type}</p>
            </div>
          </div>
          {data.service.requirements && (
            <div className="mt-3">
              <p className="text-gray-500 text-xs">Additional Requirements</p>
              <p className="font-medium text-black text-sm">{data.service.requirements}</p>
            </div>
          )}
        </div>

        {/* Appointment Details */}
        <div className="border-l-4 border-purple-600 pl-4">
          <h3 className="font-semibold text-black mb-3 text-lg">Appointment</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium text-black">{dateStr}</p>
            </div>
            <div>
              <p className="text-gray-500">Time</p>
              <p className="font-medium text-black">{data.datetime.time}</p>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Ready to confirm?</p>
            <p className="text-sm text-green-800">
              Your appointment will be booked and a confirmation will be sent to your email.
            </p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <Button onClick={onCancel} variant="outline" className="flex-1 bg-transparent text-black border border-gray-300">
          Cancel
        </Button>
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent text-black border border-gray-300">
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
          Confirm Booking
        </Button>
      </div>
    </Card>
  )
}
