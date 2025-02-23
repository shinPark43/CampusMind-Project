// BookingPage.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';

const BookingPage = () => {
  const [court, setCourt] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleBooking = () => {
    if (!court || !date || !time) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }
    // Here you would typically call your backend API to handle the booking logic.
    Alert.alert('Success', 'Your booking has been confirmed!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book a Court</Text>
      <TextInput 
        style={styles.input}
        placeholder="Court Name"
        placeholderTextColor="#ccc"
        value={court}
        onChangeText={setCourt}
      />
      <TextInput 
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        placeholderTextColor="#ccc"
        value={date}
        onChangeText={setDate}
      />
      <TextInput 
        style={styles.input}
        placeholder="Time (HH:MM)"
        placeholderTextColor="#ccc"
        value={time}
        onChangeText={setTime}
      />
      <TouchableOpacity style={styles.button} onPress={handleBooking}>
        <Text style={styles.buttonText}>Confirm Booking</Text>
      </TouchableOpacity>
      {/* Link to go back to the home page */}
      <Link href="/explore" style={styles.backLink}>
        <Text style={styles.backLinkText}>Go back to Home</Text>
      </Link>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default BookingPage;
