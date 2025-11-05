'use client'
import React, { useState } from 'react'
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
  status: 'pending' | 'approved' | 'completed';
  assignedEmployee?: string;
  notes?: string;
}

const AppointmentsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Sample appointments data
  const [appointments] = useState<Appointment[]>([
    {
      id: 1,
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '123-456-7890',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: '2020',
      vehiclePlate: 'ABC-1234',
      serviceType: 'Oil Change',
      appointmentDate: '2025-11-05',
      appointmentTime: '10:00 AM',
      status: 'pending',
      notes: 'Customer requested early morning service'
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '098-765-4321',
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      vehicleYear: '2019',
      vehiclePlate: 'XYZ-5678',
      serviceType: 'Brake Inspection',
      appointmentDate: '2025-11-06',
      appointmentTime: '02:00 PM',
      status: 'approved',
      assignedEmployee: 'Mike Johnson'
    },
    {
      id: 3,
      customerName: 'Robert Brown',
      customerEmail: 'robert@example.com',
      customerPhone: '555-123-4567',
      vehicleMake: 'Ford',
      vehicleModel: 'F-150',
      vehicleYear: '2021',
      vehiclePlate: 'DEF-9012',
      serviceType: 'Engine Diagnostic',
      appointmentDate: '2025-10-28',
      appointmentTime: '09:00 AM',
      status: 'completed',
      assignedEmployee: 'Sarah Williams'
    },
  ]);

  // Sample employees for assignment
  const [employees] = useState([
    { id: 1, name: 'Mike Johnson' },
    { id: 2, name: 'Sarah Williams' },
    { id: 3, name: 'Tom Anderson' },
  ]);

  // Filter appointments by status and search
  const filterAppointments = (status: 'pending' | 'approved' | 'completed') => {
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

  const pendingAppointments = filterAppointments('pending');
  const approvedAppointments = filterAppointments('approved');
  const completedAppointments = filterAppointments('completed');

  // Get current tab appointments
  const getCurrentAppointments = () => {
    switch(tabValue) {
      case 0: return pendingAppointments;
      case 1: return approvedAppointments;
      case 2: return completedAppointments;
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

  const handleApprove = (id: number) => {
    console.log('Approve appointment:', id);
    // Add your approve logic here
  };

  const handleReject = (id: number) => {
    console.log('Reject appointment:', id);
    // Add your reject logic here
  };

  const handleAssignEmployee = (appointmentId: number) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    setSelectedAppointment(appointment || null);
    setIsAssignModalOpen(true);
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
            <h1 className='text-3xl font-bold text-gray-800'>Appointment Management</h1>
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
                className='bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap'
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
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '16px',
              },
            }}
          >
            <Tab label={`In Progress (${pendingAppointments.length})`} />
            <Tab label={`Approved (${approvedAppointments.length})`} />
            <Tab label={`Completed (${completedAppointments.length})`} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        {/* Pending Appointments */}
        {tabValue === 0 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-indigo-700 text-white'>
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
                  <th className='px-4 py-4 text-left'>ID</th>
                  <th className='px-4 py-4 text-left'>Customer</th>
                  <th className='px-4 py-4 text-left'>Contact</th>
                  <th className='px-4 py-4 text-left'>Vehicle</th>
                  <th className='px-4 py-4 text-left'>Service</th>
                  <th className='px-4 py-4 text-left'>Date & Time</th>
                  <th className='px-4 py-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#6E8CFB',
                          '&.Mui-checked': {
                            color: '#f97316',
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
              <thead className='bg-indigo-700 text-white'>
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
                  <th className='px-4 py-4 text-left'>ID</th>
                  <th className='px-4 py-4 text-left'>Customer</th>
                  <th className='px-4 py-4 text-left'>Contact</th>
                  <th className='px-4 py-4 text-left'>Vehicle</th>
                  <th className='px-4 py-4 text-left'>Service</th>
                  <th className='px-4 py-4 text-left'>Date & Time</th>
                  <th className='px-4 py-4 text-left'>Assigned To</th>
                  <th className='px-4 py-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-yellow-50 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#FAB12F',
                          '&.Mui-checked': {
                            color: '#16a34a',
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

        {/* Completed Appointments */}
        {tabValue === 2 && (
          <div className='bg-white rounded-b-lg shadow-md overflow-hidden'>
            <table className='w-full'>
              <thead className='bg-indigo-700 text-white'>
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
                  <th className='px-4 py-4 text-left'>ID</th>
                  <th className='px-4 py-4 text-left'>Customer</th>
                  <th className='px-4 py-4 text-left'>Contact</th>
                  <th className='px-4 py-4 text-left'>Vehicle</th>
                  <th className='px-4 py-4 text-left'>Service</th>
                  <th className='px-4 py-4 text-left'>Date & Time</th>
                  <th className='px-4 py-4 text-left'>Handled By</th>
                  <th className='px-4 py-4 text-center'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedAppointments.map((apt, index) => (
                  <tr key={apt.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-green-50 transition-colors`}>
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(apt.id)}
                        onChange={() => handleSelectRow(apt.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#78C841',
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
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      className='w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all'
                      onClick={() => {
                        console.log('Assigned to:', emp.name);
                        setIsAssignModalOpen(false);
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <AssignmentIndIcon className='text-indigo-600' />
                        <span className='font-semibold text-gray-900'>{emp.name}</span>
                      </div>
                    </button>
                  ))}
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
