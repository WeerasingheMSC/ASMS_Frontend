'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { TextField, InputAdornment, IconButton, Tooltip, Tabs, Tab, Box, Chip, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getAllAppointments, approveAppointment, rejectAppointment, assignEmployeeToAppointment, AppointmentResponse } from '../../lib/appointmentsApi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface Appointment {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_SERVICE' | 'READY';
  assignedEmployee?: string;
  assignedEmployeeId?: number;
  notes?: string;
}

interface Employee {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  position: string;
  department: string;
  isActive: boolean;
}

const AppointmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState('');

  // Fetch appointments from backend
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Fetch employees from backend
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    setError('');
    try {
      const data = await getAllAppointments();
      console.log('Fetched appointments from backend:', data);
      
      // Transform backend response to frontend format
      const transformedAppointments: Appointment[] = data.map((apt: AppointmentResponse) => ({
        id: apt.id,
        customerName: apt.customerFirstName && apt.customerLastName 
          ? `${apt.customerFirstName} ${apt.customerLastName}` 
          : apt.customerUsername || 'Unknown Customer',
        customerEmail: apt.customerEmail || '',
        customerPhone: apt.customerPhone || '',
        vehicleMake: apt.vehicleBrand,
        vehicleModel: apt.model,
        vehicleYear: apt.yearOfManufacture,
        vehiclePlate: apt.registerNumber,
        serviceType: apt.serviceType,
        appointmentDate: apt.appointmentDate.split('T')[0], // Extract date from ISO string
        appointmentTime: apt.timeSlot,
        status: apt.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_SERVICE' | 'READY',
        notes: apt.additionalRequirements || '',
        assignedEmployee: apt.assignedEmployeeName,
        assignedEmployeeId: apt.assignedEmployeeId,
      }));

      console.log('Transformed appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Using sample data.');
      // Keep sample data as fallback
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        console.error('No user data found');
        // Use mock data as fallback
        setEmployees([
          { 
            id: 1, 
            username: 'mikej', 
            email: 'mike@example.com',
            firstName: 'Mike', 
            lastName: 'Johnson',
            phoneNumber: '123-456-7890',
            position: 'Technician',
            department: 'Service',
            isActive: true
          },
          { 
            id: 2, 
            username: 'sarahw', 
            email: 'sarah@example.com',
            firstName: 'Sarah', 
            lastName: 'Williams',
            phoneNumber: '098-765-4321',
            position: 'Senior Technician',
            department: 'Service',
            isActive: true
          },
        ] as Employee[]);
        setLoadingEmployees(false);
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched employees:', data);
        // Filter only active employees
        const activeEmployees = data.filter((emp: Employee) => emp.isActive);
        setEmployees(activeEmployees);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch employees. Status:', response.status, 'Error:', errorText);
        // Use mock data as fallback
        setEmployees([
          { 
            id: 1, 
            username: 'mikej', 
            email: 'mike@example.com',
            firstName: 'Mike', 
            lastName: 'Johnson',
            phoneNumber: '123-456-7890',
            position: 'Technician',
            department: 'Service',
            isActive: true
          },
        ] as Employee[]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Use mock data as fallback
      setEmployees([
        { 
          id: 1, 
          username: 'mikej', 
          email: 'mike@example.com',
          firstName: 'Mike', 
          lastName: 'Johnson',
          phoneNumber: '123-456-7890',
          position: 'Technician',
          department: 'Service',
          isActive: true
        },
      ] as Employee[]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Filter appointments by status and search
  const filterAppointments = (status: 'PENDING' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED') => {
    return appointments.filter(apt => 
      apt.status === status &&
      (apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
       apt.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
       apt.vehicleMake.toLowerCase().includes(searchQuery.toLowerCase()) ||
       apt.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
       apt.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
       apt.serviceType.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const pendingAppointments = filterAppointments('PENDING');
  const approvedAppointments = filterAppointments('CONFIRMED');
  const inServiceAppointments = filterAppointments('IN_SERVICE');
  const completedAppointments = filterAppointments('COMPLETED');

  // Get current tab appointments
  const getCurrentAppointments = () => {
    switch(tabValue) {
      case 0: return pendingAppointments;
      case 1: return approvedAppointments;
      case 2: return inServiceAppointments;
      case 3: return completedAppointments;
      default: return [];
    }
  };

  const currentAppointments = getCurrentAppointments();

  // Handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(currentAppointments.map(apt => apt.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle individual row checkbox
  const handleSelectRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const dataToExport = selectedRows.length > 0
      ? appointments.filter(apt => selectedRows.includes(apt.id))
      : currentAppointments;

    // Flatten data for CSV
    const csvData = dataToExport.map(apt => ({
      ID: apt.id,
      'Customer Name': apt.customerName,
      'Customer Email': apt.customerEmail,
      'Customer Phone': apt.customerPhone,
      'Vehicle Make': apt.vehicleMake,
      'Vehicle Model': apt.vehicleModel,
      'Vehicle Year': apt.vehicleYear,
      'License Plate': apt.vehiclePlate,
      'Service Type': apt.serviceType,
      'Appointment Date': apt.appointmentDate,
      'Appointment Time': apt.appointmentTime,
      'Status': apt.status,
      'Assigned Employee': apt.assignedEmployee || 'Not Assigned',
      'Notes': apt.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(data, `appointments_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleApprove = async (id: number) => {
    try {
      console.log('Approving appointment:', id);
      await approveAppointment(id);
      
      // Refresh appointments list to reflect the change
      await fetchAppointments();
      
      alert('Appointment approved successfully! Customer status changed to CONFIRMED.');
    } catch (error: any) {
      console.error('Failed to approve appointment:', error);
      alert(error.message || 'Failed to approve appointment. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this appointment?')) {
      return;
    }
    
    try {
      console.log('Rejecting appointment:', id);
      await rejectAppointment(id);
      
      // Refresh appointments list to reflect the change
      await fetchAppointments();
      
      alert('Appointment rejected successfully! Status changed to CANCELLED.');
    } catch (error: any) {
      console.error('Failed to reject appointment:', error);
      alert(error.message || 'Failed to reject appointment. Please try again.');
    }
  };

  const handleAssignEmployee = (appointmentId: number) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    setSelectedAppointment(appointment || null);
    setIsAssignModalOpen(true);
    // Refresh employee list when opening modal to get latest employees
    fetchEmployees();
  };

  const handleAssignEmployeeToAppointment = async (employeeId: number, employeeName: string) => {
    if (!selectedAppointment) return;

    try {
      // Call the backend API to assign employee and change status to IN_SERVICE
      await assignEmployeeToAppointment(selectedAppointment.id, employeeId);

      // Update the appointments array with the assigned employee and new status
      setAppointments(prevAppointments =>
        prevAppointments.map(apt =>
          apt.id === selectedAppointment.id
            ? {
                ...apt,
                assignedEmployee: employeeName,
                assignedEmployeeId: employeeId,
                status: 'IN_SERVICE', // Update status to IN_SERVICE
              }
            : apt
        )
      );

      // Close the modal
      setIsAssignModalOpen(false);
      
      // Show success message
      console.log(`Successfully assigned ${employeeName} to appointment #${selectedAppointment.id} - Status changed to IN_SERVICE`);
      
      // Refresh appointments to get latest data from backend
      fetchAppointments();
    } catch (error) {
      console.error('Error assigning employee:', error);
      alert('Failed to assign employee. Please try again.');
    }
  };

  const handleViewDetails = (appointment: Appointment) => {
    console.log('View details:', appointment);
    // Add your view details logic here
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar activeItem="Appointments" />

      <div className='flex-1 flex flex-col'>
        <Navbar />
        <div className='flex-1 p-8 bg-gray-50 relative overflow-y-auto'>
          <div className='flex justify-between items-center mb-6'>
            <h1 className='text-3xl font-bold text-blue-800'>Appointment Management</h1>
          <div className='flex gap-4'>
            <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Pending: </span>
              <span className='font-bold text-orange-600'>{pendingAppointments.length}</span>
            </div>
            <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Approved: </span>
              <span className='font-bold text-green-600'>{approvedAppointments.length}</span>
            </div>
            <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>In Service: </span>
              <span className='font-bold text-purple-600'>{inServiceAppointments.length}</span>
            </div>
            <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Completed: </span>
              <span className='font-bold text-blue-600'>{completedAppointments.length}</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='rounded-lg p-4 mb-4'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by customer, vehicle, or service type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon className='text-black' />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f9fafb',
                    '& fieldset': {
                      borderColor: '#000000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#6366f1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  },
                }}
              />
            </div>
            <Tooltip title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected rows to CSV` : 'Export all filtered data to CSV'}>
              <button
                onClick={handleExportCSV}
                className='bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap'
              >
                <FileDownloadIcon />
                Export to CSV
              </button>
            </Tooltip>
          </div>
          {selectedRows.length > 0 && (
            <div className='mt-3 text-sm text-indigo-600 font-medium'>
              {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white', borderRadius: '8px 8px 0 0' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            TabIndicatorProps={{
              style: {
                backgroundColor: tabValue === 0 ? '#f97316' : tabValue === 1 ? '#10b981' : tabValue === 2 ? '#8b5cf6' : '#3b82f6',
                height: '3px',
              },
            }}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
                color: '#000000',
                '&.Mui-selected': {
                  color: tabValue === 0 ? '#f97316' : tabValue === 1 ? '#10b981' : tabValue === 2 ? '#8b5cf6' : '#3b82f6',
                },
              },
            }}
          >
            <Tab label={`In Progress (${pendingAppointments.length})`} />
            <Tab label={`Approved (${approvedAppointments.length})`} />
            <Tab label={`In Service (${inServiceAppointments.length})`} />
            <Tab label={`Completed (${completedAppointments.length})`} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {/* Pending Appointments */}
        {tabValue === 0 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-800 text-white'>
                <tr>
                  <th className='px-4 py-4 text-left'>
                    <Checkbox
                      checked={currentAppointments.length > 0 && selectedRows.length === currentAppointments.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < currentAppointments.length}
                      onChange={handleSelectAll}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: 'white',
                        },
                      }}
                    />
                  </th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>ID</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Customer</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Contact</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Vehicle</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Service</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Date & Time</p></th>
                  <th className='px-4 py-4 text-center'><p className='text-white'>Actions</p></th>
                </tr>
              </thead>
              <tbody>
                {pendingAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#000000',
                          '&.Mui-checked': {
                            color: '#f97316',
                          },
                        }}
                      />
                    </td>
                    <td className='px-4 py-4 font-medium text-gray-900'>{apt.id}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.customerName}</div>
                      <div className='text-sm text-gray-900'>{apt.customerEmail}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-900 font-medium'>{apt.customerPhone}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.vehicleMake} {apt.vehicleModel}</div>
                      <div className='text-sm text-gray-900'>{apt.vehicleYear} - {apt.vehiclePlate}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-900 font-medium'>{apt.serviceType}</td>
                    <td className='px-4 py-4'>
                      <div className='font-medium text-gray-900'>{apt.appointmentDate}</div>
                      <div className='text-sm text-gray-900'>{apt.appointmentTime}</div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewDetails(apt)}
                            size="small"
                            sx={{ color: '#6366f1', '&:hover': { backgroundColor: '#e0e7ff' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Approve">
                          <IconButton
                            onClick={() => handleApprove(apt.id)}
                            size="small"
                            sx={{ color: '#10b981', '&:hover': { backgroundColor: '#d1fae5' } }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            onClick={() => handleReject(apt.id)}
                            size="small"
                            sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#fee2e2' } }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingAppointments.length === 0 && (
                  <tr>
                    <td colSpan={8} className='px-6 py-8 text-center text-gray-500'>
                      No pending appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Approved Appointments */}
        {tabValue === 1 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-800 text-white'>
                <tr>
                  <th className='px-4 py-4 text-left'>
                    <Checkbox
                      checked={currentAppointments.length > 0 && selectedRows.length === currentAppointments.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < currentAppointments.length}
                      onChange={handleSelectAll}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: 'white',
                        },
                      }}
                    />
                  </th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>ID</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Customer</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Contact</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Vehicle</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Service</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Date & Time</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Assigned To</p></th>
                  <th className='px-4 py-4 text-center'><p className='text-white'>Actions</p></th>
                </tr>
              </thead>
              <tbody>
                {approvedAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#000000',
                          '&.Mui-checked': {
                            color: '#16a34a',
                          },
                        }}
                      />
                    </td>
                    <td className='px-4 py-4 font-medium text-gray-900'>{apt.id}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.customerName}</div>
                      <div className='text-sm text-gray-900'>{apt.customerEmail}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-000 font-medium'>{apt.customerPhone}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.vehicleMake} {apt.vehicleModel}</div>
                      <div className='text-sm text-gray-600'>{apt.vehicleYear} - {apt.vehiclePlate}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-900 font-medium'>{apt.serviceType}</td>
                    <td className='px-4 py-4'>
                      <div className='font-medium text-gray-900'>{apt.appointmentDate}</div>
                      <div className='text-sm text-gray-900'>{apt.appointmentTime}</div>
                    </td>
                    <td className='px-4 py-4'>
                      {apt.assignedEmployee ? (
                        <Chip label={apt.assignedEmployee} color="success" size="small" />
                      ) : (
                        <Chip label="Unassigned" color="default" size="small" />
                      )}
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewDetails(apt)}
                            size="small"
                            sx={{ color: '#6366f1', '&:hover': { backgroundColor: '#e0e7ff' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assign Employee">
                          <IconButton
                            onClick={() => handleAssignEmployee(apt.id)}
                            size="small"
                            sx={{ color: '#8b5cf6', '&:hover': { backgroundColor: '#ede9fe' } }}
                          >
                            <AssignmentIndIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {approvedAppointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className='px-6 py-8 text-center text-gray-500'>
                      No approved appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* In Service Appointments (Assigned to Employees) */}
        {tabValue === 2 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-800 text-white'>
                <tr>
                  <th className='px-4 py-4 text-left'>
                    <Checkbox
                      checked={currentAppointments.length > 0 && selectedRows.length === currentAppointments.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < currentAppointments.length}
                      onChange={handleSelectAll}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: 'white',
                        },
                      }}
                    />
                  </th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>ID</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Customer</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Contact</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Vehicle</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Service</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Date & Time</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Assigned To</p></th>
                  <th className='px-4 py-4 text-center'><p className='text-white'>Actions</p></th>
                </tr>
              </thead>
              <tbody>
                {inServiceAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#000000',
                          '&.Mui-checked': {
                            color: '#8b5cf6',
                          },
                        }}
                      />
                    </td>
                    <td className='px-4 py-4'>
                      <span className='text-sm font-medium text-gray-900'>#{apt.id}</span>
                    </td>
                    <td className='px-4 py-4'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{apt.customerName}</p>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div>
                        <p className='text-xs text-gray-600'>{apt.customerEmail}</p>
                        <p className='text-xs text-gray-600'>{apt.customerPhone}</p>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{apt.vehicleMake} {apt.vehicleModel}</p>
                        <p className='text-xs text-gray-500'>{apt.vehiclePlate}</p>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <span className='text-sm text-gray-900'>{apt.serviceType}</span>
                    </td>
                    <td className='px-4 py-4'>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>{apt.appointmentDate}</p>
                        <p className='text-xs text-gray-500'>{apt.appointmentTime}</p>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex items-center gap-2'>
                        <AssignmentIndIcon className='text-purple-600' fontSize='small' />
                        <span className='text-sm font-semibold text-purple-700'>
                          {apt.assignedEmployee || 'Not Assigned'}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewDetails(apt)}
                            size="small"
                            sx={{ color: '#6366f1', '&:hover': { backgroundColor: '#e0e7ff' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Re-assign Employee">
                          <IconButton
                            onClick={() => handleAssignEmployee(apt.id)}
                            size="small"
                            sx={{ color: '#8b5cf6', '&:hover': { backgroundColor: '#f3e8ff' } }}
                          >
                            <AssignmentIndIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {inServiceAppointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className='px-6 py-8 text-center text-gray-500'>
                      No appointments in service found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Completed Appointments */}
        {tabValue === 3 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-gray-800 text-white'>
                <tr>
                  <th className='px-4 py-4 text-left'>
                    <Checkbox
                      checked={currentAppointments.length > 0 && selectedRows.length === currentAppointments.length}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < currentAppointments.length}
                      onChange={handleSelectAll}
                      sx={{
                        color: 'white',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        '&.MuiCheckbox-indeterminate': {
                          color: 'white',
                        },
                      }}
                    />
                  </th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>ID</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Customer</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Contact</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Vehicle</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Service</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Date & Time</p></th>
                  <th className='px-4 py-4 text-left'><p className='text-white'>Handled By</p></th>
                  <th className='px-4 py-4 text-center'><p className='text-white'>Actions</p></th>
                </tr>
              </thead>
              <tbody>
                {completedAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#000000',
                          '&.Mui-checked': {
                            color: '#2563eb',
                          },
                        }}
                      />
                    </td>
                    <td className='px-4 py-4 font-medium text-gray-900'>{apt.id}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.customerName}</div>
                      <div className='text-sm text-gray-600'>{apt.customerEmail}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-700 font-medium'>{apt.customerPhone}</td>
                    <td className='px-4 py-4'>
                      <div className='font-semibold text-gray-900'>{apt.vehicleMake} {apt.vehicleModel}</div>
                      <div className='text-sm text-gray-600'>{apt.vehicleYear} - {apt.vehiclePlate}</div>
                    </td>
                    <td className='px-4 py-4 text-gray-700 font-medium'>{apt.serviceType}</td>
                    <td className='px-4 py-4'>
                      <div className='font-medium text-gray-900'>{apt.appointmentDate}</div>
                      <div className='text-sm text-gray-600'>{apt.appointmentTime}</div>
                    </td>
                    <td className='px-4 py-4'>
                      <Chip label={apt.assignedEmployee || 'N/A'} color="info" size="small" />
                    </td>
                    <td className='px-4 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => handleViewDetails(apt)}
                            size="small"
                            sx={{ color: '#6366f1', '&:hover': { backgroundColor: '#e0e7ff' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {completedAppointments.length === 0 && (
                  <tr>
                    <td colSpan={9} className='px-6 py-8 text-center text-gray-500'>
                      No completed appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Assign Employee Modal */}
        {isAssignModalOpen && selectedAppointment && (
          <>
            <div 
              className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
              onClick={() => setIsAssignModalOpen(false)}
            ></div>
            
            <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
              <div className='bg-white rounded-lg p-8 w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl pointer-events-auto'>
                <h2 className='text-2xl font-bold mb-6 text-gray-800'>Assign Employee</h2>
                
                <div className='mb-4 p-4 bg-gray-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>Customer: <span className='font-semibold text-gray-900'>{selectedAppointment.customerName}</span></p>
                  <p className='text-sm text-gray-600'>Vehicle: <span className='font-semibold text-gray-900'>{selectedAppointment.vehicleMake} {selectedAppointment.vehicleModel}</span></p>
                  <p className='text-sm text-gray-600'>Service: <span className='font-semibold text-gray-900'>{selectedAppointment.serviceType}</span></p>
                </div>

                <div className='space-y-3'>
                  {loadingEmployees ? (
                    <div className='text-center py-4 text-gray-600'>Loading employees...</div>
                  ) : employees.length === 0 ? (
                    <div className='text-center py-4 text-gray-600'>No active employees available</div>
                  ) : (
                    employees.map(emp => (
                      <button
                        key={emp.id}
                        className='w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all'
                        onClick={() => {
                          const employeeName = `${emp.firstName} ${emp.lastName}`;
                          handleAssignEmployeeToAppointment(emp.id, employeeName);
                        }}
                      >
                        <div className='flex items-center gap-3'>
                          <AssignmentIndIcon className='text-indigo-600' />
                          <div className='flex-1'>
                            <span className='font-semibold text-gray-900'>{emp.firstName} {emp.lastName}</span>
                            <div className='text-xs text-gray-500 mt-1'>
                              {emp.position} - {emp.department}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className='w-full mt-6 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default AppointmentsPage
