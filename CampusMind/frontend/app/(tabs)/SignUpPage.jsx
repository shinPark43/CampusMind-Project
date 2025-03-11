// SignUpPage.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback  } from 'react-native';
import { useNavigation } from '@react-navigation/native';

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
    try {
      const response = await fetch('http://localhost:3000/createUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Send the form data as JSON
        body: JSON.stringify({ firstName, lastName, CID, email, password })
      });

      const json = await response.json();

      if (response.ok) {
        // If sign up is successful, navigate user back to the login page
        Alert.alert("Success", "User created successfully!");
        // Optionally navigate to another screen after successful signup
      } else {
        // Display the error returned from the backend
        Alert.alert("Error", json.error || "An error occurred");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to connect to the server");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
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
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: '100%',
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
    width: '100%',
    borderRadius: 15,
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
    width: '100%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#778FFF',
  },
  backButtonText: {
    textAlign: 'center',
    color: '#778FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
