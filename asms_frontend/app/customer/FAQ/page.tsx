'use client';

import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Box,
  Typography,
  Paper,
  Container,
  InputAdornment,
  Chip,
  Modal,
  Backdrop,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Close,
  CheckCircle,
  Chat,
  Search,
} from '@mui/icons-material';

export default function FAQPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    category: '',
    question: '',
  });
  const [attachment, setAttachment] = useState<{name: string; preview: string} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Appointments', 'Payments', 'Services', 'Other'];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      validateEmail(formData.email) &&
      formData.category !== '' &&
      formData.question.trim() !== ''
    );
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        category: '',
        question: '',
      });
      setAttachment(null);
      setErrors({});
    }, 3000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSuccess(false);
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        preview: URL.createObjectURL(file)
      });
    }
  };

  return (
    <div className='flex'>
      <Sidebar activeItem='FAQ' />
      <div className='flex-1 ml-[16.666667%] bg-gray-50'>
        <Navbar />
        <Container maxWidth="lg" className="py-6">
          <Box className="mb-8">
            <Box className="flex justify-between items-start mb-6">
              <Box>
                <h1 className="font-bold  text-3xl  text-gray-800">
                  Frequently Asked Questions
                </h1>
                <br></br>
                <Typography className="text-gray-600">
                  Find answers to common questions about our services
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<Chat />}
                onClick={() => setIsModalOpen(true)}
                sx={{ 
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  fontWeight: 500,
                  boxShadow: 2,
                }}
              >
                Ask a Question
              </Button>
            </Box>

            <Box className="flex gap-2 mb-4">
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search className="text-gray-400" />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  variant="outlined"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Paper className="text-center py-20" elevation={1}>
            <Chat sx={{ fontSize: 64, color: '#d1d5db', mx: 'auto', mb: 2 }} />
            <Typography variant="h5" className="font-semibold text-gray-600 mb-2">
              No FAQs available yet
            </Typography>
            <br></br>
            <Typography className="text-gray-500">
              FAQs will appear here once added by the admin
            </Typography>
          </Paper>

          <Paper className="mt-12 p-8 text-center bg-gradient-to-r from-blue-50 to-indigo-50" elevation={1}>
            <Typography variant="h5" className="font-semibold mb-2">
              🤔 Didn't find your answer?
            </Typography>
            <br></br>
            <Typography className="text-gray-600 mb-4">
              We're here to help! Submit your question and our team will get back to you.
            </Typography>
            <br></br>
            <Button
              variant="contained"
              startIcon={<Chat />}
              onClick={() => setIsModalOpen(true)}
              sx={{ textTransform: 'none', px: 3, py: 1.5, fontWeight: 500 }}
            >
              Ask a Question
            </Button>
          </Paper>
        </Container>
      </div>

      {/* Modal for Ask Question Form */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backdropFilter: 'blur(5px)' }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '55%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: '90%', md: '80%', lg: '70%' },
          height: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box className="p-6 border-b" sx={{ flexShrink: 0 }}>
              <h1 className="font-bold mb-2 text-gray-800 text-3xl">
                Reach Out to Us
              </h1>
              <Typography className="text-gray-600">
                Can't find the answer you're looking for? Submit your question and we'll get back to you as soon as possible.
              </Typography>
            </Box>
            
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              p: 3,
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#a1a1a1',
              },
            }}>
              <Box className="space-y-8">
            <TextField
              fullWidth
              label="Full Name"
              placeholder="John Doe"
              required
              value={formData.fullName}
              onChange={(e) => {
                setFormData({...formData, fullName: e.target.value});
                setErrors({...errors, fullName: ''});
              }}
              error={!!errors.fullName}
              helperText={errors.fullName}
              variant="outlined"
              sx={{ mb: 3 }}
            />
            

            <TextField
              fullWidth
              label="Email Address"
              placeholder="johndoe@example.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => {
                const email = e.target.value;
                setFormData({...formData, email: email});
                
                // Real-time email validation
                if (email.trim() === '') {
                  setErrors({...errors, email: ''});
                } else if (!validateEmail(email)) {
                  setErrors({...errors, email: 'Please enter a valid email address'});
                } else {
                  setErrors({...errors, email: ''});
                }
              }}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <FormControl fullWidth error={!!errors.category} required sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                label="Category"
                onChange={(e) => {
                  setFormData({...formData, category: e.target.value});
                  setErrors({...errors, category: ''});
                }}
              >
                <MenuItem value="">Select a category</MenuItem>
                <MenuItem value="Appointments">Appointments</MenuItem>
                <MenuItem value="Payments">Payments</MenuItem>
                <MenuItem value="Services">Services</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {errors.category && (
                <FormHelperText>{errors.category}</FormHelperText>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Your Question"
              required
              multiline
              rows={6}
              value={formData.question}
              onChange={(e) => {
                setFormData({...formData, question: e.target.value});
                setErrors({...errors, question: ''});
              }}
              error={!!errors.question}
              helperText={errors.question || 'Please provide detailed information about your question'}
              placeholder="Describe your question in detail..."
              variant="outlined"
              sx={{ mb: 3 }}
            />

            <Box>
              <Typography className="text-sm font-medium text-gray-700 mb-1">
                Attachment (Optional)
              </Typography>
              <Typography className="text-gray-500 text-sm mb-2">
                Upload a screenshot or image to help us understand your question better (Max 5MB)
              </Typography>
              <br></br>
              
              {!attachment ? (
                <label className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <CloudUpload />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <Box className="relative inline-block">
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="max-w-xs max-h-48 rounded border border-gray-300"
                  />
                  <IconButton
                    onClick={() => setAttachment(null)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'white',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                    size="small"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box className="flex gap-3 pt-4">
              <Button
                variant="contained"
                fullWidth
                disabled={!isFormValid()}
                onClick={handleSubmit}
                sx={{ 
                  textTransform: 'none',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&.Mui-disabled': {
                    backgroundColor: '#e0e0e0',
                    color: '#a0a0a0',
                  },
                }}
              >
                Submit Question
              </Button>
              <Button
                variant="outlined"
                onClick={handleCloseModal}
                sx={{ 
                  textTransform: 'none',
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  fontWeight: 500,
                }}
              >
                Cancel
              </Button>
            </Box>

                <Box className="mt-6 p-4 bg-blue-50 rounded">
                  <Typography className="text-gray-700 text-sm">
                    <strong>💡 Tip:</strong> The more details you provide, the better we can help you. Include any relevant information about your situation.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Success Popup */}
      <Modal
        open={showSuccess}
        onClose={() => {}}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { 
            backdropFilter: 'blur(3px)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: '400px' },
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 4,
          textAlign: 'center',
        }}>
          <CheckCircle sx={{ 
            fontSize: 60, 
            color: '#10b981', 
            mb: 2 
          }} />
          <Typography variant="h5" className="font-bold mb-2 text-gray-800">
            Question Submitted Successfully!
          </Typography>
          <Typography className="text-gray-600 mb-1">
            Thank you for your question. We'll review it and get back to you soon.
          </Typography>
          {/* <Typography className="text-gray-500 text-sm">
            This message will close automatically...
          </Typography> */}
        </Box>
      </Modal>
    </div>
  );
}