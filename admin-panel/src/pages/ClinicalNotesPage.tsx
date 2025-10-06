import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalNotesApi } from '../services/clinical-api';
import { ClinicalNote, NoteType, NoteStatus } from '../types/clinical';
import { format, isValid, parseISO } from 'date-fns';
import { ClinicalNoteForm } from '../components/clinical/ClinicalNoteForm';

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

export const ClinicalNotesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const pageSize = 10;

  // Fetch clinical notes
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ['clinical-notes', statusFilter, noteTypeFilter],
    queryFn: () => clinicalNotesApi.getClinicalNotes({
      status: statusFilter === 'all' ? undefined : statusFilter,
      noteType: noteTypeFilter === 'all' ? undefined : noteTypeFilter,
    }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => clinicalNotesApi.deleteClinicalNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      alert('Clinical note deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting note: ${error.response?.data?.message || error.message}`);
    },
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: ({ id, signature }: { id: string; signature: string }) =>
      clinicalNotesApi.finalizeClinicalNote(id, signature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      alert('Clinical note finalized successfully!');
    },
    onError: (error: any) => {
      alert(`Error finalizing note: ${error.response?.data?.message || error.message}`);
    },
  });

  // Filter and pagination
  const filteredNotes = notes.filter((note: ClinicalNote) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      note.chiefComplaint?.toLowerCase().includes(searchLower) ||
      note.patient?.demographics?.firstName?.toLowerCase().includes(searchLower) ||
      note.patient?.demographics?.lastName?.toLowerCase().includes(searchLower) ||
      note.provider?.firstName?.toLowerCase().includes(searchLower) ||
      note.provider?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredNotes.length / pageSize);
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleViewNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handleFinalizeNote = (note: ClinicalNote) => {
    const signature = prompt('Enter your signature to finalize this note:');
    if (signature) {
      if (window.confirm('Are you sure you want to finalize this note? It cannot be edited after finalization.')) {
        finalizeMutation.mutate({ id: note.id, signature });
      }
    }
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this clinical note?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNote = () => {
    setSelectedNote(null);
    setShowAddForm(true);
  };

  const handleEditNote = (note: ClinicalNote) => {
    setSelectedNote(note);
    setShowEditForm(true);
  };

  const getStatusBadgeColor = (status: NoteStatus) => {
    switch (status) {
      case NoteStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case NoteStatus.FINALIZED:
        return 'bg-blue-100 text-blue-800';
      case NoteStatus.SIGNED:
        return 'bg-green-100 text-green-800';
      case NoteStatus.AMENDED:
        return 'bg-yellow-100 text-yellow-800';
      case NoteStatus.ARCHIVED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNoteTypeLabel = (type: NoteType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading clinical notes. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Clinical Notes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage patient clinical notes and documentation
          </p>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddForm && (
        <ClinicalNoteForm
          clinicId="550e8400-e29b-41d4-a716-446655440001"
          onSuccess={() => {
            setShowAddForm(false);
            alert('Clinical note created successfully!');
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Edit Note Form */}
      {showEditForm && selectedNote && (
        <ClinicalNoteForm
          clinicId="550e8400-e29b-41d4-a716-446655440001"
          note={selectedNote}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedNote(null);
            alert('Clinical note updated successfully!');
          }}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedNote(null);
          }}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedNote && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Clinical Note Details
                  </h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Patient & Provider Info */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient</p>
                      <p className="text-sm text-gray-900">
                        {selectedNote.patient?.demographics?.firstName} {selectedNote.patient?.demographics?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Provider</p>
                      <p className="text-sm text-gray-900">
                        {selectedNote.provider?.firstName} {selectedNote.provider?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Note Type</p>
                      <p className="text-sm text-gray-900">{getNoteTypeLabel(selectedNote.noteType)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedNote.status)}`}>
                        {selectedNote.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Created</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedNote.createdAt, 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedNote.updatedAt, 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Chief Complaint</h4>
                    <p className="text-sm text-gray-700">{selectedNote.chiefComplaint}</p>
                  </div>

                  {/* History of Present Illness */}
                  {selectedNote.historyOfPresentIllness && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">History of Present Illness</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.historyOfPresentIllness}</p>
                    </div>
                  )}

                  {/* Medical History */}
                  {selectedNote.medicalHistory && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Medical History</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.medicalHistory}</p>
                    </div>
                  )}

                  {/* Dental History */}
                  {selectedNote.dentalHistory && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Dental History</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.dentalHistory}</p>
                    </div>
                  )}

                  {/* Examination Findings */}
                  {selectedNote.examinationFindings && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Examination Findings</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.examinationFindings}</p>
                    </div>
                  )}

                  {/* Diagnosis */}
                  {selectedNote.diagnosis && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Diagnosis</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.diagnosis}</p>
                    </div>
                  )}

                  {/* Treatment Rendered */}
                  {selectedNote.treatmentRendered && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Rendered</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.treatmentRendered}</p>
                    </div>
                  )}

                  {/* Treatment Plan */}
                  {selectedNote.treatmentPlan && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Plan</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.treatmentPlan}</p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedNote.recommendations && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.recommendations}</p>
                    </div>
                  )}

                  {/* Follow-up Instructions */}
                  {selectedNote.followUpInstructions && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Follow-up Instructions</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.followUpInstructions}</p>
                    </div>
                  )}

                  {/* Allergies */}
                  {selectedNote.allergies && selectedNote.allergies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Allergies</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedNote.allergies.map((allergy, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Notes */}
                  {selectedNote.additionalNotes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.additionalNotes}</p>
                    </div>
                  )}

                  {/* Signature */}
                  {selectedNote.providerSignature && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-500">Provider Signature</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedNote.providerSignature}</p>
                      {selectedNote.signedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Signed: {formatDate(selectedNote.signedAt, 'MMM dd, yyyy hh:mm a')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg">
        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient, provider, or complaint..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <select
              value={noteTypeFilter}
              onChange={(e) => setNoteTypeFilter(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Note Types</option>
              <option value="progress">Progress Note</option>
              <option value="initial_consultation">Initial Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="procedure_note">Procedure Note</option>
              <option value="referral">Referral</option>
              <option value="discharge">Discharge</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="signed">Signed</option>
              <option value="amended">Amended</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="button"
              onClick={handleAddNote}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chief Complaint
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No clinical notes found. Create your first clinical note to get started.
                  </td>
                </tr>
              ) : (
                paginatedNotes.map((note: ClinicalNote) => (
                  <tr key={note.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(note.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {note.patient?.demographics?.firstName} {note.patient?.demographics?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {note.provider?.firstName} {note.provider?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getNoteTypeLabel(note.noteType)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {note.chiefComplaint}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(note.status)}`}>
                        {note.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleViewNote(note)}
                        className="text-blue-600 hover:text-blue-900 hover:underline mr-3"
                      >
                        View
                      </button>
                      {note.status === NoteStatus.DRAFT && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditNote(note)}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFinalizeNote(note)}
                            className="text-green-600 hover:text-green-900 hover:underline mr-3"
                          >
                            Finalize
                          </button>
                        </>
                      )}
                      {note.status === NoteStatus.DRAFT && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-900 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
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
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, filteredNotes.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredNotes.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === idx + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

