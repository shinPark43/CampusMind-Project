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
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { COURTS } from './BookingPage'; // your courts array
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import Ionicons from '@expo/vector-icons/Ionicons';

const StatusPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // Check and delete expired reservations
  const checkAndDeleteExpiredReservations = async (reservationsData) => {
    if (!reservationsData || !Array.isArray(reservationsData)) {
      return [];
    }

    const now = moment();
    const expiredReservations = [];
    
    // Find expired reservations
    for (const reservation of reservationsData) {
      const [endTimeStr] = reservation.time.split(' - ').slice(-1);
      const endDateTime = moment(`${reservation.date} ${endTimeStr}`, 'YYYY-MM-DD h:mm A');
      
      // If the reservation has ended, add it to the list to delete
      if (endDateTime.isBefore(now)) {
        expiredReservations.push(reservation._id);
      }
    }
    
    // If there are expired reservations, delete them
    if (expiredReservations.length > 0) {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('Not Authenticated');
        
        // Delete each expired reservation
        for (const id of expiredReservations) {
          await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reservations/cancelReservation/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        }
        
        // Filter out expired reservations from the local state
        setReservations(prev => prev.filter(r => !expiredReservations.includes(r._id)));
        
        // Show a message if any reservations were deleted
        if (expiredReservations.length > 0) {
          Alert.alert(
            'Reservations Updated',
            `${expiredReservations.length} expired reservation(s) have been removed.`
          );
        }
      } catch (err) {
        console.error('Error deleting expired reservations:', err);
      }
    }
    
    // Return the filtered reservations (non-expired)
    return reservationsData.filter(r => !expiredReservations.includes(r._id));
  };

  // Fetch reservations
  const fetchReservations = async () => {
    try {
      setLoading(true);
      
      // Check token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        throw new Error('Not Authenticated');
      }
      
      console.log('Fetching reservations from:', `${process.env.EXPO_PUBLIC_API_URL}/reservations/getUserReservation`);
      
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reservations/getUserReservation`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Log response status
      console.log('Response status:', resp.status);
      
      const data = await resp.json();
      
      // Log response data structure
      console.log('Received data type:', typeof data);
      console.log('Is data an array:', Array.isArray(data));
      if (Array.isArray(data)) {
        console.log('Number of reservations:', data.length);
        
        // Check for missing fields in the data
        const hasIssues = data.some(item => !item.sportName || !item.courtName || !item.date || !item.time);
        if (hasIssues) {
          console.warn('Some reservations have missing fields:', data.filter(item => !item.sportName || !item.courtName || !item.date || !item.time));
        }
      }
      
      if (!resp.ok) throw new Error(data.error || 'Fetch failed');
      
      // Validate data is an array before processing
      if (!Array.isArray(data)) {
        console.error('Expected array but got:', data);
        throw new Error('Invalid response format');
      }
      
      // Check and delete expired reservations
      const activeReservations = await checkAndDeleteExpiredReservations(data);
      
      // Get current date and time
      const now = moment();
      
      // Sort reservations by date and time (closest to current date and time first)
      const sortedData = activeReservations.sort((a, b) => {
        try {
          // Create moment objects for the full date-time
          const aDateTime = moment(`${a.date} ${a.time.split(' - ')[0]}`, 'YYYY-MM-DD h:mm A');
          const bDateTime = moment(`${b.date} ${b.time.split(' - ')[0]}`, 'YYYY-MM-DD h:mm A');
          
          // Calculate the absolute difference in minutes from now
          const diffA = Math.abs(aDateTime.diff(now, 'minutes'));
          const diffB = Math.abs(bDateTime.diff(now, 'minutes'));
          
          // Sort by the smallest difference (closest to now)
          return diffA - diffB;
        } catch (err) {
          console.error('Error sorting reservation:', err);
          return 0; // Keep original order if error occurs
        }
      });
      
      setReservations(sortedData);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      Alert.alert('Error fetching reservations', String(err));
      setReservations([]); // Set empty array on error
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

  // Set up a timer to periodically check for expired reservations
  useEffect(() => {
    // Check every minute for expired reservations
    const interval = setInterval(() => {
      if (reservations && reservations.length > 0) {
        checkAndDeleteExpiredReservations(reservations);
      }
    }, 60000); // 60000 ms = 1 minute
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, [reservations]);

  // Cancel
  const handleCancelReservation = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Please log in');
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/reservations/cancelReservation/${id}`, {
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
                <Text style={styles.label}>Court:</Text> {item.courtName}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Date:</Text> {item.date}
              </Text>
              <Text style={styles.text}>
                <Text style={styles.label}>Time:</Text> {item.time}
              </Text>
              <View style={styles.actions}>
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

    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#1B263B',
    width: '100%',
  },
  title: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: 'bold',
    paddingTop: '10%',
    marginBottom: 20,
    textAlign: 'center',
    width: '100%',
  },
  noReservations: { 
    color: '#FFF', 
    textAlign: 'center', 
    marginTop: 20,
    width: '100%',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    width: '100%',
  },
  text: { 
    fontSize: 16, 
    marginBottom: 5, 
    color: '#1B263B',
    width: '100%',
  },
  label: { 
    fontWeight: 'bold' 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    width: '100%',
  },
  cancelBtn: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  btnText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  createBtn: {
    backgroundColor: '#778DA9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
});

export default StatusPage;
