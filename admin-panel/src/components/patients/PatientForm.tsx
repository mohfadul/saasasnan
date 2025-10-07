import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '../../services/api';
import { CreatePatientRequest } from '../../types';

interface PatientFormProps {
  clinicId: string;
  patient?: any; // For editing existing patient
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({ clinicId, patient, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!patient;
  
  // Debug: Check if we have auth token
  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    // Check if user is authenticated
    if (!token) {
      console.warn('No auth token found');
    }
  }, [clinicId, isEditMode]);
  
  const [formData, setFormData] = useState<CreatePatientRequest>({
    clinicId,
    demographics: {
      firstName: patient?.demographics?.firstName || '',
      lastName: patient?.demographics?.lastName || '',
      dateOfBirth: patient?.demographics?.dateOfBirth || '',
      gender: patient?.demographics?.gender || '',
      phone: patient?.demographics?.phone || '',
      email: patient?.demographics?.email || '',
      address: patient?.demographics?.address || {},
    },
    tags: patient?.tags || [],
    consentFlags: patient?.consentFlags || {},
    medicalAlertFlags: patient?.medicalAlertFlags || {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const createPatientMutation = useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsApi.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Full error object:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setApiError(`Error: ${errorMessage}`);
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: (data: Partial<CreatePatientRequest>) => patientsApi.updatePatient(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error('Full error object:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setApiError(`Error: ${errorMessage}`);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.demographics.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.demographics.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.demographics.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (formData.demographics.email && !/\S+@\S+\.\S+/.test(formData.demographics.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setApiError(''); // Clear previous errors
    
    // Ensure all required fields are present and clean empty optional fields
    const submitData: CreatePatientRequest = {
      clinicId: formData.clinicId,
      demographics: {
        firstName: formData.demographics.firstName.trim(),
        lastName: formData.demographics.lastName.trim(),
        dateOfBirth: formData.demographics.dateOfBirth,
        ...(formData.demographics.gender && { gender: formData.demographics.gender }),
        ...(formData.demographics.phone && { phone: formData.demographics.phone }),
        ...(formData.demographics.email && { email: formData.demographics.email }),
        ...(formData.demographics.address && Object.keys(formData.demographics.address).length > 0 && { address: formData.demographics.address }),
      },
      ...(formData.patientExternalId && { patientExternalId: formData.patientExternalId }),
      ...(formData.tags && formData.tags.length > 0 && { tags: formData.tags }),
      ...(formData.consentFlags && Object.keys(formData.consentFlags).length > 0 && { consentFlags: formData.consentFlags }),
      ...(formData.medicalAlertFlags && Object.keys(formData.medicalAlertFlags).length > 0 && { medicalAlertFlags: formData.medicalAlertFlags }),
    };

    try {
      if (isEditMode) {
        // Update existing patient
        await updatePatientMutation.mutateAsync(submitData);
      } else {
        // Create new patient
        await createPatientMutation.mutateAsync(submitData);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field.startsWith('demographics.')) {
      const demographicField = field.split('.')[1];
      setFormData({
        ...formData,
        demographics: {
          ...formData.demographics,
          [demographicField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Patient' : 'Add New Patient'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.demographics.firstName}
                onChange={(e) => handleChange('demographics.firstName', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.demographics.lastName}
                onChange={(e) => handleChange('demographics.lastName', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.demographics.dateOfBirth}
                onChange={(e) => handleChange('demographics.dateOfBirth', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                value={formData.demographics.gender}
                onChange={(e) => handleChange('demographics.gender', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer Not to Say</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={formData.demographics.phone}
                onChange={(e) => handleChange('demographics.phone', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.demographics.email}
                onChange={(e) => handleChange('demographics.email', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPatientMutation.isPending || updatePatientMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode 
                ? (updatePatientMutation.isPending ? 'Updating...' : 'Update Patient')
                : (createPatientMutation.isPending ? 'Creating...' : 'Create Patient')
              }
            </button>
          </div>

          {((createPatientMutation.isError || updatePatientMutation.isError) || apiError) && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Error {isEditMode ? 'updating' : 'creating'} patient:
              </p>
              <p className="text-sm text-red-700">
                {apiError || 'Unknown error. Please check the console for details.'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

