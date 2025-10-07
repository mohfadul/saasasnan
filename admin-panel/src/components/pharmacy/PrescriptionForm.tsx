import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyPrescriptionsApi } from '../../services/pharmacy-api';
import { DoctorPrescription } from '../../types/pharmacy';
import { formatCurrency } from '../../utils/currency.utils';

interface PrescriptionFormProps {
  prescription?: DoctorPrescription;
  onClose: () => void;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ prescription, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    clinicId: '',
    doctorName: '',
    doctorContact: '',
    doctorId: '',
    doctorEmail: '',
    patientName: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    pickupDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    specialInstructions: '',
  });

  const [items, setItems] = useState<Array<{
    drugId: string;
    drugName: string;
    quantityPrescribed: number;
    dosageInstructions: string;
    frequency: string;
    durationDays: number;
  }>>([]);

  useEffect(() => {
    if (prescription) {
      setFormData({
        clinicId: prescription.clinic_id,
        doctorName: prescription.doctor_name,
        doctorContact: prescription.doctor_contact,
        doctorId: prescription.doctor_id,
        doctorEmail: prescription.doctor_email,
        patientName: prescription.patient_name || '',
        prescriptionDate: prescription.prescription_date.split('T')[0],
        pickupDate: prescription.pickup_date.split('T')[0],
        specialInstructions: prescription.special_instructions || '',
      });
      if (prescription.items) {
        setItems(prescription.items.map(item => ({
          drugId: item.drug_id,
          drugName: item.drug_name,
          quantityPrescribed: item.quantity_prescribed,
          dosageInstructions: item.dosage_instructions || '',
          frequency: item.frequency || '',
          durationDays: item.duration_days || 0,
        })));
      }
    }
  }, [prescription]);

  const createMutation = useMutation({
    mutationFn: pharmacyPrescriptionsApi.createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-dashboard'] });
      onClose();
    },
  });

  const addItem = () => {
    setItems([...items, {
      drugId: '',
      drugName: '',
      quantityPrescribed: 1,
      dosageInstructions: '',
      frequency: '',
      durationDays: 7,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    await createMutation.mutateAsync({ ...formData, items });
  };

  const isReadOnly = !!prescription;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {isReadOnly ? 'View Prescription' : 'New Prescription'}
          </h3>
          {prescription && (
            <p className="text-sm text-gray-500 mt-1">
              Prescription #{prescription.prescription_number}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Doctor Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Doctor Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor Name *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doctor ID/License *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact *</label>
                <input
                  type="tel"
                  required
                  disabled={isReadOnly}
                  value={formData.doctorContact}
                  onChange={(e) => setFormData({ ...formData, doctorContact: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  disabled={isReadOnly}
                  value={formData.doctorEmail}
                  onChange={(e) => setFormData({ ...formData, doctorEmail: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Patient & Dates */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Patient & Schedule</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prescription Date *</label>
                <input
                  type="date"
                  required
                  disabled={isReadOnly}
                  value={formData.prescriptionDate}
                  onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Date *</label>
                <input
                  type="date"
                  required
                  disabled={isReadOnly}
                  value={formData.pickupDate}
                  onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Prescription Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-900">Prescribed Medications</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  + Add Item
                </button>
              )}
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-md">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Drug Name"
                        disabled={isReadOnly}
                        value={item.drugName}
                        onChange={(e) => updateItem(index, 'drugName', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Quantity"
                        min="1"
                        disabled={isReadOnly}
                        value={item.quantityPrescribed}
                        onChange={(e) => updateItem(index, 'quantityPrescribed', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Frequency"
                        disabled={isReadOnly}
                        value={item.frequency}
                        onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Dosage Instructions"
                        disabled={isReadOnly}
                        value={item.dosageInstructions}
                        onChange={(e) => updateItem(index, 'dosageInstructions', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        placeholder="Days"
                        min="1"
                        disabled={isReadOnly}
                        value={item.durationDays}
                        onChange={(e) => updateItem(index, 'durationDays', parseInt(e.target.value))}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      />
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {prescription && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Total Amount:</span>
                <span className="font-bold text-gray-900">{formatCurrency(prescription.total_amount)}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Status: <span className="font-medium">{prescription.status.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Prescription'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

