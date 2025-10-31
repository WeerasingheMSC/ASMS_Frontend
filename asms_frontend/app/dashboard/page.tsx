import React from 'react'
import { GrDashboard,GrDocumentPerformance  } from "react-icons/gr";
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa";
import { AiOutlineFileText } from "react-icons/ai";
import { LiaToolsSolid } from "react-icons/lia";
import {MdOutlineHomeRepairService} from "react-icons/md";
const page = () => {
  return (
    <div className='w-1/6 h-screen  bg-blue-1000'>
      <div className='flex justify-center items-center mx-auto lnline-flex flex-col border-b-2 pb-5 border-amber-50 rounded-lg'>
        <img src="../logo.png" alt="logo"  className='rounded-full border-2 border-amber-50 mt-5 w-35 h-35 '/>
        <h1 className='text-amber-50 font-bold text-2xl mt-5'>VX Service</h1>
      </div>
      <div>
        <ul className='mt-10 text-white font-semibold text-lg space-y-8 ml-10'>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><GrDashboard className='mr-2  text-2xl'/>Dashboard</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><AiOutlineFileText className='mr-2  text-2xl'/>Appointments</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><MdOutlineHomeRepairService className='mr-2 text-2xl'/>Services</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><FaRegUser className='mr-2  text-2xl'/>Customers</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><LiaToolsSolid className='mr-2 text-2xl'/>Mechanics</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><GrDocumentPerformance  className='mr-2 text-2xl'/>Reports</li>
          <li className='hover:bg-white hover:text-black cursor-pointer flex text-lg hover:p-2 rounded'><IoSettingsOutline className='mr-2  text-2xl'/>Settings</li>
        </ul>
      </div>
       
      
    </div>
  )
}

export default page
