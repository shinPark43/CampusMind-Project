// index.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router'

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (username === '' || password === '') {
      Alert.alert('Error', 'Please enter both username and password.');
    } else {
      // Handle the login logic here, e.g., API call or navigation
      // Alert.alert('Success', 'Login successful');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Redirecting to password reset page...');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to CampusMind</Text>
      <Text style={styles.sub_header}>Sign into your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      
      />
      <View style={styles.forgot_password_container}>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgot_password}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <Link href="/explore" style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
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
    backgroundColor: '#1B263B',
  },
  header: {
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFF',
  },
  sub_header: {
    fontSize: 14,
    marginBottom: 40,
    color: '#FFF',
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#778DA9',
    color: '#FFF',
    borderRadius: 5,
  },
  forgot_password: {
    color: '#B0C4E0',
    fontSize: 12,
  },
  forgot_password_container: {
    width: '100%',
    alignItems: 'flex-end',
  },
  button: {
    marginTop: 25,
    backgroundColor: '#778DA9',
    paddingVertical: 12,
    paddingHorizontal: 140,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginPage;
