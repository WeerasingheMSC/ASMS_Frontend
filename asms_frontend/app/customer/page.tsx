'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'

export default function CustomerDashboard() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  // මෙතන appointment status එක save කරනවා (Accepted/Rejected/Completed/null)
  const [appointmentStatus, setAppointmentStatus] = useState<string | null>(null)
  
  // Loading animation control 
  const [isLoading, setIsLoading] = useState(true)

  // Service card images 
  const [currentImageIndex, setCurrentImageIndex] = useState({
    repair: 0,
    washing: 0,
    checkup: 0
  })

  // Progress bar data - Appointment progress tracking
  const [progressData, setProgressData] = useState<{
    appointmentId: string | null
    progressPercentage: number
    currentStage: string
    vehicleType: string
  }>({
    appointmentId: null,
    progressPercentage: 0,
    currentStage: 'Not Started',
    vehicleType: 'N/A'
  })

  // Service popup modal state
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedService, setSelectedService] = useState<{
    title: string
    description: string
    benefits: string[]
  } | null>(null)

  // Service details data
  const serviceDetails = {
    repair: {
      title: 'Vehicle Repair',
      description: 'At VX Service, we understand that your vehicle is more than just transportation—it\'s an essential part of your daily life. Our expert mechanics bring years of experience and cutting-edge diagnostic tools to ensure your vehicle receives the highest quality repair service.',
      benefits: [
        'Certified and experienced technicians with specialized training',
        'State-of-the-art diagnostic equipment for accurate problem detection',
        'Genuine parts and high-quality replacements guaranteed',
        'Comprehensive warranty on all repair work performed',
        'Transparent pricing with detailed cost breakdowns',
        'Fast turnaround time without compromising quality',
        'Free vehicle health inspection with every repair',
        'Emergency roadside assistance available 24/7'
      ]
    },
    washing: {
      title: 'Vehicle Washing',
      description: 'VX Service offers premium vehicle washing and detailing services that go beyond a simple clean. We use eco-friendly products and advanced techniques to protect your vehicle\'s paint, interior, and overall appearance while delivering a showroom-quality finish every time.',
      benefits: [
        'Eco-friendly, biodegradable cleaning products that are safe for your vehicle',
        'Professional hand washing technique to prevent scratches and swirl marks',
        'Interior deep cleaning including upholstery, dashboard, and carpet shampooing',
        'Paint protection and waxing for long-lasting shine',
        'Wheel and tire detailing with premium conditioning',
        'Odor elimination and air freshening treatment',
        'Water-spot free finish with purified water rinse',
        'Quick service options for customers on the go'
      ]
    },
    checkup: {
      title: 'Condition Checkup',
      description: 'Prevention is better than cure, and at VX Service, our comprehensive vehicle condition checkups are designed to identify potential issues before they become costly repairs. Our thorough multi-point inspection ensures your vehicle operates safely and efficiently.',
      benefits: [
        'Complete multi-point vehicle inspection covering all major systems',
        'Advanced computer diagnostics to detect hidden issues',
        'Detailed written report with photos of problem areas',
        'Priority recommendations for immediate and future maintenance',
        'Brake system inspection and safety check',
        'Fluid level checks and top-ups included',
        'Tire pressure, tread depth, and alignment assessment',
        'Battery health test and electrical system evaluation',
        'Expert advice on extending your vehicle\'s lifespan'
      ]
    }
  }

  const handleLearnMore = (serviceType: 'repair' | 'washing' | 'checkup') => {
    setSelectedService(serviceDetails[serviceType])
    setShowServiceModal(true)
  }

  const closeModal = () => {
    setShowServiceModal(false)
    setSelectedService(null)
  }


  
  const serviceImages = {
    repair: [
      '/services/vehicle-repair-1.jpg',
      '/services/vehicle-repair-2.webp',
      '/services/vehicle-repair-3.jpg'
    ],
    washing: [
      '/services/vehicle-washing-1.jpg',
      '/services/vehicle-washing-2.webp',
    ],
    checkup: [
      '/services/condition-checkup-1.webp',
      '/services/condition-checkup-2.webp',
    ]
  }

  // ============================================================================
  // API CALL - BACKEND ENDPOINT INTEGRATION
  // ============================================================================
  //  Admin team එක endpoint එක හදලා මෙතන replace කරන්න
  useEffect(() => {
    const fetchAppointmentStatus = async () => {
      try {
        // --------------------------------------------------------------------
        // ENDPOINT 1: Customer Appointment Status ගන්න API call
        // --------------------------------------------------------------------
        // Backend endpoint: GET /api/customer/appointment/status
        // Headers: { Authorization: Bearer <token> }
        // Response format: 
        // {
        //   success: true,
        //   status: "Appointment Accepted" | "Appointment Rejected" | "Appointment task completed" | null
        // }
        // --------------------------------------------------------------------
        // REPLACE THIS SECTION WITH ACTUAL API CALL:
        // --------------------------------------------------------------------
        // const response = await fetch('/api/customer/appointment/status', {
        //   method: 'GET',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('token')}` // or from cookie
        //   }
        // })
        // const data = await response.json()
        // if (data.success) {
        //   setAppointmentStatus(data.status)
        // }
        // setIsLoading(false)
        // --------------------------------------------------------------------
        
        // TEMPORARY MOCK DATA - මේක delete කරන්න API ready වෙද්දී , Etta ewa daddi...
        setTimeout(() => {
          // Test කරන්න නම් මේ line එක uncomment කරන්න:
          // setAppointmentStatus("Appointment Accepted")  // or "Appointment Rejected" or "Appointment task completed"
          setAppointmentStatus(null)  // No appointment - මේක default එක
          setIsLoading(false)
        }, 2000)
        
      } catch (error) {
        console.error('Failed to fetch appointment status:', error)
        setIsLoading(false)
      }
    }

    fetchAppointmentStatus()
  }, [])

  // ============================================================================
  // API CALL 2 - PROGRESS BAR DATA FETCH
  // ============================================================================
  // Backend Employee එක progress tracking endpoint එක හදලා කියද්දී මෙතන replace කරන්න
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        // --------------------------------------------------------------------
        // ENDPOINT 2: Customer Appointment Progress Data ගන්න API call
        // --------------------------------------------------------------------
        // Backend endpoint: GET /api/customer/appointment/progress
        // Headers: { Authorization: Bearer <token> }
        // 
        // මෙම endpoint එක customer ගේ active appointment එකක් තිබේ නම්
        // එම appointment එකේ progress details return කරයි.
        // 
        // Database Logic (Backend):    මේ logic එක chat එකෙන් දීපු එකක් so ,whatever හදල තියෙන එකෙන්
        // 1. Token එකෙන් customer ID එක extract කරන්න
        // 2. PostgreSQL query:
        //    SELECT a.appointment_id, a.progress_percentage, a.current_stage, a.vehicle_type
        //    FROM appointments a
        //    WHERE a.customer_id = <logged_in_customer_id>
        //    AND a.status IN ('Accepted', 'In Progress')
        //    ORDER BY a.created_at DESC
        //    LIMIT 1
        // 3. Employee විසින් update කරන progress_percentage එක return කරයි
        // 
        // Response format: 
        // {
        //   success: true,
        //   data: {
        //     appointmentId: "APT-2024-001",  // Unique Appointment ID
        //     progressPercentage: 65,         // 0-100 (Employee update කරන අගය)
        //     currentStage: "Engine Repair",  // වර්තමාන කටයුතු කරන stage එක
        //     vehicleType: "Car"              // Vehicle type (Car/Bike/Van etc)
        //   }
        // }
        // 
        // නැතිනම් appointment එකක් නැති නම්:
        // {
        //   success: true,
        //   data: null
        // }
        // --------------------------------------------------------------------
        // REPLACE THIS SECTION WITH ACTUAL API CALL:
        // --------------------------------------------------------------------
        // const response = await fetch('/api/customer/appointment/progress', {
        //   method: 'GET',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${localStorage.getItem('token')}`
        //   }
        // })
        // const result = await response.json()
        // if (result.success && result.data) {
        //   setProgressData({
        //     appointmentId: result.data.appointmentId,
        //     progressPercentage: result.data.progressPercentage,
        //     currentStage: result.data.currentStage,
        //     vehicleType: result.data.vehicleType
        //   })
        // } else {
        //   // No active appointment
        //   setProgressData({
        //     appointmentId: null,
        //     progressPercentage: 0,
        //     currentStage: 'No Active Appointment',
        //     vehicleType: 'N/A'
        //   })
        // }
        // --------------------------------------------------------------------
        
        // TEMPORARY MOCK DATA - මේක delete කරන්න API ready වෙද්දී
        setTimeout(() => {
          // Test කරන්න නම් මේ data වෙනස් කරන්න:
          setProgressData({
            appointmentId: 'APT-2024-001',
            progressPercentage: 65,  // 0-100 අතර අගයක්
            currentStage: 'Engine Repair',
            vehicleType: 'Car'
          })
          
          // No appointment තියෙද්දී test කරන්න නම්:
          // setProgressData({
          //   appointmentId: null,
          //   progressPercentage: 0,
          //   currentStage: 'No Active Appointment',
          //   vehicleType: 'N/A'
          // })
        }, 1500)
        
      } catch (error) {
        console.error('Failed to fetch progress data:', error)
        setProgressData({
          appointmentId: null,
          progressPercentage: 0,
          currentStage: 'Error Loading Data',
          vehicleType: 'N/A'
        })
      }
    }

    fetchProgressData()
    
    // Real-time updates - හැම 30 seconds වලට refresh කරන්න
    const progressInterval = setInterval(fetchProgressData, 30000)
    return () => clearInterval(progressInterval)
  }, [])

 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => ({
        repair: (prev.repair + 1) % serviceImages.repair.length,
        washing: (prev.washing + 1) % serviceImages.washing.length,
        checkup: (prev.checkup + 1) % serviceImages.checkup.length
      }))
    }, 3000) // 3000ms 

    return () => clearInterval(interval) // Cleanup කරන්න component unmount වෙනකොට
  }, [])

  // ============================================================================
  // GREETING MESSAGE - Status එකට අනුව message එක වෙනස් වෙනවා
  // ============================================================================
  const getGreetingMessage = () => {
    // Status: "Appointment Accepted" - Admin appointment එක accept කරලා
    if (appointmentStatus === "Appointment Accepted") {
      return "Your appointment has been confirmed!"
    } 
    // Status: "Appointment Rejected" - Admin appointment එක reject කරලා
    else if (appointmentStatus === "Appointment Rejected") {
      return "Please reschedule your appointment"
    } 
    // Status: "Appointment task completed" - Service work එක complete වෙලා
    else if (appointmentStatus === "Appointment task completed") {
      return "Your service is complete. Thank you!"
    }
    // Status: null - කිසිම appointment එකක් නැති default message
    return "Let's keep your vehicle in top condition"
  }

  return (
    <div className='flex'>
      <Sidebar activeItem='Dashboard' />
      
      <div className='flex-1 ml-[16.666667%] p-8 bg-gray-50 min-h-screen'>
        
        <div className='mb-8 animate-fade-in-down'>
          <div className='relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-900 to-blue-900 p-10 rounded-3xl shadow-2xl'>
            <div className='absolute inset-0 opacity-10'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16'></div>
              <div className='absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-20 translate-y-20'></div>
              <div className='absolute top-1/2 right-1/4 w-24 h-24 bg-white rounded-full'></div>
            </div>
            
            <div className='relative z-10'>
              <h1 className='text-6xl font-extrabold mb-4 text-white tracking-tight animate-bounce-in'>
                Welcome! <span className='inline-block animate-wave'>🔧</span>
              </h1>
              <p className='text-2xl text-white font-medium opacity-95 animate-slide-up leading-relaxed max-w-2xl'>
                {getGreetingMessage()}
              </p>
            </div>

            {isLoading && (
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-10 animate-shine'></div>
            )}
          </div>
        </div>

       
        <div className='mb-8'>
          <h2 className='text-3xl font-bold text-gray-800 mb-6'>Our Services</h2>
          
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {/* Service 1: Vehicle Repair */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-blue-100 to-blue-50 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.repair.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Vehicle Repair ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.repair ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.repair.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.repair ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Card Content */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-800 mb-2'>Vehicle Repair</h3>
                <p className='text-gray-600 mb-4'>Professional repair services for all vehicle types. Expert mechanics ready to fix any issue.</p>
                <button 
                  onClick={() => handleLearnMore('repair')}
                  className='w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300'
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Service 2: Vehicle Washing */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-green-100 to-green-50 group-hover:from-green-200 group-hover:to-green-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.washing.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Vehicle Washing ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.washing ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.washing.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.washing ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Card Content */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-800 mb-2'>Vehicle Washing</h3>
                <p className='text-gray-600 mb-4'>Premium washing and detailing services. Keep your vehicle spotless and shining.</p>
                <button 
                  onClick={() => handleLearnMore('washing')}
                  className='w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300'
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Service 3: Condition Checkup */}
            <div className='group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2'>
              {/* Image Container - Dynamic background color on hover */}
              <div className='relative h-48 bg-gradient-to-br from-purple-100 to-purple-50 group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300 flex items-center justify-center overflow-hidden'>
                {/* Photos carousel - auto-rotate every 3 seconds */}
                {serviceImages.checkup.map((imageSrc, index) => (
                  <img 
                    key={index}
                    src={imageSrc} 
                    alt={`Condition Checkup ${index + 1}`} 
                    className={`absolute w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 ${
                      index === currentImageIndex.checkup ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Image indicators */}
                <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10'>
                  {serviceImages.checkup.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentImageIndex.checkup ? 'bg-white w-6' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {/* Card Content */}
              <div className='p-6'>
                <h3 className='text-xl font-bold text-gray-800 mb-2'>Condition Checkup</h3>
                <p className='text-gray-600 mb-4'>Comprehensive vehicle inspection and diagnostics. Ensure your vehicle is in perfect condition.</p>
                <button 
                  onClick={() => handleLearnMore('checkup')}
                  className='w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300'
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* PROGRESS BAR SECTION - Task Progress Tracking */}
        {/* ============================================================================ */}
        {/* Show progress section if there's an active appointment, else show empty state */}
        {progressData.appointmentId ? (
          <div className='mb-8 animate-fade-in-down'>
            <div className='bg-white rounded-2xl shadow-lg p-8'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6'>Progress About Your Task</h2>
              
              <div className='flex flex-col lg:flex-row items-center gap-8'>
                {/* Left Side - Circular Progress Bar */}
                <div className='flex-shrink-0'>
                  <div className='relative w-48 h-48'>
                    {/* SVG Circular Progress */}
                    <svg className='w-48 h-48 transform -rotate-90'>
                      {/* Background Circle */}
                      <circle
                        cx='96'
                        cy='96'
                        r='80'
                        stroke='#e5e7eb'
                        strokeWidth='12'
                        fill='none'
                      />
                      {/* Progress Circle */}
                      <circle
                        cx='96'
                        cy='96'
                        r='80'
                        stroke='url(#progressGradient)'
                        strokeWidth='12'
                        fill='none'
                        strokeDasharray={`${2 * Math.PI * 80}`}
                        strokeDashoffset={`${2 * Math.PI * 80 * (1 - progressData.progressPercentage / 100)}`}
                        strokeLinecap='round'
                        className='transition-all duration-1000 ease-out'
                      />
                      {/* Gradient Definition */}
                      <defs>
                        <linearGradient id='progressGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                          <stop offset='0%' stopColor='#3b82f6' />
                          <stop offset='50%' stopColor='#8b5cf6' />
                          <stop offset='100%' stopColor='#ec4899' />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Center Text - Percentage */}
                    <div className='absolute inset-0 flex flex-col items-center justify-center'>
                      <span className='text-4xl font-bold text-gray-800'>
                        {progressData.progressPercentage}%
                      </span>
                      <span className='text-sm text-gray-500 mt-1'>Complete</span>
                    </div>
                  </div>
                </div>

                {/* Right Side - Details */}
                <div className='flex-1 space-y-4'>
                  {/* Appointment ID */}
                  <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Appointment ID</p>
                    <p className='text-lg font-semibold text-gray-800'>
                      {progressData.appointmentId}
                    </p>
                  </div>

                  {/* Current Stage */}
                  <div className='bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-600 mb-1'>Current Stage</p>
                    <p className='text-lg font-semibold text-gray-800'>
                      {progressData.currentStage}
                    </p>
                  </div>

                  {/* Progress Stages Indicator */}
                  <div className='mt-6'>
                    <p className='text-sm text-gray-600 mb-3'>Progress Stages</p>
                    <div className='flex items-center gap-2'>
                      {/* Stage 1 */}
                      <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        progressData.progressPercentage >= 25 ? 'bg-blue-500' : 'bg-gray-200'
                      }`}></div>
                      {/* Stage 2 */}
                      <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        progressData.progressPercentage >= 50 ? 'bg-purple-500' : 'bg-gray-200'
                      }`}></div>
                      {/* Stage 3 */}
                      <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        progressData.progressPercentage >= 75 ? 'bg-pink-500' : 'bg-gray-200'
                      }`}></div>
                      {/* Stage 4 */}
                      <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                        progressData.progressPercentage >= 100 ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    </div>
                    <div className='flex justify-between mt-2 text-xs text-gray-500'>
                      <span>Started</span>
                      <span>In Progress</span>
                      <span>Almost Done</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='mb-8 animate-fade-in-down'>
            <div className='bg-white rounded-2xl shadow-lg p-12 text-center'>
              <div className='max-w-md mx-auto'>
                <div className='mb-6'>
                  <svg className='w-24 h-24 mx-auto text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                  </svg>
                </div>
                <h3 className='text-2xl font-bold text-gray-800 mb-3'>We are looking for your appointment</h3>
                <p className='text-gray-600 mb-6'>You haven&apos;t scheduled an appointment yet. Book a service to track your vehicle&apos;s progress here.</p>
                <button className='bg-blue-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1'>
                  Book an Appointment
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Service Details Modal Popup */}
      {showServiceModal && selectedService && (
        <div className='fixed inset-0 bg-none bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4' onClick={closeModal}>
          <div className='bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto' onClick={(e) => e.stopPropagation()}>
            <div className='sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 rounded-t-2xl flex justify-between items-center'>
              <h2 className='text-3xl font-bold'>{selectedService.title}</h2>
              <button 
                onClick={closeModal}
                className='text-white hover:text-gray-200 text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all duration-300'
              >
                ×
              </button>
            </div>
            
            <div className='p-8'>
              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>Why Choose VX Service?</h3>
                <p className='text-gray-700 leading-relaxed text-lg'>
                  {selectedService.description}
                </p>
              </div>

              <div className='mb-6'>
                <h3 className='text-xl font-semibold text-gray-800 mb-4'>Key Benefits & Features</h3>
                <div className='space-y-3'>
                  {selectedService.benefits.map((benefit, index) => (
                    <div key={index} className='flex items-start gap-3 bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors duration-300'>
                      <svg className='w-6 h-6 text-blue-800 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                      </svg>
                      <p className='text-gray-700 leading-relaxed'>{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>

              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}