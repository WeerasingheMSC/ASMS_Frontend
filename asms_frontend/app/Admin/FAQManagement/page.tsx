'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp, Eye, CheckCircle, X, MessageSquare, ArrowLeft } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

interface CustomerQuestion {
  id: number;
  fullName: string;
  email: string;
  category: string;
  question: string;
  submittedAt: string;
  status: string;
}

interface FormErrors {
  question?: string;
  answer?: string;
  category?: string;
}

function AdminFAQManagement() {
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [customerQuestions, setCustomerQuestions] = useState<CustomerQuestion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [viewQuestionModal, setViewQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<CustomerQuestion | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const categories = ['All', 'Appointments', 'Payments', 'Services', 'Other'];

  useEffect(() => {
    loadFAQs();
    loadCustomerQuestions();
  }, []);

  const loadFAQs = async () => {
    try {
      const result = localStorage.getItem('admin-faqs');
      if (result) {
        setFaqs(JSON.parse(result));
      }
    } catch (error) {
      console.log('No existing FAQs');
    }
  };

  const loadCustomerQuestions = async () => {
    try {
      const result = localStorage.getItem('customer-questions');
      if (result) {
        setCustomerQuestions(JSON.parse(result));
      }
    } catch (error) {
      console.log('No existing questions');
    }
  };

  const saveFAQs = async (updatedFAQs: FAQ[]) => {
    try {
      localStorage.setItem('admin-faqs', JSON.stringify(updatedFAQs));
    } catch (error) {
      console.error('Error saving FAQs:', error);
    }
  };

  const saveCustomerQuestions = async (updatedQuestions: CustomerQuestion[]) => {
    try {
      localStorage.setItem('customer-questions', JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

  // Customer Preview Component
  const CustomerPreview = () => {
    const [previewSearch, setPreviewSearch] = useState('');
    const [previewCategory, setPreviewCategory] = useState('All');
    const [expandedPreviewFAQ, setExpandedPreviewFAQ] = useState<number | null>(null);

    const previewFilteredFAQs = faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(previewSearch.toLowerCase()) ||
                           faq.answer.toLowerCase().includes(previewSearch.toLowerCase());
      const matchesCategory = previewCategory === 'All' || faq.category === previewCategory;
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
         
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
          >
            <ArrowLeft size={25} />  
          </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Customer View Preview</h2>
                <p className="text-sm text-gray-600">This is how customers see the FAQs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Frequently Asked Questions
                </h1>
                <p className="text-gray-600">
                  Find answers to common questions about our services
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={previewCategory}
                onChange={(e) => setPreviewCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {previewFilteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-20 text-center">
              <MessageSquare className="mx-auto mb-4 text-gray-300" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No FAQs available yet</h3>
              <p className="text-gray-500">
                {previewSearch || previewCategory !== 'All' 
                  ? 'No FAQs match your search criteria'
                  : 'FAQs will appear here once added by the admin'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {previewFilteredFAQs.map((faq) => (
                <div key={faq.id} className="bg-white rounded-lg shadow relative group">
                  <button
                    onClick={() => setExpandedPreviewFAQ(expandedPreviewFAQ === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left flex items-start gap-3 hover:bg-gray-50"
                  >
                    {expandedPreviewFAQ === faq.id ? (
                      <ChevronUp className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                    ) : (
                      <ChevronDown className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{faq.question}</h3>
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {faq.category}
                      </span>
                    </div>
                  </button>
                  
                  {/* Edit Button - Shows on Hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewMode(false);
                      handleOpenModal(faq);
                    }}
                    className="absolute top-4 right-4 p-2 bg-blue-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-blue-700 flex items-center gap-2"
                    title="Edit FAQ"
                  >
                    <Edit2 size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  
                  {expandedPreviewFAQ === faq.id && (
                    <div className="px-4 pb-4 pl-11 text-gray-700 border-t pt-4">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleOpenModal = (faq: FAQ | null = null) => {
    if (faq) {
      setIsEditMode(true);
      setSelectedFAQ(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      });
    } else {
      setIsEditMode(false);
      setSelectedFAQ(null);
      setFormData({
        question: '',
        answer: '',
        category: '',
      });
    }
    setIsModalOpen(true);
    setErrors({});
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      question: '',
      answer: '',
      category: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    let updatedFAQs;
    
    if (isEditMode && selectedFAQ) {
      updatedFAQs = faqs.map(faq =>
        faq.id === selectedFAQ.id
          ? { ...faq, ...formData }
          : faq
      );
      setSuccessMessage('FAQ updated successfully!');
    } else {
      const newFAQ = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      updatedFAQs = [...faqs, newFAQ];
      setSuccessMessage('FAQ created successfully!');
    }
    
    setFaqs(updatedFAQs);
    await saveFAQs(updatedFAQs);
    
    setShowSuccess(true);
    setIsModalOpen(false);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      const updatedFAQs = faqs.filter(faq => faq.id !== id);
      setFaqs(updatedFAQs);
      await saveFAQs(updatedFAQs);
      
      setSuccessMessage('FAQ deleted successfully!');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleViewQuestion = (question: CustomerQuestion) => {
    setSelectedQuestion(question);
    setViewQuestionModal(true);
  };

  const handleMarkAsResolved = async (id: number) => {
    const updatedQuestions = customerQuestions.map(q =>
      q.id === id ? { ...q, status: 'resolved' } : q
    );
    setCustomerQuestions(updatedQuestions);
    await saveCustomerQuestions(updatedQuestions);
    setViewQuestionModal(false);
    
    setSuccessMessage('Question marked as resolved!');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || faq.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (previewMode) {
    return <CustomerPreview />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FAQ Management</h1>
          <p className="text-gray-600">Manage FAQs and customer questions</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === 'faqs'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('faqs')}
              >
                <MessageSquare size={20} />
                Manage FAQs
              </button>
              <button
                className={`px-6 py-3 font-medium flex items-center gap-2 ${
                  activeTab === 'questions'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('questions')}
              >
                <Eye size={20} />
                Customer Questions
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'faqs' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye size={20} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={20} />
                    Add FAQ
                  </button>
                </div>

                {filteredFAQs.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-20 text-center">
                    <MessageSquare className="mx-auto mb-4 text-gray-300" size={64} />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No FAQs found</h3>
                    <p className="text-gray-500">Click &quot;Add FAQ&quot; to create your first FAQ</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFAQs.map((faq) => (
                      <div key={faq.id} className="bg-white rounded-lg shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <button
                                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                className="w-full text-left flex items-start gap-3"
                              >
                                {expandedFAQ === faq.id ? (
                                  <ChevronUp className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                                ) : (
                                  <ChevronDown className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-800">{faq.question}</h3>
                                  <div className="flex gap-2 mt-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                      {faq.category}
                                    </span>
                                    <span className="text-gray-500 text-sm">
                                      Created: {faq.createdAt}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleOpenModal(faq)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(faq.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          {expandedFAQ === faq.id && (
                            <div className="mt-4 pl-9 text-gray-700 border-t pt-4">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'questions' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {customerQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      No customer questions yet
                    </td>
                  </tr>
                    ) : (
                      customerQuestions.map((question) => (
                        <tr key={question.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {question.fullName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {question.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {question.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {question.submittedAt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                question.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {question.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleViewQuestion(question)}
                              className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(5px)' }}>
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Edit FAQ' : 'Add New FAQ'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value });
                        setErrors({ ...errors, category: '' });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                  <option value="">Select a category</option>
                  <option value="Appointments">Appointments</option>
                  <option value="Payments">Payments</option>
                  <option value="Services">Services</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={formData.question}
                      onChange={(e) => {
                        setFormData({ ...formData, question: e.target.value });
                        setErrors({ ...errors, question: '' });
                      }}
                      rows={2}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.question ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.question && (
                      <p className="text-red-600 text-sm mt-1">{errors.question}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer *
                    </label>
                    <textarea
                      value={formData.answer}
                      onChange={(e) => {
                        setFormData({ ...formData, answer: e.target.value });
                        setErrors({ ...errors, answer: '' });
                      }}
                      rows={5}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.answer ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.answer && (
                      <p className="text-red-600 text-sm mt-1">{errors.answer}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {isEditMode ? 'Update FAQ' : 'Create FAQ'}
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewQuestionModal && selectedQuestion && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backdropFilter: 'blur(5px)' }}>
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Customer Question</h2>
                  <button
                    onClick={() => setViewQuestionModal(false)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-800">{selectedQuestion.fullName}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-800">{selectedQuestion.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {selectedQuestion.category}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Question</p>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedQuestion.question}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full ${
                        selectedQuestion.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {selectedQuestion.status}
                    </span>
                  </div>

                  {selectedQuestion.status !== 'resolved' && (
                    <button
                      onClick={() => handleMarkAsResolved(selectedQuestion.id)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 mt-4"
                    >
                      <CheckCircle size={20} />
                      Mark as Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showSuccess && (
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backdropFilter: 'blur(3px)', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
              <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
                <CheckCircle className="mx-auto mb-4 text-green-500" size={60} />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{successMessage}</h3>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default function FAQManagementPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="FAQManagement" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <AdminFAQManagement />
        </main>
      </div>
    </div>
  );
}
