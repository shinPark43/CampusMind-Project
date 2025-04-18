// SignUpPage.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // Import the library

const SignUpScreen = () => {
  const navigation = useNavigation();

  // Define state variables for each input field
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [CID, setCID] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Function to handle the sign-up action
  const handleSignUp = async () => {
    if (firstName === '' || lastName === '' || CID === '' || email === '' || password === '') {
      Alert.alert('Error', 'Please enter the information. All fields are required.');
    } else if (!email.endsWith('@angelo.edu')) {
      Alert.alert('Error', 'Email must end with @angelo.edu.');
    } else if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
    } else if (!/^\d{8}$/.test(CID)) {
      Alert.alert('Error', 'CID must be exactly 8 digits long and contain only numbers.');
    } else {
      try {
        const response = await fetch('http://192.168.1.44:3000/users/createUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send the form data as JSON
          body: JSON.stringify({ firstName, lastName, CID, email, password }),
        });

        const json = await response.json();

        if (response.ok) {
          // If sign up is successful, navigate user back to the login page
          Alert.alert('Success', 'User created successfully!');
          navigation.goBack(); // Navigate back to the login page
        } else {
          // Display the error returned from the backend
          Alert.alert('Error', json.error || 'An error occurred');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Unable to connect to the server');
      }
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid={true} // Enable smooth behavior on Android
      extraScrollHeight={100} // Add extra space above the input box
      keyboardShouldPersistTaps="handled" // Dismiss keyboard on tap outside
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View>
            <Text style={styles.header}>Sign Up</Text>
            <Text style={styles.sub_header}>Create an account</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#999"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#999"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="CID"
                placeholderTextColor="#999"
                value={CID}
                onChangeText={setCID}
                keyboardType="numeric" // Ensure numeric keyboard for CID
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                textContentType="none" // Disable autofill
                autoComplete="off" // Disable autofill suggestions
                importantForAutofill="no" // Ensure autofill is disabled
              />
            </View>

            <TouchableOpacity style={styles.button_signUp} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            {/* Button to go back to Login */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#1B263B',
    width: '100%',
  },
  header: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFF',
    textAlign: 'center',
  },
  sub_header: {
    fontSize: 14,
    marginBottom: 40,
    color: '#FFF',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%', // Reduced width for better alignment
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  button_signUp: {
    marginTop: 10,
    backgroundColor: '#778FFF',
    paddingVertical: 15,
    width: '100%', // Reduced width for better alignment
    borderRadius: 15,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 15,
    width: '100%', // Reduced width for better alignment
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#778FFF',
    alignSelf: 'center',
  },
  backButtonText: {
    textAlign: 'center',
    color: '#778FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  innerContainer: {
    width: '100%',           // Full width relative to parent scroll view
    alignSelf: 'center',    // Center the inner content
  },
});

export default SignUpScreen;
