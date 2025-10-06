import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treatmentPlansApi } from '../services/clinical-api';
import { TreatmentPlan, TreatmentPlanStatus } from '../types/clinical';
import { TreatmentPlanForm } from '../components/clinical/TreatmentPlanForm';
import { format, isValid, parseISO } from 'date-fns';
import { PlusIcon } from '@heroicons/react/24/outline';

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

export const TreatmentPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const pageSize = 10;

  // Fetch treatment plans
  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['treatment-plans', statusFilter, priorityFilter],
    queryFn: () => treatmentPlansApi.getTreatmentPlans({
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  // Client-side filtering for priority since backend doesn't support it yet
  const filteredPlansByPriority = plans.filter((plan: TreatmentPlan) => {
    if (priorityFilter === 'all') return true;
    return plan.priority === priorityFilter;
  });

  // Propose mutation
  const proposeMutation = useMutation({
    mutationFn: (id: string) => treatmentPlansApi.proposeTreatmentPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      alert('Treatment plan proposed to patient successfully!');
    },
    onError: (error: any) => {
      alert(`Error proposing plan: ${error.response?.data?.message || error.message}`);
    },
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => treatmentPlansApi.acceptTreatmentPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      alert('Treatment plan accepted successfully!');
    },
    onError: (error: any) => {
      alert(`Error accepting plan: ${error.response?.data?.message || error.message}`);
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (id: string) => treatmentPlansApi.completeTreatmentPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      alert('Treatment plan completed successfully!');
    },
    onError: (error: any) => {
      alert(`Error completing plan: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => treatmentPlansApi.deleteTreatmentPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      alert('Treatment plan deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting plan: ${error.response?.data?.message || error.message}`);
    },
  });

  // Filter and pagination
  const filteredPlans = filteredPlansByPriority.filter((plan: TreatmentPlan) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      plan.title?.toLowerCase().includes(searchLower) ||
      plan.patient?.demographics?.firstName?.toLowerCase().includes(searchLower) ||
      plan.patient?.demographics?.lastName?.toLowerCase().includes(searchLower) ||
      plan.provider?.firstName?.toLowerCase().includes(searchLower) ||
      plan.provider?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredPlans.length / pageSize);
  const paginatedPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleViewPlan = (plan: TreatmentPlan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
  };

  const handlePropose = (plan: TreatmentPlan) => {
    if (window.confirm('Propose this treatment plan to the patient?')) {
      proposeMutation.mutate(plan.id);
    }
  };

  const handleAccept = (plan: TreatmentPlan) => {
    if (window.confirm('Mark this treatment plan as accepted by patient?')) {
      acceptMutation.mutate(plan.id);
    }
  };

  const handleComplete = (plan: TreatmentPlan) => {
    if (window.confirm('Mark this treatment plan as completed?')) {
      completeMutation.mutate(plan.id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this treatment plan?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadgeColor = (status: TreatmentPlanStatus) => {
    switch (status) {
      case TreatmentPlanStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case TreatmentPlanStatus.PROPOSED:
        return 'bg-blue-100 text-blue-800';
      case TreatmentPlanStatus.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case TreatmentPlanStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TreatmentPlanStatus.COMPLETED:
        return 'bg-purple-100 text-purple-800';
      case TreatmentPlanStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (plan: TreatmentPlan) => {
    if (!plan.totalItems || plan.totalItems === 0) return 0;
    return Math.round((plan.completedItems / plan.totalItems) * 100);
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
        <p className="text-red-800">Error loading treatment plans. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Treatment Plans
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage patient treatment plans and track progress
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add New Plan
          </button>
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedPlan && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Treatment Plan Details
                  </h3>
                  <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-500">
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Patient</p>
                      <p className="text-sm text-gray-900">
                        {selectedPlan.patient?.demographics?.firstName} {selectedPlan.patient?.demographics?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Provider</p>
                      <p className="text-sm text-gray-900">
                        {selectedPlan.provider?.firstName} {selectedPlan.provider?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedPlan.status)}`}>
                        {selectedPlan.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Priority</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(selectedPlan.priority)}`}>
                        {selectedPlan.priority}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Title</h4>
                    <p className="text-sm text-gray-700">{selectedPlan.title}</p>
                  </div>

                  {selectedPlan.description && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPlan.description}</p>
                    </div>
                  )}

                  {/* Financial Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Financial Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                        <p className="text-sm font-semibold text-gray-900">${selectedPlan.estimatedCost?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Insurance Estimate</p>
                        <p className="text-sm text-gray-900">${selectedPlan.insuranceEstimate?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Patient Responsibility</p>
                        <p className="text-sm font-semibold text-blue-600">
                          ${((selectedPlan.estimatedCost || 0) - (selectedPlan.insuranceEstimate || 0)).toFixed(2)}
                        </p>
                      </div>
                      {selectedPlan.actualCost && selectedPlan.actualCost > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Actual Cost</p>
                          <p className="text-sm text-gray-900">${selectedPlan.actualCost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Progress</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-semibold">{calculateProgress(selectedPlan)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${calculateProgress(selectedPlan)}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm mt-2">
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold">{selectedPlan.totalItems || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pending</p>
                          <p className="font-semibold text-gray-600">{selectedPlan.pendingItems || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">In Progress</p>
                          <p className="font-semibold text-yellow-600">{selectedPlan.inProgressItems || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-semibold text-green-600">{selectedPlan.completedItems || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Plan Items */}
                  {selectedPlan.items && selectedPlan.items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Treatment Items</h4>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Procedure</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedPlan.items.map((item: any) => (
                              <tr key={item.id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.procedureName}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 capitalize">{item.itemType?.replace('_', ' ')}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-right font-semibold">${item.totalCost?.toFixed(2) || '0.00'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="text-gray-900">{formatDate(selectedPlan.createdAt)}</p>
                      </div>
                      {selectedPlan.startDate && (
                        <div>
                          <p className="text-gray-500">Start Date</p>
                          <p className="text-gray-900">{formatDate(selectedPlan.startDate)}</p>
                        </div>
                      )}
                      {selectedPlan.estimatedCompletionDate && (
                        <div>
                          <p className="text-gray-500">Est. Completion</p>
                          <p className="text-gray-900">{formatDate(selectedPlan.estimatedCompletionDate)}</p>
                        </div>
                      )}
                      {selectedPlan.proposedAt && (
                        <div>
                          <p className="text-gray-500">Proposed</p>
                          <p className="text-gray-900">{formatDate(selectedPlan.proposedAt)}</p>
                        </div>
                      )}
                      {selectedPlan.acceptedAt && (
                        <div>
                          <p className="text-gray-500">Accepted</p>
                          <p className="text-gray-900">{formatDate(selectedPlan.acceptedAt)}</p>
                        </div>
                      )}
                      {selectedPlan.completedAt && (
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="text-gray-900">{formatDate(selectedPlan.completedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPlan.notes && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPlan.notes}</p>
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
                placeholder="Search by patient, provider, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="proposed">Proposed</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="button"
              onClick={() => alert('Add Treatment Plan form coming soon!')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Plan
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No treatment plans found. Create your first treatment plan to get started.
                  </td>
                </tr>
              ) : (
                paginatedPlans.map((plan: TreatmentPlan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plan.patient?.demographics?.firstName} {plan.patient?.demographics?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {plan.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeColor(plan.priority)}`}>
                        {plan.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${calculateProgress(plan)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{calculateProgress(plan)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${plan.estimatedCost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => handleViewPlan(plan)}
                        className="text-blue-600 hover:text-blue-900 hover:underline mr-3"
                      >
                        View
                      </button>
                      {plan.status === TreatmentPlanStatus.DRAFT && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowEditForm(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline mr-3"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePropose(plan)}
                            className="text-green-600 hover:text-green-900 hover:underline mr-3"
                          >
                            Propose
                          </button>
                        </>
                      )}
                      {plan.status === TreatmentPlanStatus.PROPOSED && (
                        <button
                          type="button"
                          onClick={() => handleAccept(plan)}
                          className="text-green-600 hover:text-green-900 hover:underline mr-3"
                        >
                          Accept
                        </button>
                      )}
                      {(plan.status === TreatmentPlanStatus.ACCEPTED || plan.status === TreatmentPlanStatus.IN_PROGRESS) && (
                        <button
                          type="button"
                          onClick={() => handleComplete(plan)}
                          className="text-purple-600 hover:text-purple-900 hover:underline mr-3"
                        >
                          Complete
                        </button>
                      )}
                      {plan.status === TreatmentPlanStatus.DRAFT && (
                        <button
                          type="button"
                          onClick={() => handleDelete(plan.id)}
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
                    {Math.min(currentPage * pageSize, filteredPlans.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredPlans.length}</span> results
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

      {/* Create Form */}
      {showCreateForm && (
        <TreatmentPlanForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit Form */}
      {showEditForm && selectedPlan && (
        <TreatmentPlanForm
          plan={selectedPlan}
          onSuccess={() => {
            setShowEditForm(false);
            setSelectedPlan(null);
          }}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedPlan(null);
          }}
        />
      )}
      </div>
    </div>
  );
};

