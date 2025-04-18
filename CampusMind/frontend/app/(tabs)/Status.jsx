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

const API_URL = 'http://192.168.1.42:3000/reservations';

const StatusPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState(null);

  const [sportName, setSportName] = useState('');
  const [date, setDate] = useState('');           // 'YYYY-MM-DD'
  const [time, setTime] = useState('');           // 'HH:MM'

  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  const router = useRouter();

  // Fetch reservations
  useEffect(() => {
    (async () => {
      try {
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
    })();
  }, []);

  // Modify
  const handleModifyReservation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Please log in');
      const resp = await fetch(
        `${API_URL}/modifyReservation/${editingReservation._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sportName, date, time }),
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
            ? { ...r, sportName, date, time }
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
  const openTimePicker = () => setTimePickerVisible(true);
  const closeTimePicker = () => setTimePickerVisible(false);
  const handleTimeConfirm = (dt) => {
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    setTime(`${h}:${m}`);
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
                    setTime(item.time);
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
        <View style={styles.editForm}>
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
            <Text style={{ padding: 10 }}>
              {date || 'Select Date'}
            </Text>
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
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={openTimePicker}
          >
            <Text style={{ padding: 10 }}>
              {time || 'Select Time'}
            </Text>
          </TouchableOpacity>

          {/* Time Picker Modal */}
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            date={new Date()}
            onConfirm={handleTimeConfirm}
            onCancel={closeTimePicker}
          />

          <TouchableOpacity
            style={[styles.modifyBtn, { marginTop: 10 }]}
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
  container: { flex: 1, padding: 20, backgroundColor: '#1B263B' },
  title: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
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
    backgroundColor: '#778DA9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  cancelBtn: {
    backgroundColor: '#E63946',
    padding: 10,
    borderRadius: 8,
  },
  btnText: { color: '#FFF', fontWeight: 'bold', textAlign: 'center' },
  editForm: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  fieldLabel: {
    color: '#1B263B',
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
