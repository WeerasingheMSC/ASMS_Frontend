'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { GrDashboard } from "react-icons/gr";
import { FaRegQuestionCircle } from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";
import { MdOutlineRateReview, MdOutlineLogout } from "react-icons/md";
import { BiMessageSquareAdd } from "react-icons/bi";

interface SidebarProps {
  activeItem?: string;
}

const Sidebar = ({ activeItem = '' }: SidebarProps) => {
  const router = useRouter();

  return (
    <div className='w-1/6 min-h-screen bg-blue-1000 relative z-50'>
      <div className='flex justify-center items-center mx-auto lnline-flex flex-col border-b-2 pb-5 border-amber-50 rounded-lg'>
        <img src="../logo.png" alt="logo" className='rounded-full border-2 border-amber-50 mt-5 w-35 h-35 ' />
        <h1 className='text-amber-50 font-bold text-2xl mt-5'>VX Service</h1>
      </div>
      <div>
        <ul className='mt-10 text-white font-semibold text-lg space-y-8 ml-10'>
          <li 
            onClick={() => router.push('/customer')}
            className={`cursor-pointer flex text-lg p-2 rounded ${activeItem === 'Dashboard' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <GrDashboard className='mr-2 text-2xl' />Dashboard
          </li>
          <li 
            onClick={() => router.push('/customer/My Appointments')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'My Appointments' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <AiOutlineFileText className='mr-2 text-2xl' />My Appointments
          </li>
          <li 
            onClick={() => router.push('/customer/Request')}
            className={`cursor-pointer flex text-lg p-2 rounded ${activeItem === 'Request' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <BiMessageSquareAdd className='mr-2 text-2xl' />Request
          </li>
          <li 
            onClick={() => router.push('/customer/FAQ')}
            className={`cursor-pointer flex text-lg p-2 rounded-l-2xl ${activeItem === 'FAQ' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <FaRegQuestionCircle className='mr-2 text-2xl' />FAQ
          </li>
          <li 
            onClick={() => router.push('/customer/Review')}
            className={`cursor-pointer flex text-lg p-2 rounded ${activeItem === 'Review' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <MdOutlineRateReview className='mr-2 text-2xl' />Review
          </li>
          <li 
            onClick={() => router.push('/customer/Log out')}
            className={`cursor-pointer flex text-lg p-2 rounded ${activeItem === 'Log out' ? 'bg-white text-black' : 'hover:bg-white hover:text-black'}`}
          >
            <MdOutlineLogout className='mr-2 text-2xl' />Log out
          </li>
          
        </ul>
      </div>
    </div>
  )
}

export default Sidebar