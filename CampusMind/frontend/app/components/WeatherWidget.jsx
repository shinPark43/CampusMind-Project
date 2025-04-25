// WeatherSidget.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Image, useWindowDimensions, TouchableOpacity, Modal, Pressable, Switch, ImageBackground } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { COLORS } from './theme';
import weatherImage from '../../assets/images/weather.jpeg'; // Import the weather image

const API_KEY = '988a61e588953a7894d47bc8c884c314'; // Replace with your actual API key

const { width, height } = Dimensions.get('window');

const weatherBackgrounds = {
  'clear sky': require('../../assets/images/clear_sky.jpeg'),
  'few clouds': require('../../assets/images/few_clouds.jpeg'),
  'scattered clouds': require('../../assets/images/scattered_clouds.jpeg'),
  'broken clouds': require('../../assets/images/broken_clouds.jpeg'),
  'shower rain': require('../../assets/images/shower_rain.jpeg'),
  'rain': require('../../assets/images/rain.jpeg'),
  'thunderstorm': require('../../assets/images/thunderstorm.jpeg'),
  'snow': require('../../assets/images/snow.jpeg'),
  'mist': require('../../assets/images/mist.jpeg'),
};

const WeatherWidget = () => {
  const { width } = useWindowDimensions();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal state
  const [isFahrenheit, setIsFahrenheit] = useState(true); 

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission is required.');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        fetchWeather(location.coords.latitude, location.coords.longitude, isFahrenheit);
      } catch (err) {
        console.log('Location Error:', err);
        setErrorMsg('Failed to get location.');
        setLoading(false);
      }
    })();
  }, [isFahrenheit]); 

  // Fetch weather data using OpenWeather API
  const fetchWeather = async (lat, lon, useFahrenheit) => {
    try {
      const units = useFahrenheit ? 'imperial' : 'metric';
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}&lang=en`
      );

      if (response.status === 200) {
        setWeatherData(response.data);
      } else {
        setErrorMsg(`Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log('API Error:', error);
      setErrorMsg('Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="small" color="#0000ff" />;
  }

  if (errorMsg) {
    return <Text>{errorMsg}</Text>;
  }

  const { name } = weatherData;
  const { temp, temp_min, temp_max, humidity } = weatherData.main;
  const { description, icon } = weatherData.weather[0];

  return (
    <>
      {/* ✅ Mini Widget */}
      <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.miniContainerWrapper}>
        <ImageBackground
          source={weatherBackgrounds[description] || weatherImage} // Dynamically set the background image
          style={[styles.miniContainer, { width: width, height: height * 0.17 }]}
        >
          <Text style={styles.miniHeader}>Temperature: {Math.round(temp)}°{isFahrenheit ? 'F' : 'C'}</Text>
          <Text style={styles.miniHeaderText}>Tap to explore today's weather forecast!</Text>
        </ImageBackground>
      </TouchableOpacity>

      {/* ✅ Modal for Full Weather Info */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.modalBackground} onPress={() => setIsModalVisible(false)}>
          <Pressable style={[styles.fullContainer, { width: width * 0.9 }]}>
            <Text style={styles.location}>{name}</Text>

            <Image
              source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }}
              style={styles.fullIcon}
            />

            <Text style={styles.temp}>{Math.round(temp)}°{isFahrenheit ? 'F' : 'C'}</Text>
            <Text style={styles.description}>{description}</Text>

            {/* 🌡️ Additional Info */}
            <View style={styles.details}>
              <Text style={styles.detailText}>High: {Math.round(temp_max)}°{isFahrenheit ? 'F' : 'C'}</Text>
              <Text style={styles.detailText}>Low: {Math.round(temp_min)}°{isFahrenheit ? 'F' : 'C'}</Text>
              <Text style={styles.detailText}>Humidity: {humidity}%</Text>
            </View>

            {/* ✅ Temperature Unit Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>°C</Text>
              <Switch
                value={isFahrenheit}
                onValueChange={setIsFahrenheit}
                trackColor={{ false: '#ccc', true: COLORS.indicatorActive }} 
                thumbColor={isFahrenheit ? COLORS.indicatorInactive : '#f4f3f4'} 
                ios_backgroundColor="#ccc"
                />

              <Text style={styles.switchLabel}>°F</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ✅ Mini Widget Style
  miniContainerWrapper: {
    alignSelf: 'center', // Center the widget horizontally
    marginTop: 20, // Add spacing from the top
  },
  miniContainer: {
    backgroundColor: COLORS.secondary, // Match the background color
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20, // Add padding for better spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  miniHeader: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    alignItems: 'left',
    color: COLORS.textPrimary,
    top: -30,
    left: -25,
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card widthe
    textDecorationThickness: 2, // Thickness of the underline
  },
  miniHeaderText: {
    fontSize: width * 0.04, // Smaller font size for secondary text
    fontWeight: 'bold', // Normal weight for secondary text
    alignItems: 'left',
    color: COLORS.textSecondary, // Use a secondary color for contrast
    marginTop: 5, // Add some spacing from the previous element
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Optional shadow for better visibility
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 2, // Shadow blur radius
    top: -20,
    left: -25,
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card width
    textDecorationThickness: 2, // Thickness of the underline 
  },
  miniIcon: {
    width: 30,
    height: 30,
  },
  miniTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#2f3542',
  },

  // Full Widget (Modal) Style
  fullContainer: {
    backgroundColor: COLORS.primary, // Match the background color
    borderRadius: 10, // Add rounded corners
    padding: 20, // Add padding for spacing
    alignItems: 'center',
    width: '90%', // Adjust width to fit the screen
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary, // Match the text color
    marginBottom: 10,
  },
  temp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.textPrimary, // Match the text color
  },
  description: {
    fontSize: 16,
    textTransform: 'capitalize',
    color: COLORS.textPrimary, // Match the text color
    marginBottom: 5,
  },
  details: {
    marginTop: 10,
    alignItems: 'center', // Center the details text
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textPrimary, // Match the text color
    marginBottom: 5,
  },
  fullIcon: {
    width: 60,
    height: 60,
  },

  // ✅ Modal Background
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ Temperature Unit Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  switchLabel: {
    fontSize: 16,
    marginHorizontal: 5,
    color: COLORS.textPrimary, 
  },
});

export default WeatherWidget;


