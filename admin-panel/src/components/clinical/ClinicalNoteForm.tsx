import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicalNotesApi } from '../../services/clinical-api';
import { patientsApi, appointmentsApi } from '../../services/api';
import { ClinicalNote, NoteType, CreateClinicalNoteRequest } from '../../types/clinical';

interface ClinicalNoteFormProps {
  clinicId: string;
  patientId?: string; // Pre-select patient
  note?: ClinicalNote; // For editing existing note
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ClinicalNoteForm: React.FC<ClinicalNoteFormProps> = ({
  clinicId,
  patientId,
  note,
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!note;

  const [formData, setFormData] = useState<CreateClinicalNoteRequest>({
    patientId: note?.patientId || patientId || '',
    appointmentId: note?.appointmentId || undefined,
    noteType: note?.noteType || NoteType.PROGRESS,
    chiefComplaint: note?.chiefComplaint || '',
    historyOfPresentIllness: note?.historyOfPresentIllness || '',
    medicalHistory: note?.medicalHistory || '',
    dentalHistory: note?.dentalHistory || '',
    examinationFindings: note?.examinationFindings || '',
    diagnosis: note?.diagnosis || '',
    treatmentRendered: note?.treatmentRendered || '',
    treatmentPlan: note?.treatmentPlan || '',
    recommendations: note?.recommendations || '',
    followUpInstructions: note?.followUpInstructions || '',
    additionalNotes: note?.additionalNotes || '',
    vitalSigns: note?.vitalSigns || {},
    medications: note?.medications || [],
    allergies: note?.allergies || [],
    proceduresPerformed: note?.proceduresPerformed || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allergyInput, setAllergyInput] = useState('');

  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.getPatients(clinicId),
  });

  // Fetch appointments for dropdown (optional)
  const { data: appointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.getAppointments({}),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: clinicalNotesApi.createClinicalNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      setErrors({ api: err.response?.data?.message || err.message || 'Failed to create clinical note.' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => clinicalNotesApi.updateClinicalNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      setErrors({ api: err.response?.data?.message || err.message || 'Failed to update clinical note.' });
    },
  });

  useEffect(() => {
    if (note) {
      setFormData({
        patientId: note.patientId,
        appointmentId: note.appointmentId,
        noteType: note.noteType,
        chiefComplaint: note.chiefComplaint,
        historyOfPresentIllness: note.historyOfPresentIllness || '',
        medicalHistory: note.medicalHistory || '',
        dentalHistory: note.dentalHistory || '',
        examinationFindings: note.examinationFindings || '',
        diagnosis: note.diagnosis || '',
        treatmentRendered: note.treatmentRendered || '',
        treatmentPlan: note.treatmentPlan || '',
        recommendations: note.recommendations || '',
        followUpInstructions: note.followUpInstructions || '',
        additionalNotes: note.additionalNotes || '',
        vitalSigns: note.vitalSigns || {},
        medications: note.medications || [],
        allergies: note.allergies || [],
        proceduresPerformed: note.proceduresPerformed || [],
      });
    }
  }, [note]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...(prev.allergies || []), allergyInput.trim()],
      }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies?.filter((_, i) => i !== index) || [],
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.patientId.trim()) newErrors.patientId = 'Patient is required.';
    if (!formData.chiefComplaint.trim()) newErrors.chiefComplaint = 'Chief complaint is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (isEditMode && note) {
      updateMutation.mutate({ id: note.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const selectedPatient = patients?.find((p: any) => p.id === formData.patientId);

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onCancel}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditMode ? 'Edit Clinical Note' : 'Add New Clinical Note'}
                </h3>
                <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-500">
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {errors.api && <p className="text-red-500 text-sm mb-4">{errors.api}</p>}

              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Patient & Note Type Section */}
                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                  <div>
                    <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                      Patient <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="patientId"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleChange}
                      disabled={isEditMode || isLoadingPatients}
                      className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${
                        isEditMode ? 'bg-gray-100' : ''
                      } ${errors.patientId ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select a patient</option>
                      {patients?.map((patient: any) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.demographics?.firstName} {patient.demographics?.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && <p className="mt-2 text-sm text-red-600">{errors.patientId}</p>}
                    {selectedPatient && (
                      <p className="mt-2 text-sm text-gray-500">
                        DOB: {selectedPatient.demographics?.dateOfBirth || 'N/A'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="noteType" className="block text-sm font-medium text-gray-700">
                      Note Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="noteType"
                      name="noteType"
                      value={formData.noteType}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value={NoteType.PROGRESS}>Progress Note</option>
                      <option value={NoteType.INITIAL_CONSULTATION}>Initial Consultation</option>
                      <option value={NoteType.FOLLOW_UP}>Follow-up</option>
                      <option value={NoteType.EMERGENCY}>Emergency</option>
                      <option value={NoteType.PROCEDURE_NOTE}>Procedure Note</option>
                      <option value={NoteType.REFERRAL}>Referral</option>
                      <option value={NoteType.DISCHARGE}>Discharge</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="appointmentId" className="block text-sm font-medium text-gray-700">
                      Link to Appointment (Optional)
                    </label>
                    <select
                      id="appointmentId"
                      name="appointmentId"
                      value={formData.appointmentId || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">No appointment linked</option>
                      {appointments?.map((apt: any) => (
                        <option key={apt.id} value={apt.id}>
                          {apt.patient?.demographics?.firstName} {apt.patient?.demographics?.lastName} -{' '}
                          {new Date(apt.startTime).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label htmlFor="chiefComplaint" className="block text-sm font-medium text-gray-700">
                    Chief Complaint <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="chiefComplaint"
                    name="chiefComplaint"
                    rows={2}
                    value={formData.chiefComplaint}
                    onChange={handleChange}
                    placeholder="e.g., Tooth pain in upper right molar for 3 days"
                    className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.chiefComplaint ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.chiefComplaint && <p className="mt-2 text-sm text-red-600">{errors.chiefComplaint}</p>}
                </div>

                {/* History of Present Illness */}
                <div>
                  <label htmlFor="historyOfPresentIllness" className="block text-sm font-medium text-gray-700">
                    History of Present Illness
                  </label>
                  <textarea
                    id="historyOfPresentIllness"
                    name="historyOfPresentIllness"
                    rows={3}
                    value={formData.historyOfPresentIllness}
                    onChange={handleChange}
                    placeholder="Detailed description of current condition..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Medical History */}
                <div>
                  <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                    Medical History
                  </label>
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    rows={3}
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Past medical conditions, surgeries, hospitalizations..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Dental History */}
                <div>
                  <label htmlFor="dentalHistory" className="block text-sm font-medium text-gray-700">
                    Dental History
                  </label>
                  <textarea
                    id="dentalHistory"
                    name="dentalHistory"
                    rows={3}
                    value={formData.dentalHistory}
                    onChange={handleChange}
                    placeholder="Past dental treatments, procedures, dental habits..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Allergies</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAllergy();
                        }
                      }}
                      placeholder="Enter allergy and press Enter"
                      className="flex-1 block w-full border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-700 text-sm hover:bg-gray-100"
                    >
                      Add
                    </button>
                  </div>
                  {formData.allergies && formData.allergies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.allergies.map((allergy, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy(index)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Examination Findings */}
                <div>
                  <label htmlFor="examinationFindings" className="block text-sm font-medium text-gray-700">
                    Examination Findings
                  </label>
                  <textarea
                    id="examinationFindings"
                    name="examinationFindings"
                    rows={4}
                    value={formData.examinationFindings}
                    onChange={handleChange}
                    placeholder="Clinical examination results, observations..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Diagnosis */}
                <div>
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                    Diagnosis
                  </label>
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    rows={2}
                    value={formData.diagnosis}
                    onChange={handleChange}
                    placeholder="Clinical diagnosis..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Treatment Rendered */}
                <div>
                  <label htmlFor="treatmentRendered" className="block text-sm font-medium text-gray-700">
                    Treatment Rendered
                  </label>
                  <textarea
                    id="treatmentRendered"
                    name="treatmentRendered"
                    rows={3}
                    value={formData.treatmentRendered}
                    onChange={handleChange}
                    placeholder="Treatments performed during this visit..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Treatment Plan */}
                <div>
                  <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700">
                    Treatment Plan
                  </label>
                  <textarea
                    id="treatmentPlan"
                    name="treatmentPlan"
                    rows={3}
                    value={formData.treatmentPlan}
                    onChange={handleChange}
                    placeholder="Future treatment plans..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700">
                    Recommendations
                  </label>
                  <textarea
                    id="recommendations"
                    name="recommendations"
                    rows={2}
                    value={formData.recommendations}
                    onChange={handleChange}
                    placeholder="Clinical recommendations..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Follow-up Instructions */}
                <div>
                  <label htmlFor="followUpInstructions" className="block text-sm font-medium text-gray-700">
                    Follow-up Instructions
                  </label>
                  <textarea
                    id="followUpInstructions"
                    name="followUpInstructions"
                    rows={2}
                    value={formData.followUpInstructions}
                    onChange={handleChange}
                    placeholder="Instructions for patient follow-up..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label htmlFor="additionalNotes" className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    placeholder="Any additional information..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditMode
                  ? 'Update Note'
                  : 'Create Note'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

