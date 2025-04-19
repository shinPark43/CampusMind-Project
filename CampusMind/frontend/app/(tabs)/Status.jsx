// StatusPage.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COURTS } from './BookingPage'; // your courts array
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';

const API_URL = 'http://10.80.72.125:3000/reservations';

const StatusPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState(null);

  const [sportName, setSportName] = useState('');
  const [date, setDate] = useState('');           // 'YYYY-MM-DD'
  const [startTime, setStartTime] = useState(''); // Start time
  const [endTime, setEndTime] = useState(''); // End time

  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const router = useRouter();

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not Authenticated');
      const resp = await fetch(`${API_URL}/getUserReservation`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Fetch failed');
      setReservations(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to fetch reservations when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchReservations();
    }, [])
  );

  // Modify
  const handleModifyReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Please log in');

      if (!startTime || !endTime) {
        Alert.alert('Error', 'Please select both start and end times.');
        return;
      }

      const formattedTime = `${startTime} - ${endTime}`;

      const resp = await fetch(
        `${API_URL}/modifyReservation/${editingReservation._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sportName, date, time: formattedTime }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Update failed');
      }
      // update local list
      setReservations((prev) =>
        prev.map((r) =>
          r._id === editingReservation._id
            ? { ...r, sportName, date, time: formattedTime }
            : r
        )
      );
      setEditingReservation(null);
      Alert.alert('Success', 'Reservation updated.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Cancel
  const handleCancelReservation = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Please log in');
      const resp = await fetch(`${API_URL}/cancelReservation/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Cancellation failed');
      }
      setReservations((prev) => prev.filter((r) => r._id !== id));
      Alert.alert('Cancelled', 'Reservation removed.');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // Calendar modal controls
  const openCalendar = () => setCalendarVisible(true);
  const closeCalendar = () => setCalendarVisible(false);

  // Time picker controls
  const openStartTimePicker = () => setTimePickerVisible('start');
  const openEndTimePicker = () => setTimePickerVisible('end');

  const closeTimePicker = () => {
    setTimePickerVisible(false); // Close the time picker modal
  };

  const handleTimeConfirm = (dt) => {
    const formattedTime = moment(dt).format('h:mm A');
    if (isTimePickerVisible === 'start') {
      setStartTime(formattedTime);
    } else if (isTimePickerVisible === 'end') {
      setEndTime(formattedTime);
    }
    closeTimePicker();
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Reservations</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#778DA9" />
      ) : !reservations.length ? (
        <Text style={styles.noReservations}>No reservations.</Text>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.text}>
                <Text style={styles.label}>Sport:</Text> {item.sportName}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Date:</Text> {item.date}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Time:</Text> {item.time}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.modifyBtn}
                  onPress={() => {
                    setEditingReservation(item);
                    setSportName(item.sportName);
                    setDate(item.date);
                    
                    const [start, end] = item.time.split(' - ');
                    setStartTime(start.trim());
                    setEndTime(end.trim());
                  }}
                >
                  <Text style={styles.btnText}>Modify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() =>
                    Alert.alert(
                      'Cancel?',
                      'Remove this reservation?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes',
                          onPress: () => handleCancelReservation(item._id),
                        },
                      ]
                    )
                  }
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

{editingReservation && (
  <Modal
    transparent={false} // Full-screen modal
    animationType="slide"
    visible={!!editingReservation}
    onRequestClose={() => setEditingReservation(null)} // Close modal on back press
  >
    <View style={styles.fullPageContainer}>
      <Text style={styles.title}>Edit Reservation</Text>

      {/* Sport */}
      <Text style={styles.fieldLabel}>Sport</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={sportName}
          onValueChange={(v) => setSportName(v)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {COURTS.map((c) => (
            <Picker.Item key={c.name} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      {/* Date */}
      <Text style={styles.fieldLabel}>Date</Text>
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={openCalendar}
      >
        <Text style={{ padding: 10 }}>{date || 'Select Date'}</Text>
      </TouchableOpacity>

      {/* Calendar Modal */}
      <Modal
        transparent
        visible={isCalendarVisible}
        animationType="slide"
        onRequestClose={closeCalendar}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Calendar
              onDayPress={(d) => {
                setDate(d.dateString);
                closeCalendar();
              }}
              minDate={new Date().toISOString().split('T')[0]}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { marginTop: 10 }]}
              onPress={closeCalendar}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time */}
      <Text style={styles.fieldLabel}>Time</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          style={[styles.pickerContainer, { flex: 1, marginRight: 5 }]}
          onPress={openStartTimePicker}
        >
          <Text style={{ padding: 10 }}>{startTime || 'Start Time'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pickerContainer, { flex: 1, marginRight: 5 }]}
          onPress={openEndTimePicker}
        >
          <Text style={{ padding: 10 }}>{endTime || 'End Time'}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible !== false}
        mode="time"
        date={new Date()}
        onConfirm={handleTimeConfirm}
        onCancel={closeTimePicker}
      />

      {/* Save and Cancel Buttons */}
      <TouchableOpacity
        style={[styles.modifyBtn, { marginTop: 10, marginBottom: 5 }]}
        onPress={handleModifyReservation}
      >
        <Text style={styles.btnText}>Save Changes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => setEditingReservation(null)}
      >
        <Text style={styles.btnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </Modal>
)}

      {/* <TouchableOpacity
        style={styles.createBtn}
        onPress={() => router.push('/BookingPage')}
      >
        <Text style={styles.btnText}>Create Reservation</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#1B263B',
    padding: 20,
    justifyContent: 'flex-start',
  },
  container: { flex: 1, padding: 20, backgroundColor: '#1B263B' },
  title: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    paddingTop: '10%',
    marginBottom: 20,
    textAlign: 'center',
  },
  noReservations: { color: '#FFF', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  text: { fontSize: 16, marginBottom: 5, color: '#1B263B' },
  label: { fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  modifyBtn: {
    backgroundColor: '#778FFF',
    padding: 10,
    borderRadius: 8,
  },
  cancelBtn: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
  },
  btnText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  editForm: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    paddingBottom: '10%',
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    marginBottom: 15,
  },
  picker: {
    color: '#000',
    backgroundColor: '#FFF',
  },
  pickerItem: {
    color: '#000',
  },
  createBtn: {
    backgroundColor: '#778DA9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
});

export default StatusPage;
