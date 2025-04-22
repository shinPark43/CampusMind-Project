// BookingPage.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Image, useWindowDimensions, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from '../components/theme';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';

const SPORTS = [
  { name: 'Badminton', icon: 'https://img.icons8.com/color/48/000000/badminton.png' },
  { name: 'Basketball', icon: 'https://img.icons8.com/color/48/000000/basketball.png' },
  { name: 'Table Tennis', icon: 'https://img.icons8.com/color/48/000000/table-tennis.png' },
  { name: 'Pickleball', icon: 'https://img.icons8.com/color/48/000000/pickle-ball.png' },
];

// Generate 30-Minute Time Slots based on day of the week
const generateTimeSlots = (dateString) => {
  console.log('Generating time slots for date:', dateString);
  
  if (!dateString) {
    console.log('No date string provided, returning empty array');
    return [];
  }
  
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  console.log('Day of week:', dayOfWeek);

  let start, end;

  if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Monday to Thursday
    start = '13:00'; // 1 PM
    end = '23:00';   // 11 PM
  } else if (dayOfWeek === 5) { // Friday
    start = '13:00'; // 1 PM
    end = '20:00';   // 8 PM
  } else { // Saturday and Sunday
    start = '12:00'; // 12 PM
    end = '20:00';   // 8 PM
  }
  
  console.log('Time range:', start, 'to', end);

  const slots = [];
  let [hour, minute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  // Convert end time to minutes for easier comparison
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  // Generate 30-minute slots
  while (hour * 60 + minute < endTimeInMinutes) {
    const currentTime = `${hour}:${String(minute).padStart(2, '0')}`;
    const formattedSlot = formatTimeToAMPM(currentTime);
    slots.push(formattedSlot);
    
    // Move to the next 30-minute slot
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  
  console.log('Generated slots:', slots);
  return slots;
};

// Format time from 24-hour to 12-hour with AM/PM
const formatTimeToAMPM = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${formattedHour}:${String(minute).padStart(2, '0')} ${period}`;
};

// Format Time Slots (30-min blocks & consecutive grouping)
const formatTimeSlots = (slots) => {
  if (slots.length === 0) return '';

  const sortedSlots = slots
    .map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      return hour * 60 + minute; // Convert to total minutes
    })
    .sort((a, b) => a - b);

  const ranges = [];
  let start = sortedSlots[0];
  let end = start + 30;

  for (let i = 1; i < sortedSlots.length; i++) {
    if (sortedSlots[i] === end) {
      end = sortedSlots[i] + 30;
    } else {
      ranges.push(`${formatTime(start)} - ${formatTime(end)}`);
      start = sortedSlots[i];
      end = start + 30;
    }
  }
  ranges.push(`${formatTime(start)} - ${formatTime(end)}`);

  return ranges.join(', ');
};

// ✅ Convert Minutes Back to HH:MM
const formatTime = (totalMinutes) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const formattedHour = hour > 12 ? hour - 12 : hour; // Convert to 12-hour format
  return `${formattedHour}:${String(minute).padStart(2, '0')} PM`; // Add "PM"
};

const BookingPage = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [availableCourts, setAvailableCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeSelectionError, setTimeSelectionError] = useState('');

  // Fetch available courts when sport is selected
  useEffect(() => {
    if (selectedSport) {
      fetchAvailableCourts(selectedSport.name);
    }
  }, [selectedSport]);

  const fetchAvailableCourts = async () => {
    if (!selectedSport || !selectedDate || selectedTimeSlots.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in to book a court");
        router.push('/login');
        return;
      }

      // Get the start and end times from the selected time slots
      const startTime = selectedTimeSlots[0];
      const endTime = selectedTimeSlots[selectedTimeSlots.length - 1];
      
      // Convert times to 24-hour format for the API
      const startTime24 = moment(startTime, ["h:mm A"]).format("HH:mm");
      const endTime24 = moment(endTime, ["h:mm A"]).format("HH:mm");

      console.log('Fetching available courts for:', {
        sportName: selectedSport.name,
        date: selectedDate,
        startTime: startTime24,
        endTime: endTime24
      });

      const url = `${process.env.EXPO_PUBLIC_API_URL}/reservations/checkCourtAvailability?sportName=${encodeURIComponent(selectedSport.name)}&date=${encodeURIComponent(selectedDate)}&startTime=${encodeURIComponent(startTime24)}&endTime=${encodeURIComponent(endTime24)}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Available courts:', data);

      if (response.ok) {
        setAvailableCourts(data);
        if (data.length === 0) {
          Alert.alert('No Available Courts', 'There are no available courts for the selected time. Please try a different time or date.');
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch available courts');
      }
    } catch (error) {
      console.error('Error fetching available courts:', error);
      Alert.alert('Error', `Failed to fetch available courts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setCurrentStep(2);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    setCurrentStep(5);
  };

  const handleDateSelect = (date) => {
    console.log('Date selected:', date);
    if (date && date.dateString) {
      setSelectedDate(date.dateString);
      setShowDatePicker(false);
      setCurrentStep(3); // Move to time selection step
    } else {
      console.error('Invalid date object:', date);
      Alert.alert('Error', 'Invalid date selected');
    }
  };

  const handleTimeSelect = (time) => {
    console.log('Time selected:', time);
    
    // Check if time is already selected
    const isAlreadySelected = selectedTimeSlots.includes(time);
    
    if (isAlreadySelected) {
      // Remove the time if it's already selected
      setSelectedTimeSlots(selectedTimeSlots.filter(t => t !== time));
      setTimeSelectionError('');
    } else {
      // Add the time if it's not already selected
      const newSelectedSlots = [...selectedTimeSlots, time].sort();
      
      // Check if the selection exceeds 3 hours
      if (newSelectedSlots.length > 6) { // 6 slots = 3 hours (30 min each)
        setTimeSelectionError('You can only select up to 3 hours of time slots');
        return;
      }
      
      // Check if the selection is continuous
      const isContinuous = checkContinuousSlots(newSelectedSlots);
      if (!isContinuous) {
        setTimeSelectionError('Please select continuous time slots');
        return;
      }
      
      setSelectedTimeSlots(newSelectedSlots);
      setTimeSelectionError('');
    }
  };

  const checkContinuousSlots = (slots) => {
    if (slots.length <= 1) return true;
    
    // Convert all times to minutes for easier comparison
    const timeInMinutes = slots.map(time => {
      const [timeStr, period] = time.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    });
    
    // Sort the times
    timeInMinutes.sort((a, b) => a - b);
    
    // Check if each slot is 30 minutes after the previous one
    for (let i = 1; i < timeInMinutes.length; i++) {
      if (timeInMinutes[i] - timeInMinutes[i-1] !== 30) {
        return false;
      }
    }
    
    return true;
  };

  const formatSelectedTimeRange = () => {
    if (selectedTimeSlots.length === 0) return '';
    
    const startTime = selectedTimeSlots[0];
    const lastSelectedTime = selectedTimeSlots[selectedTimeSlots.length - 1];
    
    // Calculate the end time by adding 30 minutes to the last selected time
    const [timeStr, period] = lastSelectedTime.split(' ');
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Add 30 minutes
    minutes += 30;
    if (minutes >= 60) {
      minutes = minutes % 60;
      hours += 1;
    }
    if (hours >= 24) {
      hours = hours % 24;
    }
    
    // Convert back to 12-hour format
    const endPeriod = hours >= 12 ? 'PM' : 'AM';
    const endHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const endTime = `${endHours}:${String(minutes).padStart(2, '0')} ${endPeriod}`;
    
    // Calculate the duration in hours
    const durationHours = selectedTimeSlots.length * 0.5;
    
    return `${startTime} - ${endTime} (${durationHours} hours)`;
  };

  const handleBooking = async () => {
    if (!selectedSport || !selectedCourt || !selectedDate || selectedTimeSlots.length === 0) {
      Alert.alert('Error', 'Please complete all booking details');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please log in to book a court");
        router.push('/login');
        return;
      }

      // Get the start and end times from the selected time slots
      const startTime = selectedTimeSlots[0];
      const endTime = selectedTimeSlots[selectedTimeSlots.length - 1];
      const timeRange = `${startTime} - ${endTime}`;
      
      // Calculate duration in hours
      const durationHours = selectedTimeSlots.length * 0.5;

      console.log('Booking details:', {
        sportName: selectedSport.name,
        courtName: selectedCourt.court_name,
        date: selectedDate,
        startTime,
        endTime,
        duration: `${durationHours} hours`
      });

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reservations/createReservation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sportName: selectedSport.name,
          courtName: selectedCourt.court_name,
          date: selectedDate,
          time: timeRange,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Reset all booking states
        setSelectedSport(null);
        setSelectedCourt(null);
        setSelectedDate(null);
        setSelectedTimeSlots([]);
        setCurrentStep(1);
        setTimeSelectionError('');
        
        Alert.alert('Success', 'Court booked successfully!', [
          { 
            text: 'OK', 
            onPress: () => router.push('/Status') 
          }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to book court');
      }
    } catch (error) {
      console.error('Error booking court:', error);
      Alert.alert('Error', 'Failed to book court');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[styles.step, currentStep >= step && styles.activeStep]}>
            <Text style={[styles.stepText, currentStep >= step && styles.activeStepText]}>
              {step}
            </Text>
          </View>
          {step < 4 && (
            <View style={[styles.stepLine, currentStep > step && styles.activeStepLine]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderSportSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select a Sport</Text>
      <Text style={styles.stepSubtitle}>Choose the sport you want to play</Text>
      
      <View style={styles.sportGrid}>
        {SPORTS.map((sport) => (
          <TouchableOpacity
            key={sport.name}
            style={[
              styles.sportCard, 
              selectedSport?.name === sport.name && styles.selectedCard
            ]}
            onPress={() => handleSportSelect(sport)}
          >
            <View style={styles.sportIconContainer}>
              <Image source={{ uri: sport.icon }} style={styles.sportIcon} />
            </View>
            <Text style={[
              styles.sportName,
              selectedSport?.name === sport.name && styles.selectedSportName
            ]}>
              {sport.name}
            </Text>
            {selectedSport?.name === sport.name && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.navButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !selectedSport && styles.disabledButton]}
          onPress={() => setCurrentStep(2)}
          disabled={!selectedSport}
        >
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCourtSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select a Court</Text>
      <Text style={styles.stepSubtitle}>
        Available courts for {selectedSport?.name} on {selectedDate} from {formatSelectedTimeRange()}
      </Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : availableCourts.length > 0 ? (
        <FlatList
          data={availableCourts}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.courtCard, selectedCourt?._id === item._id && styles.selectedCard]}
              onPress={() => handleCourtSelect(item)}
            >
              <View style={styles.courtInfo}>
                <Text style={styles.courtName}>{item.court_name}</Text>
                <Text style={styles.courtStatus}>
                  Available
                </Text>
              </View>
              {item.is_shared && (
                <View style={styles.sharedBadge}>
                  <Text style={styles.sharedText}>Shared</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
        />
      ) : (
        <View style={styles.noCourtsContainer}>
          <Text style={styles.noCourtsText}>No available courts found for the selected time.</Text>
          <Text style={styles.noCourtsSubtext}>Please try a different time or date.</Text>
        </View>
      )}
      
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !selectedCourt && styles.disabledButton]}
          onPress={() => setCurrentStep(5)}
          disabled={!selectedCourt}
        >
          <Text style={styles.navButtonText}>Review Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDateSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date</Text>
      <Calendar
        onDayPress={handleDateSelect}
        minDate={new Date().toISOString().split('T')[0]}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: COLORS.primary }
        }}
        theme={{
          selectedDayBackgroundColor: COLORS.primary,
          todayTextColor: COLORS.primary,
          arrowColor: COLORS.primary,
        }}
      />
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTimeSelection = () => {
    console.log('Rendering time selection for date:', selectedDate);
    const timeSlots = generateTimeSlots(selectedDate);
    console.log('Generated time slots:', timeSlots);
    
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Select Time</Text>
        <Text style={styles.timeSelectionInfo}>
          Select up to 3 hours of continuous time slots (30-minute increments)
        </Text>
        {timeSelectionError ? (
          <Text style={styles.errorText}>{timeSelectionError}</Text>
        ) : null}
        <ScrollView>
          {timeSlots.length > 0 ? (
            timeSlots.map((timeSlot) => (
              <TouchableOpacity
                key={timeSlot}
                style={[
                  styles.timeSlot, 
                  selectedTimeSlots.includes(timeSlot) && styles.selectedTimeSlot
                ]}
                onPress={() => handleTimeSelect(timeSlot)}
              >
                <Text style={[
                  styles.timeText, 
                  selectedTimeSlots.includes(timeSlot) && styles.selectedTimeText
                ]}>
                  {timeSlot}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTimeSlotsText}>No time slots available for this date</Text>
          )}
        </ScrollView>
        {selectedTimeSlots.length > 0 && (
          <View style={styles.selectedTimeRangeContainer}>
            <Text style={styles.selectedTimeRangeLabel}>Selected Time Range:</Text>
            <Text style={styles.selectedTimeRangeText}>{formatSelectedTimeRange()}</Text>
          </View>
        )}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={() => setCurrentStep(2)}
          >
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton, selectedTimeSlots.length === 0 && styles.disabledButton]}
            onPress={handleTimeSelectionComplete}
            disabled={selectedTimeSlots.length === 0}
          >
            <Text style={styles.navButtonText}>Find Available Courts</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBookingSummary = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Booking Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Sport:</Text>
          <Text style={styles.summaryValue}>{selectedSport.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Court:</Text>
          <Text style={styles.summaryValue}>{selectedCourt.court_name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date:</Text>
          <Text style={styles.summaryValue}>{selectedDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{formatSelectedTimeRange()}</Text>
        </View>
      </View>
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={[styles.navButton, styles.backButton]}
          onPress={() => setCurrentStep(4)}
        >
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.confirmButton]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.navButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleTimeSelectionComplete = () => {
    if (selectedTimeSlots.length === 0) {
      Alert.alert('Error', 'Please select at least one time slot');
      return;
    }
    
    // Fetch available courts based on the selected sport, date, and time
    fetchAvailableCourts();
    setCurrentStep(4); // Move to court selection step
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {renderStepIndicator()}
        
        <View style={styles.stepsContainer}>
          {currentStep === 1 && renderSportSelection()}
          {currentStep === 2 && renderDateSelection()}
          {currentStep === 3 && renderTimeSelection()}
          {currentStep === 4 && renderCourtSelection()}
          {currentStep === 5 && renderBookingSummary()}
        </View>
      </View>

      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {renderDateSelection()}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 80, // Add padding to prevent overlap with tabs
  },
  stepsContainer: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: COLORS.primary,
  },
  stepText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeStepText: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e9ecef',
    marginHorizontal: 5,
  },
  activeStepLine: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212529',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  sportCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#f8f9fa',
  },
  sportIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sportIcon: {
    width: 50,
    height: 50,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  selectedSportName: {
    color: COLORS.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courtCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courtInfo: {
    flex: 1,
  },
  courtName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 5,
  },
  courtStatus: {
    fontSize: 14,
    color: '#6c757d',
  },
  sharedBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  sharedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeSlot: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.primary,
  },
  timeText: {
    fontSize: 16,
    color: '#212529',
  },
  selectedTimeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  navButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    minHeight: 50,
  },
  backButton: {
    backgroundColor: '#6c757d',
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#212529',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  timeSlotScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  noTimeSlotsText: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  timeSelectionInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  selectedTimeRangeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  selectedTimeRangeLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  selectedTimeRangeText: {
    fontSize: 16,
    color: '#212529',
  },
  noCourtsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noCourtsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 10,
  },
  noCourtsSubtext: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default BookingPage;
