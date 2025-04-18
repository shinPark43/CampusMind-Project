import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons'; // For the person icon
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const API_URL = 'http://192.168.1.42:3000/users'; // Replace with your backend URL

const UserProfilePage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [CID, setCID] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false); // Toggle between view and edit mode

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('User not authenticated');

        const response = await fetch(`${API_URL}/getUserProfile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setFirstName(data.firstName);
          setLastName(data.lastName);
          setCID(data.CID);
          setEmail(data.email);
        } else {
          Alert.alert('Error', data.error || 'Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        Alert.alert('Error', 'Unable to fetch user profile');
      }
    };

    fetchUserProfile();
  }, []);

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (firstName === '' || lastName === '' || CID === '' || email === '') {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('User not authenticated');

      const response = await fetch(`${API_URL}/updateUserProfile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstName, lastName, CID, email }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false); // Switch back to view mode
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Unable to update profile');
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true}
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          {/* Person Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="person" size={100} color="#FFF" />
          </View>

          <Text style={styles.header}>User Profile</Text>

          {/* View Mode */}
          {!isEditing ? (
            <View>
              <View style={styles.detailContainer}>
                <Text style={styles.label}>First Name:</Text>
                <Text style={styles.value}>{firstName}</Text>
              </View>
              <View style={styles.detailContainer}>
                <Text style={styles.label}>Last Name:</Text>
                <Text style={styles.value}>{lastName}</Text>
              </View>
              <View style={styles.detailContainer}>
                <Text style={styles.label}>CID:</Text>
                <Text style={styles.value}>{CID}</Text>
              </View>
              <View style={styles.detailContainer}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{email}</Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={() => setIsEditing(true)} // Switch to edit mode
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Edit Mode
            <View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#888"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#888"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="CID"
                  placeholderTextColor="#888"
                  value={CID}
                  onChangeText={setCID}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#757575', marginTop: 10 }]}
                onPress={() => setIsEditing(false)} // Cancel edit mode
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 90,
    backgroundColor: '#1B263B', // Dark blue background
  },
  innerContainer: {
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFF', // White text
    textAlign: 'center',
  },
  detailContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFF', // White background for details
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#555',
  },
  inputContainer: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
  },
  input: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    marginTop: 5,
    backgroundColor: '#778FFF', // Light blue button
    paddingVertical: 15,
    width: '100%',
    borderRadius: 15,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default UserProfilePage;