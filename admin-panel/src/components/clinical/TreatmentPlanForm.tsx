import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { treatmentPlansApi } from '../../services/clinical-api';
import { patientsApi } from '../../services/api';
import { CreateTreatmentPlanRequest, TreatmentPlan } from '../../types/clinical';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TreatmentPlanFormProps {
  plan?: TreatmentPlan;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TreatmentPlanItemForm {
  procedureName: string;
  procedureCode: string;
  itemType: string;
  description: string;
  quantity: number;
  unitCost: number;
  estimatedDurationMinutes: number;
  sequenceOrder: number;
  specialInstructions: string;
  requiredMaterials: string;
  contraindications: string;
}

export const TreatmentPlanForm: React.FC<TreatmentPlanFormProps> = ({
  plan,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!plan;

  const [formData, setFormData] = useState<CreateTreatmentPlanRequest>({
    patientId: plan?.patientId || '',
    clinicalNoteId: plan?.clinicalNoteId || undefined,
    title: plan?.title || '',
    description: plan?.description || '',
    priority: plan?.priority || 'medium',
    startDate: plan?.startDate || '',
    estimatedCompletionDate: plan?.estimatedCompletionDate || '',
    estimatedCost: plan?.estimatedCost || 0,
    insuranceEstimate: plan?.insuranceEstimate || 0,
    notes: plan?.notes || '',
    items: plan?.items?.map(item => ({
      procedureName: item.procedureName,
      procedureCode: item.procedureCode || '',
      itemType: item.itemType,
      description: item.description || '',
      quantity: item.quantity || 1,
      estimatedDurationMinutes: item.estimatedDurationMinutes || 30,
      unitCost: item.unitCost,
      dependsOnItemId: undefined,
      sequenceOrder: item.sequenceOrder,
      specialInstructions: Array.isArray(item.specialInstructions) ? item.specialInstructions : [],
      requiredMaterials: Array.isArray(item.requiredMaterials) ? item.requiredMaterials : [],
      contraindications: Array.isArray(item.contraindications) ? item.contraindications : [],
    })) || [],
  });

  const [currentItem, setCurrentItem] = useState<TreatmentPlanItemForm>({
    procedureName: '',
    procedureCode: '',
    itemType: 'procedure',
    description: '',
    quantity: 1,
    unitCost: 0,
    estimatedDurationMinutes: 30,
    sequenceOrder: formData.items.length + 1,
    specialInstructions: '',
    requiredMaterials: '',
    contraindications: '',
  });

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getPatients(),
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: CreateTreatmentPlanRequest) => {
      if (isEditMode && plan) {
        return treatmentPlansApi.updateTreatmentPlan(plan.id, data as any);
      }
      return treatmentPlansApi.createTreatmentPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      alert(`Treatment plan ${isEditMode ? 'updated' : 'created'} successfully!`);
      onSuccess?.();
    },
    onError: (error: any) => {
      alert(`Error ${isEditMode ? 'updating' : 'creating'} treatment plan: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientId) {
      alert('Please select a patient');
      return;
    }

    if (!formData.title || formData.title.trim() === '') {
      alert('Please enter a title');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one treatment item');
      return;
    }

    if (formData.estimatedCost < 0) {
      alert('Estimated cost cannot be negative');
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleAddItem = () => {
    if (!currentItem.procedureName || !currentItem.itemType) {
      alert('Please enter procedure name and type');
      return;
    }

    const specialInstructionsArray = currentItem.specialInstructions 
      ? currentItem.specialInstructions.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const requiredMaterialsArray = currentItem.requiredMaterials
      ? currentItem.requiredMaterials.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const contraindicationsArray = currentItem.contraindications
      ? currentItem.contraindications.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newItem = {
      procedureName: currentItem.procedureName,
      procedureCode: currentItem.procedureCode,
      itemType: currentItem.itemType,
      description: currentItem.description,
      quantity: currentItem.quantity,
      estimatedDurationMinutes: currentItem.estimatedDurationMinutes,
      unitCost: currentItem.unitCost,
      dependsOnItemId: undefined,
      sequenceOrder: formData.items.length + 1,
      specialInstructions: specialInstructionsArray,
      requiredMaterials: requiredMaterialsArray,
      contraindications: contraindicationsArray,
    };

    setFormData({
      ...formData,
      items: [...formData.items, newItem],
      estimatedCost: formData.estimatedCost + (currentItem.unitCost * currentItem.quantity),
    });

    // Reset current item
    setCurrentItem({
      procedureName: '',
      procedureCode: '',
      itemType: 'procedure',
      description: '',
      quantity: 1,
      unitCost: 0,
      estimatedDurationMinutes: 30,
      sequenceOrder: formData.items.length + 2,
      specialInstructions: '',
      requiredMaterials: '',
      contraindications: '',
    });
  };

  const handleRemoveItem = (index: number) => {
    const removedItem = formData.items[index];
    const newItems = formData.items.filter((_, i) => i !== index);
    
    // Recalculate sequence order
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      sequenceOrder: idx + 1,
    }));

    setFormData({
      ...formData,
      items: reorderedItems,
      estimatedCost: formData.estimatedCost - (removedItem.unitCost * (removedItem.quantity || 1)),
    });
  };

  const totalCost = formData.items.reduce((sum, item) => sum + (item.unitCost * (item.quantity || 1)), 0);
  const patientResponsibility = totalCost - (formData.insuranceEstimate || 0);

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onCancel}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditMode ? 'Edit Treatment Plan' : 'Create New Treatment Plan'}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-4">
                {/* Basic Information */}
                <div className="space-y-4 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b pb-2">Basic Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                        Patient <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="patientId"
                        value={formData.patientId}
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        disabled={isEditMode}
                      >
                        <option value="">Select a patient...</option>
                        {patientsData?.map((patient: any) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.demographics?.firstName} {patient.demographics?.lastName}
                            {patient.demographics?.dateOfBirth && ` (DOB: ${patient.demographics.dateOfBirth})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="priority"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Full Mouth Rehabilitation, Root Canal Treatment"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the treatment plan..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="estimatedCompletionDate" className="block text-sm font-medium text-gray-700">
                        Estimated Completion Date
                      </label>
                      <input
                        type="date"
                        id="estimatedCompletionDate"
                        value={formData.estimatedCompletionDate}
                        onChange={(e) => setFormData({ ...formData, estimatedCompletionDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="insuranceEstimate" className="block text-sm font-medium text-gray-700">
                        Insurance Estimate ($)
                      </label>
                      <input
                        type="number"
                        id="insuranceEstimate"
                        value={formData.insuranceEstimate}
                        onChange={(e) => setFormData({ ...formData, insuranceEstimate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Total Estimated Cost
                      </label>
                      <div className="mt-1 block w-full py-2 px-3 bg-gray-50 rounded-md text-sm font-semibold text-gray-900">
                        ${totalCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Responsibility
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-lg font-bold text-blue-900">
                        ${patientResponsibility.toFixed(2)}
                      </p>
                      <p className="text-xs text-blue-700">
                        Total Cost: ${totalCost.toFixed(2)} - Insurance: ${(formData.insuranceEstimate || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Additional Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Any additional information or special considerations..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Treatment Items */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">
                    Treatment Items ({formData.items.length})
                  </h4>

                  {/* Existing Items */}
                  {formData.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {index + 1}. {item.procedureName}
                              {item.procedureCode && <span className="text-gray-500 ml-2">({item.procedureCode})</span>}
                            </p>
                            <p className="text-xs text-gray-600">
                              Qty: {item.quantity || 1} × ${item.unitCost.toFixed(2)} = ${((item.quantity || 1) * item.unitCost).toFixed(2)}
                              {item.estimatedDurationMinutes && ` • ${item.estimatedDurationMinutes} min`}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="ml-4 text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Item Form */}
                  <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-3">Add Treatment Item</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Procedure Name *</label>
                        <input
                          type="text"
                          value={currentItem.procedureName}
                          onChange={(e) => setCurrentItem({ ...currentItem, procedureName: e.target.value })}
                          placeholder="e.g., Crown Placement"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Procedure Code</label>
                        <input
                          type="text"
                          value={currentItem.procedureCode}
                          onChange={(e) => setCurrentItem({ ...currentItem, procedureCode: e.target.value })}
                          placeholder="D2740"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Item Type *</label>
                        <select
                          value={currentItem.itemType}
                          onChange={(e) => setCurrentItem({ ...currentItem, itemType: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                          <option value="procedure">Procedure</option>
                          <option value="consultation">Consultation</option>
                          <option value="diagnostic">Diagnostic</option>
                          <option value="preventive">Preventive</option>
                          <option value="restorative">Restorative</option>
                          <option value="cosmetic">Cosmetic</option>
                          <option value="surgical">Surgical</option>
                          <option value="orthodontic">Orthodontic</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          value={currentItem.description}
                          onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                          placeholder="Brief description of the procedure"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Quantity</label>
                        <input
                          type="number"
                          value={currentItem.quantity}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Unit Cost ($)</label>
                        <input
                          type="number"
                          value={currentItem.unitCost}
                          onChange={(e) => setCurrentItem({ ...currentItem, unitCost: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700">Duration (min)</label>
                        <input
                          type="number"
                          value={currentItem.estimatedDurationMinutes}
                          onChange={(e) => setCurrentItem({ ...currentItem, estimatedDurationMinutes: parseInt(e.target.value) || 30 })}
                          min="0"
                          step="15"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700">Special Instructions (comma-separated)</label>
                        <input
                          type="text"
                          value={currentItem.specialInstructions}
                          onChange={(e) => setCurrentItem({ ...currentItem, specialInstructions: e.target.value })}
                          placeholder="e.g., Requires anesthesia, Multiple visits needed"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div className="md:col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddItem}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saveMutation.isPending 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Plan' : 'Create Plan')}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

