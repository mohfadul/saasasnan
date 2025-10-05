import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar } from 'react-native-calendars';
import DatePicker from 'react-native-date-picker';

import apiService from '../../services/api';

const BookAppointmentScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const queryClient = useQueryClient();

  // Fetch providers
  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: () => apiService.getProviders(),
  });

  // Fetch available time slots
  const { data: availableSlots } = useQuery({
    queryKey: ['available-slots', selectedProvider, selectedDate],
    queryFn: () => apiService.getAvailableSlots(selectedProvider, selectedDate),
    enabled: !!selectedProvider && !!selectedDate,
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: (appointmentData: any) => apiService.bookAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      Alert.alert('Success', 'Appointment booked successfully!');
      // Navigate back
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to book appointment');
    },
  });

  const appointmentTypes = [
    'General Consultation',
    'Cleaning',
    'Filling',
    'Extraction',
    'Root Canal',
    'Crown',
    'Orthodontic Consultation',
    'Emergency',
  ];

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !selectedProvider || !appointmentType) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const appointmentData = {
      provider_id: selectedProvider,
      appointment_type: appointmentType,
      preferred_date: selectedDate,
      preferred_time_start: selectedTime,
      preferred_time_end: selectedTime,
      reason: reason,
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  const getAvailableDates = () => {
    const dates: any = {};
    const today = new Date();
    
    // Mark next 30 days as available
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      dates[dateString] = {
        disabled: false,
        marked: selectedDate === dateString,
        selectedColor: '#2563eb',
      };
    }
    
    return dates;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Appointment Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.optionsContainer}>
            {appointmentTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  appointmentType === type && styles.selectedOption,
                ]}
                onPress={() => setAppointmentType(type)}
              >
                <Text
                  style={[
                    styles.optionText,
                    appointmentType === type && styles.selectedOptionText,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Provider Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Provider</Text>
          <View style={styles.optionsContainer}>
            {providers?.map((provider: any) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerButton,
                  selectedProvider === provider.id && styles.selectedProvider,
                ]}
                onPress={() => setSelectedProvider(provider.id)}
              >
                <Text
                  style={[
                    styles.providerText,
                    selectedProvider === provider.id && styles.selectedProviderText,
                  ]}
                >
                  Dr. {provider.profile?.first_name} {provider.profile?.last_name}
                </Text>
                <Text style={styles.providerSpecialty}>
                  {provider.specialty || 'General Dentistry'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={getAvailableDates()}
            theme={{
              selectedDayBackgroundColor: '#2563eb',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2563eb',
              dayTextColor: '#374151',
              textDisabledColor: '#d1d5db',
              arrowColor: '#2563eb',
              monthTextColor: '#1f2937',
              indicatorColor: '#2563eb',
            }}
          />
        </View>

        {/* Time Selection */}
        {selectedDate && availableSlots && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeSlotsContainer}>
              {availableSlots.map((slot: any) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot.time && styles.selectedTimeSlot,
                  ]}
                  onPress={() => setSelectedTime(slot.time)}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === slot.time && styles.selectedTimeSlotText,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason (Optional)</Text>
          <View style={styles.inputContainer}>
            <Text
              style={styles.reasonInput}
              placeholder="Briefly describe your reason for the appointment"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            bookAppointmentMutation.isPending && styles.disabledButton,
          ]}
          onPress={handleBookAppointment}
          disabled={bookAppointmentMutation.isPending}
        >
          <Text style={styles.bookButtonText}>
            {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  providerButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    width: '100%',
  },
  selectedProvider: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  providerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedProviderText: {
    color: '#2563eb',
  },
  providerSpecialty: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#ffffff',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 15,
  },
  reasonInput: {
    fontSize: 16,
    color: '#374151',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BookAppointmentScreen;
