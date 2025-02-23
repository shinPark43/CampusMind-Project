import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Image, useWindowDimensions, Modal, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from './theme';
import { Calendar } from 'react-native-calendars';

const COURTS = [
  { name: 'Badminton', icon: 'https://img.icons8.com/color/48/000000/badminton.png' },
  { name: 'Basketball', icon: 'https://img.icons8.com/color/48/000000/basketball.png' },
  { name: 'Table Tennis', icon: 'https://img.icons8.com/color/48/000000/table-tennis.png' },
  { name: 'Pickleball', icon: 'https://img.icons8.com/color/48/000000/pickle-ball.png' },
];

// ✅ Generate 30-Minute Time Slots from 07:00 to 23:00
const generateTimeSlots = (start = '07:00', end = '23:00') => {
  const slots = [];
  let [hour, minute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  while (hour < endHour || (hour === endHour && minute <= endMinute)) {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    slots.push(time);
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour++;
    }
  }
  return slots;
};

// ✅ Format Time Slots (30-min blocks & consecutive grouping)
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
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const BookingPage = () => {
  const { width } = useWindowDimensions();
  const [selectedCourt, setSelectedCourt] = useState('');
  const [formattedDate, setFormattedDate] = useState('');
  const [tempSelectedDate, setTempSelectedDate] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [tempSelectedTimeSlots, setTempSelectedTimeSlots] = useState([]); // ✅ Temporary State for Time Picker
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const timeSlots = generateTimeSlots();

  // ✅ Booking Confirmation
  const handleBooking = () => {
    if (!selectedCourt || !formattedDate || selectedTimeSlots.length === 0) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }
    const formattedTimes = formatTimeSlots(selectedTimeSlots);
    Alert.alert('Success', `Your booking for ${selectedCourt} on ${formattedDate} at ${formattedTimes} has been confirmed!`);
    setSelectedCourt('');
    setFormattedDate('');
    setSelectedTimeSlots([]);
  };

  // ✅ Court Selection
  const renderCourtItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.courtItem,
        { width: width * 0.28 },
        selectedCourt === item.name && styles.selectedCourt
      ]}
      onPress={() => setSelectedCourt(item.name)}
    >
      <Image source={{ uri: item.icon }} style={styles.icon} />
      <Text style={styles.courtText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // ✅ Calendar Modal Functions
  const showCalendar = () => {
    if (!selectedCourt) {
      Alert.alert('Attention', 'Please select a sport first');
      return;
    }
    setCalendarVisible(true);
  };
  
  const hideCalendar = () => setCalendarVisible(false);

  const handleDateSelect = (day) => setTempSelectedDate(day.dateString);
  const confirmDate = () => {
    setFormattedDate(tempSelectedDate);
    hideCalendar();
  };
  const cancelDateSelection = () => {
    setTempSelectedDate('');
    hideCalendar();
  };

  // ✅ Time Picker Modal Functions
  const showTimePicker = () => {
    if (!selectedCourt) {
      Alert.alert('Attention', 'Please select a sport first');
      return;
    }
    if (!formattedDate) {
      Alert.alert('Attention', 'Please select a date first');
      return;
    }
    setTempSelectedTimeSlots([...selectedTimeSlots]);
    setTimePickerVisible(true);
  };
  
  const hideTimePicker = () => setTimePickerVisible(false);

  const toggleTimeSlot = (time) => {
    let updatedSlots = [...tempSelectedTimeSlots];

    if (updatedSlots.includes(time)) {
      updatedSlots = updatedSlots.filter((t) => t !== time);
    } else if (updatedSlots.length < 6) {
      updatedSlots.push(time);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 3 hours (6 slots).');
    }

    setTempSelectedTimeSlots(updatedSlots.sort());
  };

  // ✅ Confirm or Cancel Time Selection
  const confirmTimeSelection = () => {
    setSelectedTimeSlots([...tempSelectedTimeSlots]); // ✅ Apply temp selection
    hideTimePicker();
  };

  const cancelTimeSelection = () => {
    setTempSelectedTimeSlots([]); // ✅ Revert to previous selection
    hideTimePicker();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Booking System</Text>


      <Text style={styles.inform}>Please choose a sport (swipe left or right)</Text>
      {/* ✅ Court Selection */}
      <View style={styles.courtListWrapper}>
        <FlatList
          data={COURTS}
          renderItem={renderCourtItem}
          keyExtractor={(item) => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courtList}
        />
      </View>

      <Text style={styles.inform}>Please choose a date and time to continue</Text>

      {/* ✅ Date & Time Selection */}
      <View style={styles.formWrapper}>
        <TouchableOpacity style={styles.dateButton} onPress={showCalendar}>
          <Text style={{ color: formattedDate ? COLORS.textPrimary : '#ccc' }}>
            {formattedDate || 'Select Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateButton} onPress={showTimePicker}>
          <Text style={{ color: selectedTimeSlots.length > 0 ? COLORS.textPrimary : '#ccc' }}>
            {selectedTimeSlots.length > 0 ? formatTimeSlots(selectedTimeSlots) : 'Select Time'}
          </Text>
        </TouchableOpacity>
      </View>
        
      {/* ✅ Booking Summary */}
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        <Text style={styles.summaryText}>Name: Student Name</Text>
        <Text style={styles.summaryText}>Email: Student Email</Text>
        <Text style={styles.summaryText}>Sport: {selectedCourt || 'N/A'}</Text>
        <Text style={styles.summaryText}>Date: {formattedDate || 'N/A'}</Text>
        <Text style={styles.summaryText}>
          Time: {selectedTimeSlots.length > 0 ? formatTimeSlots(selectedTimeSlots) : 'N/A'}
        </Text>
      </View>

      <View style={styles.formWrapper}>
        <TouchableOpacity style={styles.button} onPress={handleBooking}>
          <Text style={styles.buttonText}>Confirm Booking</Text>
        </TouchableOpacity>

        <Link href="/explore" style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back to Home</Text>
        </Link>
      </View>

      {/* ✅ Calendar Modal */}
      <Modal transparent={true} animationType="slide" visible={isCalendarVisible} onRequestClose={hideCalendar}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [tempSelectedDate]: { selected: true, marked: true, selectedColor: COLORS.button },
              }}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                selectedDayBackgroundColor: COLORS.button,
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
              }}
            />

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmDate} disabled={!tempSelectedDate}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={cancelDateSelection}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Time Picker Modal */}
      <Modal transparent={true} animationType="slide" visible={isTimePickerVisible} onRequestClose={hideTimePicker}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.timePickerHeader}>Select Time Slots (3 Hours Max)</Text>
            <ScrollView contentContainerStyle={styles.timeSlotGrid}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    tempSelectedTimeSlots.includes(time) && styles.selectedTimeSlot,
                  ]}
                  onPress={() => toggleTimeSlot(time)}
                >
                  <Text style={styles.timeSlotText}>{time}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmTimeSelection}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={cancelTimeSelection}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: '10%',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: '10%',
    color: COLORS.textPrimary,
  },
  inform: {
    marginBottom: 10,
    color: COLORS.textPrimary,
    textAlign: 'left',
    alignSelf: 'flex-start', // 👈 Ensures the text starts at the container's left
  },
  courtListWrapper: {
    height: 100,
    marginBottom: 15,
  },
  courtList: {
    alignItems: 'center',
  },
  courtItem: {
    height: 90,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCourt: {
    backgroundColor: COLORS.button,
  },
  courtText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  icon: {
    width: '40%',
    height: '50%',
  },
  formWrapper: {
    width: '100%',
  },
  dateButton: {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.button,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 10,
    alignSelf: 'center',
  },
  backLinkText: {
    color: COLORS.indicatorActive,
    fontSize: 16,
  },
  bookingSummary: {
    width: '100%',
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.textPrimary,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  confirmButton: {
    backgroundColor: COLORS.button,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  timePickerHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeSlot: {
    width: '28%',
    margin: 5,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  timeSlotText: {
    color: '#333',
  },
});

export default BookingPage;
