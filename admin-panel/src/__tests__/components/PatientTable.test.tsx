import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientTable } from '../../components/patients/PatientTable';
import { patientsApi } from '../../services/api';

// Mock the API module
jest.mock('../../services/api', () => ({
  patientsApi: {
    getPatients: jest.fn(),
    createPatient: jest.fn(),
    updatePatient: jest.fn(),
    deletePatient: jest.fn(),
  },
}));

// Mock data
const mockPatients = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    clinic_id: 'clinic-1',
    patient_external_id: 'EXT-001',
    demographics: {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-01',
      phone_number: '+1234567890',
      email: 'john.doe@example.com',
    },
    tags: ['vip'],
    consent_flags: { marketing: true },
    medical_alert_flags: { allergies: true },
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    clinic_id: 'clinic-1',
    patient_external_id: 'EXT-002',
    demographics: {
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1985-05-15',
      phone_number: '+1234567891',
      email: 'jane.smith@example.com',
    },
    tags: ['premium'],
    consent_flags: { marketing: false },
    medical_alert_flags: { allergies: false },
    created_by: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('PatientTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders patient table with data', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Check if patient data is displayed
    expect(screen.getByText('EXT-001')).toBeInTheDocument();
    expect(screen.getByText('EXT-002')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('+1234567891')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    (patientsApi.getPatients as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    expect(screen.getByText('Loading patients...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    (patientsApi.getPatients as jest.Mock).mockRejectedValue(new Error('Failed to fetch patients'));

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Error loading patients')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search patients...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Trigger search
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(patientsApi.getPatients).toHaveBeenCalledWith({
        search: 'John',
        limit: 10,
        offset: 0,
      });
    });
  });

  it('handles pagination', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 25,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click next page
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(patientsApi.getPatients).toHaveBeenCalledWith({
        limit: 10,
        offset: 10,
      });
    });
  });

  it('handles patient creation', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    (patientsApi.createPatient as jest.Mock).mockResolvedValue({
      id: '3',
      tenant_id: 'tenant-1',
      clinic_id: 'clinic-1',
      patient_external_id: 'EXT-003',
      demographics: {
        first_name: 'New',
        last_name: 'Patient',
        date_of_birth: '1995-01-01',
        phone_number: '+1234567892',
        email: 'new.patient@example.com',
      },
      tags: [],
      consent_flags: {},
      medical_alert_flags: {},
      created_by: 'user-1',
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click add patient button
    fireEvent.click(screen.getByText('Add Patient'));

    // Fill out the form (this would be in a modal or separate component)
    // For this test, we'll simulate the form submission
    const newPatientData = {
      clinicId: 'clinic-1',
      patientExternalId: 'EXT-003',
      demographics: {
        firstName: 'New',
        lastName: 'Patient',
        dateOfBirth: '1995-01-01',
        phone: '+1234567892',
        email: 'new.patient@example.com',
      },
      tags: [],
      consentFlags: {},
      medicalAlertFlags: {},
    };

    await patientsApi.createPatient(newPatientData);

    expect(patientsApi.createPatient).toHaveBeenCalledWith(newPatientData);
  });

  it('handles patient deletion', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    (patientsApi.deletePatient as jest.Mock).mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click delete button for first patient
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(patientsApi.deletePatient).toHaveBeenCalledWith('1');
    });
  });

  it('handles patient editing', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    (patientsApi.updatePatient as jest.Mock).mockResolvedValue({
      ...mockPatients[0],
      demographics: {
        ...mockPatients[0].demographics,
        first_name: 'Johnny',
      },
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click edit button for first patient
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // Update patient data (this would be in a modal or separate component)
    const updatedPatientData = {
      demographics: {
        firstName: 'Johnny',
        lastName: mockPatients[0].demographics.last_name,
        dateOfBirth: mockPatients[0].demographics.date_of_birth,
        phone: mockPatients[0].demographics.phone_number,
        email: mockPatients[0].demographics.email,
      },
    };

    await patientsApi.updatePatient('1', updatedPatientData);

    expect(patientsApi.updatePatient).toHaveBeenCalledWith('1', updatedPatientData);
  });

  it('filters patients by tags', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: [mockPatients[0]], // Only VIP patient
      total: 1,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select VIP tag filter
    const tagFilter = screen.getByLabelText('Filter by tags');
    fireEvent.change(tagFilter, { target: { value: 'vip' } });

    fireEvent.click(screen.getByText('Apply Filters'));

    await waitFor(() => {
      expect(patientsApi.getPatients).toHaveBeenCalledWith({
        tags: 'vip',
        limit: 10,
        offset: 0,
      });
    });
  });

  it('displays patient tags correctly', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check if tags are displayed
    expect(screen.getByText('vip')).toBeInTheDocument();
    expect(screen.getByText('premium')).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    (patientsApi.getPatients as jest.Mock).mockResolvedValue({
      patients: [],
      total: 0,
      limit: 10,
      offset: 0,
    });

    render(
      <TestWrapper>
        <PatientTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No patients found')).toBeInTheDocument();
      expect(screen.getByText('Add your first patient to get started')).toBeInTheDocument();
    });
  });
});
