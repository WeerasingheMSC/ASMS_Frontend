"use client"

import { useState, useEffect } from "react"
import { Card } from "../../components/ui/card"
import { Button } from "../../components/ui/button"

interface ServiceStepProps {
  data: any
  onNext: (data: any) => void
  onBack: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function ServiceStep({ data, onNext, onBack }: ServiceStepProps) {
  const [formData, setFormData] = useState(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const url = 'http://localhost:8080/api/customer/services'

      console.log('Fetching services from:', url)

      const response = await fetch(url)

      if (response.ok) {
        const servicesData = await response.json()
        console.log('Fetched services:', servicesData)

        // Filter only active services AND services available today (with remaining slots)
        const activeServices = servicesData.filter(
          (service: any) => service.isActive && service.availableToday && service.remainingSlots > 0
        )
        console.log('Active and available services:', activeServices)
        console.log('Filtered out services (no slots):', servicesData.filter(
          (service: any) => !service.availableToday || service.remainingSlots <= 0
        ))

        setServices(activeServices)

        // Extract unique categories
        const uniqueCategories = [...new Set(activeServices.map((service: any) => service.category))] as string[]
        console.log('Unique categories:', uniqueCategories)
        setCategories(uniqueCategories)

        // Group services by category
        const grouped = activeServices.reduce((acc: any, service: any) => {
          if (!acc[service.category]) {
            acc[service.category] = []
          }
          acc[service.category].push(service)
          return acc
        }, {})
        console.log('Grouped services:', grouped)
        setServicesByCategory(grouped)
      } else {
        console.error('Failed to fetch services:', response.status, response.statusText)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching services:', error)
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.category) newErrors.category = "Service category is required"
    if (!formData.type) newErrors.type = "Service type is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext({ service: formData })
    }
  }

  const serviceTypes = servicesByCategory[formData.category] || []

  if (loading) {
    return (
      <Card className="p-8 bg-white">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading services...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 bg-white">
      <h2 className="text-2xl font-bold text-black mb-6">Service Information</h2>

      <div className="space-y-5">
        {/* Service Category */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Service Category</label>
          {categories.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                No service categories available. Please contact the administrator to add services.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFormData({ ...formData, category, type: "" })}
                  className={`p-4 rounded-lg border-2 text-left font-medium transition-colors ${
                    formData.category === category
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-gray-300 bg-white text-black hover:border-blue-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
          {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
        </div>

        {/* Service Type */}
        {formData.category && (
          <div>
            <label className="block text-sm font-medium text-black mb-2">Service Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select service type</option>
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.serviceName}>
                  {service.serviceName} 
                  {service.remainingSlots !== undefined && 
                    ` (${service.remainingSlots} slot${service.remainingSlots !== 1 ? 's' : ''} left today)`
                  }
                </option>
              ))}
            </select>
            {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
          </div>
        )}

        {/* Additional Requirements */}
        <div>
          <label className="block text-sm font-medium text-black mb-2">Additional Requirements</label>
          <textarea
            value={formData.requirements}
            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
            placeholder="e.g., Replace air filter, check battery..."
            className="w-full p-3 border border-gray-300 rounded-lg text-black bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            rows={4}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 mt-8">
        <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent text-black border border-gray-300">
          Back
        </Button>
        <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          Next
        </Button>
      </div>
    </Card>
  )
}
