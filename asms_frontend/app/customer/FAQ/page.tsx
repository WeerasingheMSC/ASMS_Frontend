'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ChatBot from '../components/ChatBot';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Close,
  CheckCircle,
  Chat,
  Search,
  ExpandMore,
} from '@mui/icons-material';

interface FAQ {
  id: number;
  category: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AnsweredQuestion {
  id: number;
  fullName: string;
  email: string;
  category: string;
  question: string;
  answer: string;
  answeredAt: string;
  createdAt: string;
}

export default function FAQPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnsweredQuestions, setLoadingAnsweredQuestions] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    category: '',
    question: '',
  });
  const [attachment, setAttachment] = useState<{name: string; preview: string; file: File} | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = ['All', 'Appointments', 'Payments', 'Services', 'Other'];

  // Fetch FAQs and answered questions on mount and poll every 30 seconds
  useEffect(() => {
    fetchFAQs();
    fetchAnsweredQuestions();
    const interval = setInterval(() => {
      fetchFAQs();
      fetchAnsweredQuestions();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchFAQs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customer/faqs`);
      if (response.ok) {
        const data = await response.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnsweredQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/customer/my-questions/answered`);
      if (response.ok) {
        const data = await response.json();
        setAnsweredQuestions(data);
      }
    } catch (error) {
      console.error('Error fetching answered questions:', error);
    } finally {
      setLoadingAnsweredQuestions(false);
    }
  };

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

  const handleSubmit = async () => {
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

    setUploading(true);
    let attachmentUrl = null;

    try {
      // Upload image to Cloudinary if attachment exists
      if (attachment?.file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', attachment.file);
        formDataUpload.append('upload_preset', 'ml_default'); // You'll need to create this preset in Cloudinary
        
        try {
          const cloudinaryResponse = await fetch(
            'https://api.cloudinary.com/v1_1/dvkqmlqow/image/upload', // Replace with your cloud name
            {
              method: 'POST',
              body: formDataUpload,
            }
          );

          if (cloudinaryResponse.ok) {
            const cloudinaryData = await cloudinaryResponse.json();
            attachmentUrl = cloudinaryData.secure_url;
          } else {
            console.error('Failed to upload image to Cloudinary');
            // Continue anyway - attachment is optional
          }
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          // Continue anyway - attachment is optional
        }
      }

      // Submit question with Cloudinary URL (or null if no attachment)
      const requestBody = {
        fullName: formData.fullName,
        email: formData.email,
        category: formData.category,
        question: formData.question,
        attachmentUrl: attachmentUrl,
      };
      
      console.log('Submitting question:', requestBody);

      const response = await fetch(`${API_URL}/api/customer/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Question submitted successfully:', result);
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
      } else {
        let errorMessage = `Failed to submit question: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          // Handle validation errors (field-specific errors)
          if (typeof errorData === 'object' && !errorData.error && !errorData.message) {
            errorMessage = 'Validation errors:\n' + 
              Object.entries(errorData).map(([field, msg]) => `- ${field}: ${msg}`).join('\n');
          } 
          // Handle general error messages
          else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (textError) {
            console.error('Could not parse error response');
          }
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('An error occurred while submitting your question. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowSuccess(false);
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({...errors, attachment: 'File size must be less than 5MB'});
        return;
      }
      
      setAttachment({
        name: file.name,
        preview: URL.createObjectURL(file),
        file: file
      });
      setErrors({...errors, attachment: ''});
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className='flex'>
      <Sidebar activeItem='FAQ' />
      <div className='flex-1 ml-[16.666667%] bg-gray-50'>
        <Navbar />
        <Container maxWidth="lg" className="py-6 pt-24">
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

          {loading ? (
            <Paper className="text-center py-20" elevation={1}>
              <Typography className="text-gray-500">Loading FAQs...</Typography>
            </Paper>
          ) : filteredFAQs.length === 0 ? (
            <Paper className="text-center py-20" elevation={1}>
              <Chat sx={{ fontSize: 64, color: '#d1d5db', mx: 'auto', mb: 2 }} />
              <Typography variant="h5" className="font-semibold text-gray-600 mb-2">
                No FAQs available yet
              </Typography>
              <br></br>
              <Typography className="text-gray-500">
                {searchQuery || selectedCategory !== 'All' 
                  ? 'No FAQs match your search criteria'
                  : 'FAQs will appear here once added by the admin'}
              </Typography>
            </Paper>
          ) : (
            <Box className="space-y-3">
              {filteredFAQs.map((faq) => (
                <Accordion 
                  key={faq.id}
                  expanded={expandedFAQ === faq.id}
                  onChange={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  elevation={1}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box>
                      <Typography className="font-medium text-gray-800 mb-2">
                        {faq.question}
                      </Typography>
                      <Chip 
                        label={faq.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography className="text-gray-700">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          {/* Community Q&A Section */}
          {answeredQuestions.length > 0 && (
            <Box className="mt-12">
              <Typography variant="h5" className="font-bold text-gray-800 mb-4">
                💬 Community Q&A
              </Typography>
              <Typography className="text-gray-600 mb-4">
                Questions from our customers answered by our team
              </Typography>
              
              <Box className="space-y-3">
                {answeredQuestions.map((question) => (
                  <Accordion key={question.id} elevation={1}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box>
                        <Typography className="font-medium text-gray-800 mb-2">
                          {question.question}
                        </Typography>
                        <Box className="flex gap-2 items-center">
                          <Chip 
                            label={question.category} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                          <Typography className="text-xs text-gray-500">
                            Asked by {question.fullName}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box className="space-y-3">
                        <Box className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <Typography className="text-sm font-medium text-blue-900 mb-2">
                            ✓ Answer from Admin Team
                          </Typography>
                          <Typography className="text-gray-700">
                            {question.answer}
                          </Typography>
                          <Typography className="text-xs text-gray-500 mt-2">
                            Answered on {new Date(question.answeredAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          )}

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
                disabled={!isFormValid() || uploading}
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
                {uploading ? 'Uploading...' : 'Submit Question'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCloseModal}
                disabled={uploading}
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
      
      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
}