"use client"

import { useState } from "react"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

interface VehicleStepProps {
  data: any
  onNext: (data: any) => void
}

const VEHICLE_TYPES = ["Sedan", "SUV", "Hatchback", "Wagon", "Coupe", "Truck", "Van"]
const VEHICLE_BRANDS = ["Toyota", "Honda", "Maruti", "Hyundai", "Ford", "BMW", "Mercedes", "Audi"]
const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"]

export default function VehicleStep({ data, onNext }: VehicleStepProps) {
  const [formData, setFormData] = useState(data)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.type) newErrors.type = "Vehicle type is required"
    if (!formData.brand) newErrors.brand = "Vehicle brand is required"
    if (!formData.model) newErrors.model = "Vehicle model is required"
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear()) {
      newErrors.year = "Valid year is required"
    }
    if (!formData.registrationNumber) newErrors.registrationNumber = "Registration number is required"
    if (!formData.fuelType) newErrors.fuelType = "Fuel type is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext({ vehicle: formData })
    }
  }

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold text-black mb-6">Vehicle Information</h2>

      <div className="space-y-5">
        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Vehicle Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select vehicle type</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
        </div>

        {/* Vehicle Brand */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Vehicle Brand</label>
          <select
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select vehicle brand</option>
            {VEHICLE_BRANDS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
          {errors.brand && <p className="text-red-600 text-sm mt-1">{errors.brand}</p>}
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Model</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="e.g., Camry, CR-V"
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.model && <p className="text-red-600 text-sm mt-1">{errors.model}</p>}
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Year of Manufacture</label>
          <input
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="e.g., 2022"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {errors.year && <p className="text-red-600 text-sm mt-1">{errors.year}</p>}
        </div>

        {/* Registration Number */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Registration Number</label>
          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
            placeholder="e.g., ABC-1234"
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
          />
          {errors.registrationNumber && <p className="text-red-600 text-sm mt-1">{errors.registrationNumber}</p>}
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Fuel Type</label>
          <select
            value={formData.fuelType}
            onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Select fuel type</option>
            {FUEL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.fuelType && <p className="text-red-600 text-sm mt-1">{errors.fuelType}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <Button variant="outline" className="flex-1 bg-transparent text-black border border-gray-300" onClick={() => {}}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          Next
        </Button>
      </div>
    </Card>
  )
}
