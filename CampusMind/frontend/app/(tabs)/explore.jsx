// HomePage.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const HomePage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>CampusMind</Text>
      <Text style={styles.subHeader}>Select an option below:</Text>

      {/* Link to Booking page*/}
      <Link href="BookingPage" style={styles.link}>
        <Text style={styles.linkText}>Book a Court</Text>
      </Link>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 30,
    alignItems: "flex-start",
    color: '#333',
  },
  subHeader: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  link: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  linkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomePage;
