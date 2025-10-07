import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyPrescriptionsApi } from '../../services/pharmacy-api';
import { DoctorPrescription } from '../../types/pharmacy';
import { PrescriptionForm } from './PrescriptionForm';
import { formatCurrency } from '../../utils/currency.utils';
import { formatDate } from '../../utils/date.utils';

export const PrescriptionTable: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState<DoctorPrescription | undefined>();
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['pharmacy-prescriptions', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () => pharmacyPrescriptionsApi.getPrescriptions(undefined, statusFilter === 'all' ? undefined : statusFilter),
  });

  const verifyMutation = useMutation({
    mutationFn: pharmacyPrescriptionsApi.verifyPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
    },
  });

  const markPickedUpMutation = useMutation({
    mutationFn: pharmacyPrescriptionsApi.markPickedUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
    },
  });

  const handleVerify = async (id: string) => {
    if (window.confirm('Verify this prescription?')) {
      await verifyMutation.mutateAsync(id);
    }
  };

  const handleMarkPickedUp = async (id: string) => {
    if (window.confirm('Mark this prescription as picked up?')) {
      await markPickedUpMutation.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (isLoading) return <div className="text-center py-4">Loading prescriptions...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Prescriptions</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="picked_up">Picked Up</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prescription
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prescription #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prescriptions && prescriptions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No prescriptions found
                </td>
              </tr>
            ) : (
              prescriptions?.map((prescription: DoctorPrescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    {prescription.prescription_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{prescription.doctor_name}</div>
                    <div className="text-sm text-gray-500">{prescription.doctor_contact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prescription.patient_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(prescription.prescription_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(prescription.pickup_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(prescription.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(prescription.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => { setSelectedPrescription(prescription); setIsFormOpen(true); }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {prescription.status === 'pending' && (
                      <button
                        onClick={() => handleVerify(prescription.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Verify
                      </button>
                    )}
                    {prescription.status === 'verified' && (
                      <button
                        onClick={() => handleMarkPickedUp(prescription.id)}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Pick Up
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <PrescriptionForm
          prescription={selectedPrescription}
          onClose={() => { setIsFormOpen(false); setSelectedPrescription(undefined); }}
        />
      )}
    </div>
  );
};

