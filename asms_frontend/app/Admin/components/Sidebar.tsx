'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { GrDashboard, GrDocumentPerformance } from "react-icons/gr";
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";
import { MdOutlineHomeRepairService } from "react-icons/md";
import { HiOutlineUserGroup } from "react-icons/hi";

interface SidebarProps {
  activeItem?: string;
}

const Sidebar = ({ activeItem = '' }: SidebarProps) => {
  const router = useRouter();

  return (
    <div className='w-1/6 h-screen bg-blue-1000 relative z-50 shadow-gray-800 shadow-lg'>
      <div className='flex justify-center items-center mx-auto lnline-flex flex-col border-b-2 pb-5 border-amber-50 rounded-lg'>
        <img src="/logo.png" alt="logo" className='rounded-full border-2 border-amber-50 mt-5 w-35 h-35 ' />
        <h1 className='text-amber-50 font-bold text-2xl mt-5'>VX Service</h1>
      </div>
      <div>
        <ul className='mt-10 text-white font-semibold text-lg space-y-4 ml-10'>
          <li 
            onClick={() => router.push('/Admin')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'Dashboard' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <GrDashboard className='mr-2 text-2xl' />Dashboard
          </li>
          <li 
            onClick={() => router.push('/Admin/Appointments')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'Appointments' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <AiOutlineFileText className='mr-2 text-2xl' />Appointments
          </li>
          <li 
            onClick={() => router.push('/Admin/Services')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'Services' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <MdOutlineHomeRepairService className='mr-2 text-2xl' />Services
          </li>
          <li 
            onClick={() => router.push('/Admin/Employees')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'Employees' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <FaRegUser className='mr-2 text-2xl' />Employees
          </li>
          <li 
            onClick={() => router.push('/Admin/Customers')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'Customers' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <HiOutlineUserGroup className='mr-2 text-2xl' />Customers
          </li>
          <li 
            onClick={() => router.push('/Admin/FAQManagement')}
            className={`cursor-pointer flex text-lg p-2 rounded ${activeItem === 'Settings' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <IoSettingsOutline className='mr-2 text-2xl' />Faq Management
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
