'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { IoMdClose } from "react-icons/io";
import { TextField, InputAdornment, IconButton, Tooltip, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const EmployeesPage = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(1);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
    name: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/signin';
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search query
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      (employee.phoneNumber && employee.phoneNumber.includes(searchQuery)) ||
      (employee.position && employee.position.toLowerCase().includes(searchLower)) ||
      (employee.department && employee.department.toLowerCase().includes(searchLower));
  });

  // Handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(filteredEmployees.map(emp => emp.id));
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
      ? employees.filter(emp => selectedRows.includes(emp.id))
      : filteredEmployees;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(data, `employees_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Handle Edit
  const handleEdit = (employee: any) => {
    setEditFormData({
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      phone: employee.phoneNumber || '',
      position: employee.position || '',
      department: employee.department || ''
    });
    setIsEditPopupOpen(true);
  };

  // Handle Edit Form Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          position: editFormData.position,
          department: editFormData.department
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Employee updated successfully!' 
        });
        setIsEditPopupOpen(false);
        fetchEmployees(); // Refresh the employee list
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to update employee' 
        });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    }
  };

  // Handle Delete - Step 1: Show first confirmation
  const handleDelete = (employee: any) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmStep(1);
    setIsDeleteDialogOpen(true);
  };

  // Handle Delete - Step 2: Show second confirmation
  const handleDeleteConfirmStep1 = () => {
    setDeleteConfirmStep(2);
  };

  // Handle Delete - Final: Execute deletion
  const handleDeleteConfirmStep2 = async () => {
    setMessage({ type: '', text: '' });

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Employee deleted successfully!' 
        });
        setIsDeleteDialogOpen(false);
        setEmployeeToDelete(null);
        setDeleteConfirmStep(1);
        fetchEmployees(); // Refresh the employee list
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to delete employee' 
        });
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
      setIsDeleteDialogOpen(false);
    }
  };

  // Cancel delete operation
  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
    setDeleteConfirmStep(1);
  };

  // Handle Resend Activation Email
  const handleResendEmail = async (employeeId: number, employeeEmail: string) => {
    setMessage({ type: '', text: '' });

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees/${employeeId}/resend-activation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: `Activation email resent successfully to ${employeeEmail}!` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to resend activation email' 
        });
      }
    } catch (error) {
      console.error('Error resending activation email:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const response = await fetch(`${API_URL}/api/admin/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Employee added successfully! Activation email sent to ' + formData.email 
        });
        setIsPopupOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          position: '',
          department: ''
        });
        fetchEmployees(); // Refresh the employee list
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to add employee' 
        });
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    }
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <Sidebar activeItem="Employees" />

      {/* Main Content */}
      <div className='flex-1 flex flex-col'>
        <Navbar />
        <div className='flex-1 p-8 bg-gray-50 relative overflow-y-auto'>
          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold text-gray-800'>Employee Management</h1>
          <button
            onClick={() => setIsPopupOpen(true)}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md'
          >
            + Add New Employee
          </button>
        </div>

        {/* Professional Search Bar and Export Section */}
        <div className='rounded-lg p-4 mb-4'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search employees by name, email, phone, position, or department..."
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

        {/* Employee Table */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-indigo-600 text-white'>
              <tr>
                <th className='px-4 py-4 text-left'>
                  <Checkbox
                    checked={filteredEmployees.length > 0 && selectedRows.length === filteredEmployees.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredEmployees.length}
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
                <th className='px-6 py-4 text-left'><p className='text-white'>ID</p></th>
                <th className='px-6 py-4 text-left'><p className='text-white'>Name</p></th>
                <th className='px-6 py-4 text-left'><p className='text-white'>Email</p></th>
                <th className='px-6 py-4 text-left'><p className='text-white'>Phone</p></th>
                <th className='px-6 py-4 text-left'><p className='text-white'>Position</p></th>
                <th className='px-6 py-4 text-left'><p className='text-white'>Department</p></th>
                <th className='px-6 py-4 text-center'><p className='text-white'>Actions</p></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500'>
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500'>
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr 
                    key={employee.id} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-colors`}
                  >
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(employee.id)}
                        onChange={() => handleSelectRow(employee.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#6366f1',
                          '&.Mui-checked': {
                            color: '#6366f1',
                          },
                        }}
                      />
                    </td>
                    <td className='px-6 py-4 text-gray-700'>{employee.id}</td>
                    <td className='px-6 py-4 font-medium text-gray-900'>
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td className='px-6 py-4 text-gray-700'>{employee.email}</td>
                    <td className='px-6 py-4 text-gray-700'>{employee.phoneNumber || 'N/A'}</td>
                    <td className='px-6 py-4 text-gray-700'>{employee.position || 'N/A'}</td>
                    <td className='px-6 py-4 text-gray-700'>{employee.department || 'N/A'}</td>
                    <td className='px-6 py-4'>
                      <div className='flex gap-2 justify-center'>
                        <Tooltip title="Edit Employee">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(employee);
                            }}
                            size="small"
                            sx={{
                              color: '#3b82f6',
                              '&:hover': {
                                backgroundColor: '#dbeafe',
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Resend Activation Email">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendEmail(employee.id, employee.email);
                            }}
                            size="small"
                            sx={{
                              color: '#10b981',
                              '&:hover': {
                                backgroundColor: '#d1fae5',
                              },
                            }}
                          >
                            <EmailIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Employee">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(employee);
                            }}
                            size="small"
                            sx={{
                              color: '#ef4444',
                              '&:hover': {
                                backgroundColor: '#fee2e2',
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Employee Popup */}
        {isPopupOpen && (
          <>
            {/* Backdrop blur overlay */}
            <div 
              className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
              onClick={() => setIsPopupOpen(false)}
            ></div>
            
            {/* Popup Modal */}
            <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
              <div className='bg-white rounded-lg p-8 w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl pointer-events-auto'>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
                >
                  <IoMdClose size={24} />
                </button>

                <h2 className='text-2xl font-bold mb-6 text-gray-800'>Add New Employee</h2>

                <form onSubmit={handleSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Full Name</label>
                    <input
                      type='text'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Email</label>
                    <input
                      type='email'
                      name='email'
                      value={formData.email}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Phone</label>
                    <input
                      type='tel'
                      name='phone'
                      value={formData.phone}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Position</label>
                    <input
                      type='text'
                      name='position'
                      value={formData.position}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Department</label>
                    <select
                      name='department'
                      value={formData.department}
                      onChange={handleInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    >
                      <option value=''>Select Department</option>
                      <option value='Operations'>Operations</option>
                      <option value='Service'>Service</option>
                      <option value='Front Desk'>Front Desk</option>
                      <option value='Management'>Management</option>
                      <option value='Finance'>Finance</option>
                    </select>
                  </div>

                  <div className='flex gap-4 mt-6'>
                    <button
                      type='submit'
                      className='flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors'
                    >
                      Add Employee
                    </button>
                    <button
                      type='button'
                      onClick={() => setIsPopupOpen(false)}
                      className='flex-1 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Edit Employee Popup */}
        {isEditPopupOpen && (
          <>
            {/* Backdrop blur overlay */}
            <div 
              className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
              onClick={() => setIsEditPopupOpen(false)}
            ></div>
            
            {/* Popup Modal */}
            <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
              <div className='bg-white rounded-lg p-8 w-[500px] max-h-[90vh] overflow-y-auto relative shadow-2xl pointer-events-auto'>
                <button
                  onClick={() => setIsEditPopupOpen(false)}
                  className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
                >
                  <IoMdClose size={24} />
                </button>

                <h2 className='text-2xl font-bold mb-6 text-gray-800'>Edit Employee</h2>

                <form onSubmit={handleEditSubmit} className='space-y-4'>
                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Full Name</label>
                    <input
                      type='text'
                      name='name'
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Email</label>
                    <input
                      type='email'
                      name='email'
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Phone</label>
                    <input
                      type='tel'
                      name='phone'
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Position</label>
                    <input
                      type='text'
                      name='position'
                      value={editFormData.position}
                      onChange={handleEditInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-gray-700 font-semibold mb-2'>Department</label>
                    <select
                      name='department'
                      value={editFormData.department}
                      onChange={handleEditInputChange}
                      className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-1000'
                      required
                    >
                      <option value=''>Select Department</option>
                      <option value='Operations'>Operations</option>
                      <option value='Service'>Service</option>
                      <option value='Front Desk'>Front Desk</option>
                      <option value='Management'>Management</option>
                      <option value='Finance'>Finance</option>
                    </select>
                  </div>

                  <div className='flex gap-4 mt-6'>
                    <button
                      type='submit'
                      className='flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors'
                    >
                      Update Employee
                    </button>
                    <button
                      type='button'
                      onClick={() => setIsEditPopupOpen(false)}
                      className='flex-1 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors'
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Dialog - Two-Factor */}
        {isDeleteDialogOpen && employeeToDelete && (
          <>
            {/* Backdrop blur overlay */}
            <div 
              className='fixed inset-0 backdrop-blur-sm bg-black/30 z-40'
              onClick={handleDeleteCancel}
            ></div>
            
            {/* Dialog Modal */}
            <div className='fixed inset-0 flex justify-center items-center z-50 pointer-events-none'>
              <div className='bg-white rounded-lg p-8 w-[500px] relative shadow-2xl pointer-events-auto'>
                
                {deleteConfirmStep === 1 ? (
                  // Step 1: First Confirmation
                  <>
                    <div className='flex items-center justify-center mb-4'>
                      <div className='bg-red-100 p-3 rounded-full'>
                        <DeleteIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <h2 className='text-2xl font-bold mb-4 text-gray-800 text-center'>Delete Employee?</h2>
                    
                    <div className='mb-6 text-gray-600 text-center'>
                      <p className='mb-2'>Are you sure you want to delete:</p>
                      <p className='font-semibold text-gray-800 text-lg'>
                        {employeeToDelete.firstName} {employeeToDelete.lastName}
                      </p>
                      <p className='text-sm text-gray-500'>{employeeToDelete.email}</p>
                    </div>

                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
                      <p className='text-sm text-yellow-800'>
                        ⚠️ This action requires confirmation. You will need to confirm again in the next step.
                      </p>
                    </div>

                    <div className='flex gap-4'>
                      <button
                        onClick={handleDeleteCancel}
                        className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirmStep1}
                        className='flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors'
                      >
                        Continue
                      </button>
                    </div>
                  </>
                ) : (
                  // Step 2: Final Confirmation
                  <>
                    <div className='flex items-center justify-center mb-4'>
                      <div className='bg-red-100 p-3 rounded-full'>
                        <DeleteIcon sx={{ color: '#ef4444', fontSize: 40 }} />
                      </div>
                    </div>
                    
                    <h2 className='text-2xl font-bold mb-4 text-red-600 text-center'>Final Confirmation</h2>
                    
                    <div className='mb-6 text-gray-600 text-center'>
                      <p className='mb-2'>You are about to permanently delete:</p>
                      <p className='font-semibold text-gray-800 text-lg'>
                        {employeeToDelete.firstName} {employeeToDelete.lastName}
                      </p>
                      <p className='text-sm text-gray-500 mb-4'>{employeeToDelete.email}</p>
                    </div>

                    <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                      <p className='text-sm text-red-800 font-semibold mb-2'>
                        ⚠️ WARNING: This action cannot be undone!
                      </p>
                      <p className='text-sm text-red-700'>
                        All employee data will be permanently removed from the system.
                      </p>
                    </div>

                    <div className='flex gap-4'>
                      <button
                        onClick={handleDeleteCancel}
                        className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteConfirmStep2}
                        className='flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors'
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default EmployeesPage
