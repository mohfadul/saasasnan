import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, patientsApi } from '../../services/api';
import { CreateAppointmentRequest, AppointmentStatus } from '../../types';
import { format, addMinutes } from 'date-fns';

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    clinicId: '550e8400-e29b-41d4-a716-446655440001', // Main Clinic UUID
    patientId: '',
    providerId: '550e8400-e29b-41d4-a716-446655440003', // Default to Dr. Sarah Johnson
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
    appointmentType: 'Check-up',
    reason: '',
    status: AppointmentStatus.SCHEDULED,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  // Fetch patients for dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getPatients(),
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment-stats'] });
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

    if (!formData.patientId) {
      newErrors.patientId = 'Patient is required';
    }
    if (!formData.providerId) {
      newErrors.providerId = 'Provider is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setApiError('');
    console.log('Submitting appointment data:', formData);

    try {
      await createAppointmentMutation.mutateAsync(formData);
    } catch (error: any) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleChange = (field: keyof CreateAppointmentRequest, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Schedule Appointment</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Patient <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.patientId ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.demographics.firstName} {patient.demographics.lastName}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1 text-sm text-red-600">{errors.patientId}</p>
            )}
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.providerId}
              onChange={(e) => handleChange('providerId', e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="550e8400-e29b-41d4-a716-446655440003">Dr. Sarah Johnson</option>
              <option value="550e8400-e29b-41d4-a716-446655440004">Dr. Michael Chen</option>
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => {
                  handleChange('startTime', e.target.value);
                  // Auto-update end time to 30 minutes later
                  const start = new Date(e.target.value);
                  handleChange('endTime', format(addMinutes(start, 30), "yyyy-MM-dd'T'HH:mm"));
                }}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Appointment Type and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.appointmentType}
                onChange={(e) => handleChange('appointmentType', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Check-up">Check-up</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Emergency">Emergency</option>
                <option value="Surgery">Surgery</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Reason for visit"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAppointmentMutation.isPending}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAppointmentMutation.isPending ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>

          {(createAppointmentMutation.isError || apiError) && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">
                Error creating appointment:
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

