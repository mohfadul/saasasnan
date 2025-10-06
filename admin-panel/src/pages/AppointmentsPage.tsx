import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfWeek } from 'date-fns';
import { Calendar, Clock, Users, Plus } from 'lucide-react';
import { appointmentsApi } from '../services/api';
import { AppointmentForm } from '../components/appointments/AppointmentForm';
import { AppointmentTable } from '../components/appointments/AppointmentTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const AppointmentsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'list'>('list');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => appointmentsApi.getAppointments({
      startDate: selectedDate,
      endDate: format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'),
    }),
  });

  const { data: stats } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: () => appointmentsApi.getAppointmentStats(),
  });

  return (
    <>
      {showForm && (
        <AppointmentForm
          onSuccess={() => {
            setShowForm(false);
            alert('Appointment created successfully!');
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Appointments
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage appointments and scheduling
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.completed || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <Button 
              variant="outline" 
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            >
              Today
            </Button>
          </div>
        </div>

        {/* Appointments Table */}
        <AppointmentTable />
      </div>
    </>
  );
};

export default AppointmentsPage;

