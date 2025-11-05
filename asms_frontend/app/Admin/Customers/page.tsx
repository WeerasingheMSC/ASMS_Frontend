'use client'
import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { TextField, InputAdornment, IconButton, Tooltip, Checkbox } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClearIcon from '@mui/icons-material/Clear';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      console.log('Fetching customers with token:', user.token ? 'Token exists' : 'No token');
      
      const response = await fetch(`${API_URL}/api/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customers data:', data);
        setCustomers(data);
      } else if (response.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/signin';
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        setMessage({ type: 'error', text: errorData.message || 'Failed to load customers' });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setMessage({ type: 'error', text: 'Failed to load customers' });
    } finally {
      setLoading(false);
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    return fullName.includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.phoneNumber && customer.phoneNumber.includes(searchQuery)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower));
  });

  // Handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(filteredCustomers.map(cust => cust.id));
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
      ? customers.filter(cust => selectedRows.includes(cust.id))
      : filteredCustomers;

    const exportData = dataToExport.map(customer => ({
      ID: customer.id,
      'First Name': customer.firstName,
      'Last Name': customer.lastName,
      Email: customer.email,
      Phone: customer.phoneNumber || 'N/A',
      Address: customer.address || 'N/A',
      'Account Status': customer.isActive ? 'Active' : 'Inactive',
      'Registered Date': new Date(customer.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    
    saveAs(data, `customers_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Toggle customer status (activate/deactivate)
  const handleToggleStatus = async (customerId: number, currentStatus: boolean) => {
    setMessage({ type: '', text: '' });

    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/signin';
        return;
      }

      const user = JSON.parse(userData);
      const endpoint = currentStatus 
        ? `${API_URL}/api/admin/users/${customerId}/deactivate`
        : `${API_URL}/api/admin/users/${customerId}/activate`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: `Customer ${currentStatus ? 'deactivated' : 'activated'} successfully!` 
        });
        fetchCustomers(); // Refresh the customer list
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to update customer status' 
        });
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    }
  };

  return (
    <div className='flex h-screen overflow-hidden'>
      {/* Sidebar */}
      <Sidebar activeItem="Customers" />

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

          <div className='flex-1 bg-gray-50 relative overflow-y-auto'>
             <div className='flex justify-between items-center mb-6'>
            <h1 className='text-3xl font-bold text-gray-800'>Customer Management</h1>
            {/* Summary Stats */}
           <div className='flex gap-4'>
          <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Total Customers: </span>
              <span className='font-bold text-blue-600'>{customers.length}</span>
            </div>
             <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Active Customers: </span>
              <span className='font-bold text-green-600'>{customers.filter(c => c.isActive).length}</span>
            </div>
             <div className='bg-white px-4 py-2 rounded-lg shadow-md'>
              <span className='text-sm text-gray-600'>Inactive Customers:</span>
              <span className='font-bold text-red-600'> {customers.filter(c => !c.isActive).length}</span>
            </div>
            </div>
            </div>
          </div>

          {/* Professional Search Bar and Export Section */}
          <div className='rounded-lg p-4 mb-4'>
          <div className='flex gap-4 items-center'>
            <div className='flex-1'>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search customers by name, email, phone, or address..."
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

        

        {/* Customer Table */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <table className='w-full'>
            <thead className='bg-indigo-600'>
              <tr>
                <th className='px-4 py-4 text-left text-white font-semibold'>
                  <Checkbox
                    checked={filteredCustomers.length > 0 && selectedRows.length === filteredCustomers.length}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < filteredCustomers.length}
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
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>ID</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Name</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Email</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Phone</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Address</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Status</p></th>
                <th className='px-6 py-4 text-left font-semibold'><p className='text-white'>Registered Date</p></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500'>
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-gray-500'>
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr 
                    key={customer.id} 
                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-colors`}
                  >
                    <td className='px-4 py-4'>
                      <Checkbox
                        checked={selectedRows.includes(customer.id)}
                        onChange={() => handleSelectRow(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          color: '#6366f1',
                          '&.Mui-checked': {
                            color: '#6366f1',
                          },
                        }}
                      />
                    </td>
                    <td className='px-6 py-4 text-gray-700'>{customer.id}</td>
                    <td className='px-6 py-4 font-medium text-gray-900'>
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className='px-6 py-4 text-gray-700'>{customer.email}</td>
                    <td className='px-6 py-4 text-gray-700'>{customer.phoneNumber || 'N/A'}</td>
                    <td className='px-6 py-4 text-gray-700'>{customer.address || 'N/A'}</td>
                    <td className='px-6 py-4'>
                      <select
                        value={customer.isActive ? 'Active' : 'Inactive'}
                        onChange={(e) => {
                          const newStatus = e.target.value === 'Active';
                          if (newStatus !== customer.isActive) {
                            handleToggleStatus(customer.id, customer.isActive);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold cursor-pointer transition-all ${
                          customer.isActive 
                            ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' 
                            : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className='px-6 py-4 text-gray-700'>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  )
}

export default CustomersPage
