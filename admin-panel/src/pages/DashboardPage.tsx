import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { MetricCard } from '../components/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PatientTable } from '../components/patients/PatientTable';
import { patientsApi, appointmentsApi } from '../services/api';

const recentAppointments = [
  { id: 1, patient: "John Smith", time: "9:00 AM", type: "Check-up", status: "confirmed" },
  { id: 2, patient: "Sarah Johnson", time: "10:30 AM", type: "Cleaning", status: "confirmed" },
  { id: 3, patient: "Mike Wilson", time: "2:00 PM", type: "Consultation", status: "pending" },
  { id: 4, patient: "Emma Davis", time: "3:30 PM", type: "Follow-up", status: "confirmed" },
];

export const DashboardPage: React.FC = () => {
  const { data: patientStats, isLoading: patientStatsLoading } = useQuery({
    queryKey: ['patient-stats'],
    queryFn: () => patientsApi.getPatientStats(),
  });

  const { data: appointmentStats, isLoading: appointmentStatsLoading } = useQuery({
    queryKey: ['appointment-stats'],
    queryFn: () => appointmentsApi.getAppointmentStats(),
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Patients"
          value={patientStatsLoading ? '...' : patientStats?.totalPatients || 0}
          icon={Users}
          trend={{ value: "12% from last month", positive: true }}
        />
        <MetricCard
          title="Today's Appointments"
          value={appointmentStatsLoading ? '...' : appointmentStats?.total || 0}
          icon={Calendar}
          trend={{ value: "3 pending", positive: false }}
        />
        <MetricCard
          title="Monthly Revenue"
          value="$48,392"
          icon={DollarSign}
          trend={{ value: "18% from last month", positive: true }}
        />
        <MetricCard
          title="Patient Satisfaction"
          value="98.5%"
          icon={TrendingUp}
          trend={{ value: "2.1% from last month", positive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Schedule</span>
              <Button size="sm" variant="outline">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{appointment.patient}</p>
                      <p className="text-sm text-muted-foreground">{appointment.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{appointment.time}</p>
                    <Badge
                      variant={appointment.status === "confirmed" ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {appointment.status === "confirmed" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : null}
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button className="w-full justify-start h-auto py-4 bg-gradient-primary hover:opacity-90 transition-opacity shadow-md">
                <Calendar className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Schedule Appointment</div>
                  <div className="text-xs opacity-90">Book a new patient visit</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-muted/50">
                <Users className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Add New Patient</div>
                  <div className="text-xs text-muted-foreground">Register a new patient</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-muted/50">
                <TrendingUp className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">View Reports</div>
                  <div className="text-xs text-muted-foreground">Access analytics and insights</div>
                </div>
              </Button>
              
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-muted/50">
                <DollarSign className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Process Payment</div>
                  <div className="text-xs text-muted-foreground">Handle billing and invoices</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Appointment Rate</span>
                <span className="text-sm font-bold text-success">94%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary w-[94%] rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Patient Retention</span>
                <span className="text-sm font-bold text-success">87%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary w-[87%] rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Treatment Completion</span>
                <span className="text-sm font-bold text-success">91%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-primary w-[91%] rounded-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Patients */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-4">Recent Patients</h3>
        <PatientTable />
      </div>
    </div>
  );
};
