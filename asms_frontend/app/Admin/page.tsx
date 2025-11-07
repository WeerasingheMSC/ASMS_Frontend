'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { 
  CalendarToday, 
  PeopleAlt, 
  Build, 
  PersonAdd,
  TrendingUp,
  AttachMoney,
  CheckCircle,
  Pending,
  Cancel,
  Circle
} from '@mui/icons-material'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface DashboardStats {
  totalAppointments: number
  monthlyAppointments: number
  totalCustomers: number
  monthlyNewCustomers: number
  totalServices: number
  activeServices: number
  totalEmployees: number
  activeEmployees: number
  pendingAppointments: number
  approvedAppointments: number
  completedAppointments: number
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    monthlyAppointments: 0,
    totalCustomers: 0,
    monthlyNewCustomers: 0,
    totalServices: 0,
    activeServices: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    completedAppointments: 0
  })

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    const months = Math.floor(days / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }

  const fetchDashboardData = async () => {
    try {
      const userData = localStorage.getItem('user')
      if (!userData) {
        window.location.href = '/signin'
        return
      }

      const user = JSON.parse(userData)

      // Fetch appointments data
      const appointmentsResponse = await fetch(`${API_URL}/api/admin/appointments`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      // Fetch services data
      const servicesResponse = await fetch(`${API_URL}/api/admin/services`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      // Fetch employees data
      const employeesResponse = await fetch(`${API_URL}/api/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      // Fetch customers data
      const customersResponse = await fetch(`${API_URL}/api/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })

      let appointmentsData = []
      let servicesData = []
      let employeesData = []
      let customersData = []

      if (appointmentsResponse.ok) {
        appointmentsData = await appointmentsResponse.json()
      }

      if (servicesResponse.ok) {
        servicesData = await servicesResponse.json()
      }

      if (employeesResponse.ok) {
        employeesData = await employeesResponse.json()
      }

      if (customersResponse.ok) {
        customersData = await customersResponse.json()
      }

      // Calculate stats
      const activeServices = servicesData.filter((s: any) => s.isActive).length
      const activeEmployees = employeesData.filter((e: any) => e.isActive).length

      // Get current month for filtering
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()

      const monthlyNewCustomers = customersData.filter((c: any) => {
        const createdDate = new Date(c.createdAt)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      // Calculate appointment statistics from real data
      const monthlyAppointments = appointmentsData.filter((a: any) => {
        const createdDate = new Date(a.createdAt || a.appointmentDate)
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
      }).length

      const pendingAppointments = appointmentsData.filter((a: any) => 
        a.status === 'PENDING' || a.status === 'Pending'
      ).length

      const approvedAppointments = appointmentsData.filter((a: any) => 
        a.status === 'APPROVED' || a.status === 'Approved' || a.status === 'CONFIRMED' || a.status === 'Confirmed' || a.status === 'IN_SERVICE' || a.status === 'In Service'
      ).length

      const completedAppointments = appointmentsData.filter((a: any) => 
        a.status === 'COMPLETED' || a.status === 'Completed' || a.status === 'READY' || a.status === 'Ready'
      ).length

      // Generate recent activities from real data
      const activities: any[] = []

      // Add recent appointments with timestamps
      const sortedAppointments = [...appointmentsData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.appointmentDate).getTime()
        const dateB = new Date(b.createdAt || b.appointmentDate).getTime()
        return dateB - dateA
      }).slice(0, 3)

      sortedAppointments.forEach((appointment: any) => {
        const timestamp = new Date(appointment.createdAt || appointment.appointmentDate).getTime()
        const timeAgo = getTimeAgo(appointment.createdAt || appointment.appointmentDate)
        const customerName = appointment.customerName || appointment.customer?.username || 'Customer'
        const status = appointment.status?.toLowerCase() || 'pending'
        
        let message = ''
        let activityStatus = ''
        
        if (status === 'pending') {
          message = `New appointment booking from ${customerName}`
          activityStatus = 'pending'
        } else if (status === 'approved' || status === 'confirmed') {
          message = `Appointment approved for ${customerName}`
          activityStatus = 'approved'
        } else if (status === 'completed' || status === 'ready') {
          message = `Service completed for ${customerName} - ${appointment.serviceCategory || 'Service'}`
          activityStatus = 'completed'
        } else if (status === 'in_service' || status === 'in service') {
          message = `Service in progress for ${customerName}`
          activityStatus = 'info'
        }
        
        activities.push({
          id: `apt-${appointment.id}`,
          type: 'appointment',
          message,
          time: timeAgo,
          status: activityStatus,
          timestamp
        })
      })

      // Add recent customers with timestamps
      const sortedCustomers = [...customersData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      }).slice(0, 2)

      sortedCustomers.forEach((customer: any) => {
        const timestamp = new Date(customer.createdAt).getTime()
        const timeAgo = getTimeAgo(customer.createdAt)
        activities.push({
          id: `cust-${customer.id}`,
          type: 'customer',
          message: `New customer registered: ${customer.firstName || customer.username || 'User'} ${customer.lastName || ''}`.trim(),
          time: timeAgo,
          status: 'success',
          timestamp
        })
      })

      // Add recent employees with timestamps
      const sortedEmployees = [...employeesData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      }).slice(0, 2)

      sortedEmployees.forEach((employee: any) => {
        const timestamp = new Date(employee.createdAt).getTime()
        const timeAgo = getTimeAgo(employee.createdAt)
        activities.push({
          id: `emp-${employee.id}`,
          type: 'employee',
          message: `New employee added: ${employee.firstName || employee.username || 'Employee'} ${employee.lastName || ''}`.trim(),
          time: timeAgo,
          status: 'info',
          timestamp
        })
      })

      // Add recent services with timestamps
      const sortedServices = [...servicesData].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      }).slice(0, 2)

      sortedServices.forEach((service: any) => {
        const timestamp = new Date(service.createdAt).getTime()
        const timeAgo = getTimeAgo(service.createdAt)
        const status = service.isActive ? 'success' : 'warning'
        const activeStatus = service.isActive ? 'activated' : 'deactivated'
        activities.push({
          id: `srv-${service.id}`,
          type: 'service',
          message: `New service ${activeStatus}: ${service.serviceName} (${service.category})`,
          time: timeAgo,
          status: status,
          timestamp
        })
      })

      // Sort all activities by timestamp (most recent first)
      const sortedActivities = activities.sort((a, b) => {
        return b.timestamp - a.timestamp
      }).slice(0, 10) // Limit to 10 most recent

      setRecentActivities(sortedActivities)

      setStats({
        totalAppointments: appointmentsData.length,
        monthlyAppointments: monthlyAppointments,
        totalCustomers: customersData.length,
        monthlyNewCustomers: monthlyNewCustomers,
        totalServices: servicesData.length,
        activeServices: activeServices,
        totalEmployees: employeesData.length,
        activeEmployees: activeEmployees,
        pendingAppointments: pendingAppointments,
        approvedAppointments: approvedAppointments,
        completedAppointments: completedAppointments
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }: any) => (
    <div className={`${bgColor} rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-l-4 ${color}`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-gray-600 text-sm font-semibold mb-1'>{title}</p>
          <h3 className='text-3xl font-bold text-gray-900 mb-2'>{value}</h3>
          <p className='text-sm text-gray-500'>{subtitle}</p>
        </div>
        <div className={`p-4 rounded-full ${bgColor}`}>
          <Icon className={`text-4xl ${color}`} />
        </div>
      </div>
    </div>
  )

  const ActivityItem = ({ activity }: any) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'approved': return 'bg-blue-100 text-blue-800'
        case 'completed': return 'bg-green-100 text-green-800'
        case 'success': return 'bg-green-100 text-green-800'
        case 'info': return 'bg-indigo-100 text-indigo-800'
        default: return 'bg-gray-100 text-gray-800'
      }
    }

    const getIconColor = (type: string) => {
      switch (type) {
        case 'appointment': return 'text-blue-600'
        case 'customer': return 'text-green-600'
        case 'service': return 'text-purple-600'
        case 'employee': return 'text-orange-600'
        default: return 'text-gray-600'
      }
    }

    const getIcon = (type: string) => {
      switch (type) {
        case 'appointment': return CalendarToday
        case 'customer': return PeopleAlt
        case 'service': return Build
        case 'employee': return PersonAdd
        default: return Circle
      }
    }

    const IconComponent = getIcon(activity.type)

    return (
      <div className='flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors'>
        <div className={`p-2 rounded-full bg-gray-100 ${getIconColor(activity.type)}`}>
          <IconComponent fontSize='small' />
        </div>
        <div className='flex-1'>
          <p className='text-gray-900 font-medium'>{activity.message}</p>
          <p className='text-gray-500 text-sm mt-1'>{activity.time}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(activity.status)}`}>
          {activity.status}
        </span>
      </div>
    )
  }

  // Calculate data for charts
  const appointmentChartData = [
    { label: 'Pending', value: stats.pendingAppointments, color: 'bg-yellow-500' },
    { label: 'Approved', value: stats.approvedAppointments, color: 'bg-blue-500' },
    { label: 'Completed', value: stats.completedAppointments, color: 'bg-green-500' }
  ]

  const monthlyGrowthData = [
    { label: 'Appointments', value: stats.monthlyAppointments, color: 'bg-blue-600', maxValue: stats.totalAppointments },
    { label: 'New Customers', value: stats.monthlyNewCustomers, color: 'bg-green-600', maxValue: stats.totalCustomers },
    { label: 'Active Services', value: stats.activeServices, color: 'bg-purple-600', maxValue: stats.totalServices },
    { label: 'Active Staff', value: stats.activeEmployees, color: 'bg-orange-600', maxValue: stats.totalEmployees }
  ]

  const totalAppointmentStatusCount = stats.pendingAppointments + stats.approvedAppointments + stats.completedAppointments

  if (loading) {
    return (
      <div className='flex h-screen'>
        <Sidebar activeItem='Dashboard' />
        <div className='flex-1 flex flex-col'>
          <Navbar />
          <div className='flex-1 flex items-center justify-center'>
            <div className='text-xl text-gray-600'>Loading dashboard...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar activeItem='Dashboard' />
      <div className='flex-1 flex flex-col'>
        <Navbar />
        <div className='flex-1 overflow-y-auto bg-gray-50 p-8'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-4xl font-bold text-blue-900 mb-2'>Dashboard</h1>
          </div>

          {/* Main Stats Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <StatCard
              title='Total Appointments'
              value={stats.totalAppointments}
              subtitle={`${stats.monthlyAppointments} this month`}
              icon={CalendarToday}
              color='border-blue-500 text-blue-600'
              bgColor='bg-blue-50'
            />
            <StatCard
              title='Total Customers'
              value={stats.totalCustomers}
              subtitle={`${stats.monthlyNewCustomers} new this month`}
              icon={PeopleAlt}
              color='border-green-500 text-green-600'
              bgColor='bg-green-50'
            />
            <StatCard
              title='Active Services'
              value={stats.activeServices}
              subtitle={`${stats.totalServices} total services`}
              icon={Build}
              color='border-purple-500 text-purple-600'
              bgColor='bg-purple-50'
            />
            <StatCard
              title='Active Employees'
              value={stats.activeEmployees}
              subtitle={`${stats.totalEmployees} total employees`}
              icon={PersonAdd}
              color='border-orange-500 text-orange-600'
              bgColor='bg-orange-50'
            />
          </div>

          {/* Appointment Status Overview */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
            <div className='bg-gradient-to-br from-yellow-500 to-orange-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold'>Pending</h3>
                <Pending className='text-4xl opacity-80' />
              </div>
              <p className='text-4xl font-bold mb-2'>{stats.pendingAppointments}</p>
              <p className='text-yellow-100'>Appointments awaiting approval</p>
            </div>

            <div className='bg-gradient-to-br from-blue-500 to-blue-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold'>Approved</h3>
                <CheckCircle className='text-4xl opacity-80' />
              </div>
              <p className='text-4xl font-bold mb-2'>{stats.approvedAppointments}</p>
              <p className='text-blue-100'>Appointments in progress</p>
            </div>

            <div className='bg-gradient-to-br from-green-500 to-green-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 text-white'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-xl font-bold'>Completed</h3>
                <TrendingUp className='text-4xl opacity-80' />
              </div>
              <p className='text-4xl font-bold mb-2'>{stats.completedAppointments}</p>
              <p className='text-green-100'>Services finished this month</p>
            </div>
          </div>

          {/* Charts and Analytics */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
            {/* Bar Chart - Monthly Growth */}
            <div className='bg-white rounded-xl shadow-md p-6'>
              <h3 className='text-xl font-bold text-gray-900 mb-6'>Monthly Activity Overview</h3>
              <div className='space-y-6'>
                {monthlyGrowthData.map((item, index) => {
                  const maxValue = Math.max(...monthlyGrowthData.map(d => d.maxValue))
                  const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
                  
                  return (
                    <div key={index}>
                      <div className='flex justify-between mb-2'>
                        <span className='text-gray-700 font-medium'>{item.label}</span>
                        <span className='text-gray-900 font-bold'>
                          {item.value} / {item.maxValue}
                        </span>
                      </div>
                      <div className='relative w-full bg-gray-200 rounded-full h-8 overflow-hidden'>
                        <div 
                          className={`${item.color} h-8 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && (
                            <span className='text-white text-sm font-semibold'>
                              {Math.round(percentage)}%
                            </span>
                          )}
                        </div>
                        {percentage <= 15 && percentage > 0 && (
                          <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 text-sm font-semibold'>
                            {Math.round(percentage)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className='mt-6 pt-4 border-t border-gray-200'>
                <p className='text-sm text-gray-600 mb-3 font-semibold'>Performance Indicators:</p>
                <div className='grid grid-cols-2 gap-3'>
                  {monthlyGrowthData.map((item, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className='text-sm text-gray-700'>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pie Chart - Appointment Status Distribution */}
            <div className='bg-white rounded-xl shadow-md p-6'>
              <h3 className='text-xl font-bold text-gray-900 mb-6'>Appointment Status Distribution</h3>
              
              {/* Pie Chart SVG */}
              <div className='flex items-center justify-center mb-6'>
                <div className='relative w-64 h-64'>
                  <svg viewBox='0 0 200 200' className='transform -rotate-90'>
                    {appointmentChartData.map((item, index) => {
                      const total = totalAppointmentStatusCount || 1
                      const percentage = (item.value / total) * 100
                      const circumference = 2 * Math.PI * 70
                      const offset = appointmentChartData
                        .slice(0, index)
                        .reduce((sum, curr) => sum + ((curr.value / total) * circumference), 0)
                      const dashArray = `${(percentage / 100) * circumference} ${circumference}`
                      
                      const colors: { [key: string]: string } = {
                        'bg-yellow-500': '#eab308',
                        'bg-blue-500': '#3b82f6',
                        'bg-green-500': '#22c55e'
                      }
                      
                      return (
                        <circle
                          key={index}
                          cx='100'
                          cy='100'
                          r='70'
                          fill='none'
                          stroke={colors[item.color]}
                          strokeWidth='40'
                          strokeDasharray={dashArray}
                          strokeDashoffset={-offset}
                          className='transition-all duration-700'
                        />
                      )
                    })}
                  </svg>
                  
                  {/* Center Text */}
                  <div className='absolute inset-0 flex flex-col items-center justify-center'>
                    <p className='text-4xl font-bold text-gray-900'>{totalAppointmentStatusCount}</p>
                    <p className='text-sm text-gray-600'>Total</p>
                  </div>
                </div>
              </div>

              {/* Legend with percentages */}
              <div className='space-y-3'>
                {appointmentChartData.map((item, index) => {
                  const percentage = totalAppointmentStatusCount > 0 
                    ? Math.round((item.value / totalAppointmentStatusCount) * 100) 
                    : 0
                  
                  return (
                    <div key={index} className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'>
                      <div className='flex items-center gap-3'>
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className='font-medium text-gray-900'>{item.label}</span>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-gray-900'>{item.value}</p>
                        <p className='text-xs text-gray-600'>{percentage}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className='bg-white rounded-xl shadow-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold text-gray-900'>Recent Activity</h3>
              <button className='text-blue-600 hover:text-blue-700 font-semibold text-sm'>
                View All
              </button>
            </div>
            <div className='space-y-2 max-h-96 overflow-y-auto'>
              {recentActivities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
