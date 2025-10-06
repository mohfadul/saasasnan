import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Patient } from '../../types';
import { patientsApi } from '../../services/api';
import { clinicalNotesApi, treatmentPlansApi } from '../../services/clinical-api';
import { format, isValid, parseISO } from 'date-fns';
import { PatientForm } from './PatientForm';
import { ClinicalNoteForm } from '../clinical/ClinicalNoteForm';

// Helper function to safely format dates
const formatDate = (date: any, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsedDate)) return 'N/A';
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

interface PatientTableProps {
  clinicId?: string;
}

interface PatientWithDemographics extends Patient {
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email?: string;
    phone?: string;
    address?: Record<string, any>;
    gender?: string;
    [key: string]: any;
  };
}

export const PatientTable: React.FC<PatientTableProps> = ({ clinicId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDemographics | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientWithDemographics | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'plans'>('info');
  const [showAddNoteForm, setShowAddNoteForm] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [showEditNoteForm, setShowEditNoteForm] = useState(false);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { data: patients = [], isLoading, error } = useQuery({
    queryKey: ['patients', clinicId],
    queryFn: () => patientsApi.getPatients(clinicId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
  });

  // Fetch clinical notes for selected patient
  const { data: patientNotes = [] } = useQuery({
    queryKey: ['clinical-notes', selectedPatient?.id],
    queryFn: () => clinicalNotesApi.getClinicalNotes({ patientId: selectedPatient?.id }),
    enabled: !!selectedPatient?.id && showViewModal,
  });

  // Fetch treatment plans for selected patient
  const { data: patientTreatmentPlans = [] } = useQuery({
    queryKey: ['treatment-plans', selectedPatient?.id],
    queryFn: () => treatmentPlansApi.getTreatmentPlans({ patientId: selectedPatient?.id }),
    enabled: !!selectedPatient?.id && showViewModal,
  });

  const deletePatientMutation = useMutation({
    mutationFn: (patientId: string) => patientsApi.deletePatient(patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowDeleteModal(false);
      setPatientToDelete(null);
      alert('Patient deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting patient:', error);
      alert(`Error deleting patient: ${error.response?.data?.message || error.message}`);
    },
  });

  // Memoized filtering for better performance
  const filteredPatients = useMemo(() => {
    if (!patients || !searchTerm) return patients;
    
    const searchLower = searchTerm.toLowerCase();
    return patients.filter((patient: Patient) => {
      const { firstName, lastName, email, phone } = (patient as any).demographics;
      
      return (
        firstName.toLowerCase().includes(searchLower) ||
        lastName.toLowerCase().includes(searchLower) ||
        email?.toLowerCase().includes(searchLower) ||
        phone?.includes(searchTerm)
      );
    });
  }, [patients, searchTerm]);

  const paginatedPatients = filteredPatients?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil((filteredPatients?.length || 0) / pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading patients...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading patients
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleViewPatient = (patient: PatientWithDemographics) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
    setActiveTab('info');
    setShowAddNoteForm(false);
    setShowEditNoteForm(false);
  };

  const handleEditPatient = (patient: PatientWithDemographics) => {
    setSelectedPatient(patient);
    setShowEditForm(true);
  };

  const handleDeleteClick = (patient: PatientWithDemographics) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (patientToDelete) {
      deletePatientMutation.mutate(patientToDelete.id);
    }
  };

  return (
    <>
      {/* Add Patient Form Modal */}
      {showForm && (
        <PatientForm
          clinicId={clinicId || '550e8400-e29b-41d4-a716-446655440001'}
          onSuccess={() => {
            setShowForm(false);
            alert('Patient created successfully!');
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* View Patient Modal */}
      {showViewModal && selectedPatient && !showAddNoteForm && !showEditNoteForm && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl font-medium text-blue-700">
                        {selectedPatient.demographics.firstName.charAt(0)}
                        {selectedPatient.demographics.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {selectedPatient.demographics.firstName} {selectedPatient.demographics.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">Patient ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`${
                        activeTab === 'info'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Patient Info
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`${
                        activeTab === 'notes'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Clinical Notes ({patientNotes.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className={`${
                        activeTab === 'plans'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Treatment Plans ({patientTreatmentPlans.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6 max-h-[60vh] overflow-y-auto">
                  {activeTab === 'info' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(selectedPatient.demographics.dateOfBirth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Gender</p>
                        <p className="mt-1 text-sm text-gray-900 capitalize">
                          {selectedPatient.demographics.gender || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPatient.demographics.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPatient.demographics.phone || 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPatient.demographics.address 
                            ? (typeof selectedPatient.demographics.address === 'string' 
                                ? selectedPatient.demographics.address 
                                : JSON.stringify(selectedPatient.demographics.address))
                            : 'No address on file'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Visit</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPatient.lastVisitAt 
                            ? formatDate(selectedPatient.lastVisitAt)
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <span className="mt-1 inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notes' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-900">Clinical Notes</h4>
                        <button
                          onClick={() => setShowAddNoteForm(true)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          Add Clinical Note
                        </button>
                      </div>
                      
                      {patientNotes.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">No clinical notes found for this patient.</p>
                          <button
                            onClick={() => setShowAddNoteForm(true)}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Create First Clinical Note
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientNotes.map((note: any) => (
                            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                                      note.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                      note.status === 'finalized' ? 'bg-blue-100 text-blue-800' :
                                      note.status === 'signed' ? 'bg-green-100 text-green-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {note.status}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {formatDate(note.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-gray-900">{note.chiefComplaint}</p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Provider: {note.provider?.firstName} {note.provider?.lastName}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {note.status === 'draft' && (
                                    <button
                                      onClick={() => {
                                        setSelectedNote(note);
                                        setShowEditNoteForm(true);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                                    >
                                      Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'plans' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-900">Treatment Plans</h4>
                      </div>
                      
                      {patientTreatmentPlans.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">No treatment plans found for this patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {patientTreatmentPlans.map((plan: any) => (
                            <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h5 className="text-sm font-medium text-gray-900">{plan.title}</h5>
                                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                                      plan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                      plan.status === 'proposed' ? 'bg-blue-100 text-blue-800' :
                                      plan.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                      plan.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                      plan.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {plan.status}
                                    </span>
                                    <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                                      plan.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                      plan.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                      plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {plan.priority}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-600">{plan.description || 'No description'}</p>
                                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                    <span>Provider: {plan.provider?.firstName} {plan.provider?.lastName}</span>
                                    <span>•</span>
                                    <span>Created: {formatDate(plan.createdAt)}</span>
                                    {plan.estimatedCost && (
                                      <>
                                        <span>•</span>
                                        <span className="font-semibold text-gray-700">
                                          Cost: ${plan.estimatedCost.toFixed(2)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {plan.totalItems > 0 && (
                                    <div className="mt-2">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${Math.round((plan.completedItems / plan.totalItems) * 100)}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-xs text-gray-600">
                                          {plan.completedItems}/{plan.totalItems} completed
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => window.open(`/treatment-plans`, '_blank')}
                                    className="text-blue-600 hover:text-blue-900 text-sm"
                                  >
                                    View Full
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditPatient(selectedPatient);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Edit Patient
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Clinical Note Form */}
      {showAddNoteForm && selectedPatient && (
        <ClinicalNoteForm
          clinicId={clinicId || '550e8400-e29b-41d4-a716-446655440001'}
          patientId={selectedPatient.id}
          onSuccess={() => {
            setShowAddNoteForm(false);
            queryClient.invalidateQueries({ queryKey: ['clinical-notes', selectedPatient.id] });
            alert('Clinical note created successfully!');
          }}
          onCancel={() => setShowAddNoteForm(false)}
        />
      )}

      {/* Edit Clinical Note Form */}
      {showEditNoteForm && selectedNote && (
        <ClinicalNoteForm
          clinicId={clinicId || '550e8400-e29b-41d4-a716-446655440001'}
          note={selectedNote}
          onSuccess={() => {
            setShowEditNoteForm(false);
            setSelectedNote(null);
            queryClient.invalidateQueries({ queryKey: ['clinical-notes', selectedPatient?.id] });
            alert('Clinical note updated successfully!');
          }}
          onCancel={() => {
            setShowEditNoteForm(false);
            setSelectedNote(null);
          }}
        />
      )}

      {/* Edit Patient Form Modal */}
      {showEditForm && selectedPatient && (
        <PatientForm
          clinicId={clinicId || '550e8400-e29b-41d4-a716-446655440001'}
          patient={selectedPatient}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedPatient(null);
            alert('Patient updated successfully!');
          }}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && patientToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Patient
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete patient{' '}
                        <strong>
                          {patientToDelete.demographics.firstName} {patientToDelete.demographics.lastName}
                        </strong>
                        ? This action cannot be undone and will permanently remove all patient records and data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletePatientMutation.isPending}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletePatientMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletePatientMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
      {/* Search and Controls */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-lg">
            <label htmlFor="search" className="sr-only">
              Search patients
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search patients..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="ml-4">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Patient
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Visit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPatients?.map((patient: Patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {patient.demographics.firstName.charAt(0)}
                          {patient.demographics.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {patient.demographics.firstName} {patient.demographics.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        DOB: {formatDate(patient.demographics.dateOfBirth)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{patient.demographics.phone || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{patient.demographics.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {patient.lastVisitAt 
                    ? formatDate(patient.lastVisitAt)
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    type="button"
                    onClick={() => handleViewPatient(patient as PatientWithDemographics)}
                    className="text-blue-600 hover:text-blue-900 hover:underline mr-3"
                  >
                    View
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleEditPatient(patient as PatientWithDemographics)}
                    className="text-indigo-600 hover:text-indigo-900 hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleDeleteClick(patient as PatientWithDemographics)}
                    className="text-red-600 hover:text-red-900 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filteredPatients?.length || 0)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{filteredPatients?.length || 0}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
