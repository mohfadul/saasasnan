import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../services/billing-api';
import { InsuranceProvider } from '../../types/billing';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { format, isValid, parseISO } from 'date-fns';

// Helper function to safely format dates
const formatDate = (date: any, formatStr: string = 'MMM dd, yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (!isValid(parsedDate)) return 'N/A';
    return format(parsedDate, formatStr);
  } catch (error) {
    return 'N/A';
  }
};

export const InsuranceProviderTable: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
  });
  const [selectedProvider, setSelectedProvider] = useState<InsuranceProvider | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ['insurance-providers', filters],
    queryFn: () => billingApi.insuranceProviders.getAll(filters.status || undefined),
    retry: false,
  });

  const deleteProviderMutation = useMutation({
    mutationFn: billingApi.insuranceProviders.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
      alert('Insurance provider deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting provider: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleDeleteProvider = (providerId: string) => {
    if (window.confirm('Are you sure you want to delete this insurance provider? This action cannot be undone.')) {
      deleteProviderMutation.mutate(providerId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil((providers?.length || 0) / pageSize);
  const paginatedProviders = providers?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 m-4">
        <p className="text-red-800 font-semibold text-lg">⚠️ Error Loading Insurance Providers</p>
        <p className="text-red-700 mt-2">{(error as any).message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar with Add Provider Button */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Showing {paginatedProviders.length} of {providers?.length || 0} insurance providers
          </p>
        </div>
        <button
          type="button"
          onClick={() => alert('Add Insurance Provider form coming soon! Database schema is ready.')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Insurance Provider Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProviders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium text-gray-900">No insurance providers found</p>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first insurance provider.</p>
                    <button
                      onClick={() => alert('Add Insurance Provider form coming soon!')}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Add Provider
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedProviders.map((provider: InsuranceProvider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                          <div className="text-xs text-gray-500">{provider.contact_info?.code || provider.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.contact_info?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {provider.contact_info?.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(provider.status || 'active')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(provider.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => {
                          setSelectedProvider(provider);
                          setShowViewModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                        title="View Provider"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => alert('Edit provider form coming soon!')}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                        title="Edit Provider"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Delete Provider"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
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
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, providers.length)}</span> of{' '}
                  <span className="font-medium">{providers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 10))].map((_, idx) => (
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
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Provider Modal */}
      {showViewModal && selectedProvider && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowViewModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Insurance Provider</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedProvider.name}</p>
                  </div>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-3xl">&times;</span>
                  </button>
                </div>

                {/* Provider Info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Provider ID</p>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedProvider.id.substring(0, 13)}...</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedProvider.status || 'active')}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                      {selectedProvider.contact_info?.email && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Email:</span> {selectedProvider.contact_info.email}
                        </p>
                      )}
                      {selectedProvider.contact_info?.phone && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Phone:</span> {selectedProvider.contact_info.phone}
                        </p>
                      )}
                      {selectedProvider.contact_info?.website && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Website:</span>{' '}
                          <a href={selectedProvider.contact_info.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            {selectedProvider.contact_info.website}
                          </a>
                        </p>
                      )}
                      {(!selectedProvider.contact_info?.email && !selectedProvider.contact_info?.phone && !selectedProvider.contact_info?.website) && (
                        <p className="text-sm text-gray-500">No contact information available</p>
                      )}
                    </div>
                  </div>

                  {selectedProvider.contact_info?.address && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Address</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {typeof selectedProvider.contact_info.address === 'string' 
                            ? selectedProvider.contact_info.address 
                            : JSON.stringify(selectedProvider.contact_info.address, null, 2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedProvider.coverage_details && Object.keys(selectedProvider.coverage_details).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Coverage Details</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedProvider.coverage_details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Copay Information</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Copay Percentage:</span> {selectedProvider.copay_percentage}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => alert('Edit provider form coming soon!')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Edit Provider
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
    </div>
  );
};
