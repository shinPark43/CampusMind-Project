// index.jsx
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
import { Link, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // Import the library

const LoginPage = () => {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter both email and password.');
    } else if (!email.endsWith('@angelo.edu')) {
      Alert.alert('Error', 'Email must end with @angelo.edu.');
    } else if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
    } else {
      try {
        const response = await fetch('http://192.168.1.40:3000/users/userLogin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          await AsyncStorage.setItem('token', data.token);
          Alert.alert('Success', 'Login successful', [
            {
              text: 'OK',
              onPress: () => router.push('/explore'),
            },
          ]);
        } else {
          Alert.alert('Error', data.error || 'Login failed');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Something went wrong. Please try again later.');
      }
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Redirecting to password reset page...');
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
            <View style={styles.iconContainer}>
              <Icon name="message-square" size={70} color="#fff" />
            </View>
            <Text style={styles.header}>CampusMind</Text>
            <Text style={styles.sub_header}>Welcome Back.</Text>

            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                textContentType="none"
                autoComplete="off"
                importantForAutofill="no"
              />
              <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.forgot_password_container}>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgot_password}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <Link href="/SignUpPage" style={styles.button_signUp}>
              <Text style={styles.buttonText} numberOfLines={1}>
                Sign Up
              </Text>
            </Link>
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
  icon: {
    marginRight: 10,
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
  eyeIcon: {
    padding: 2,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  forgot_password: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'right',
  },
  forgot_password_container: {
    width: '100%',
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#778DA9',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 15,
    alignSelf: 'center',
  },
  button_signUp: {
    marginTop: 10,
    backgroundColor: '#778FFF',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 15,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  innerContainer: {
    width: '100%',           // Full width relative to parent scroll view
    alignSelf: 'center',    // Center the inner content
  },
});

export default LoginPage;
