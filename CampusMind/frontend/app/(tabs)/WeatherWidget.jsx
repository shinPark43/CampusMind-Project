import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, useWindowDimensions, TouchableOpacity, Modal, Pressable, Switch } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { COLORS } from './theme';

const API_KEY = '988a61e588953a7894d47bc8c884c314'; // Replace with your actual API key

const WeatherWidget = () => {
  const { width } = useWindowDimensions();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // ✅ Modal state
  const [isFahrenheit, setIsFahrenheit] = useState(false); // ✅ 화씨 여부

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
  }, [isFahrenheit]); // ✅ 단위 변경 시 다시 호출

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
        <View style={[styles.miniContainer, { width: width * 0.25 }]}>
          <Image
            source={{ uri: `https://openweathermap.org/img/wn/${icon}@2x.png` }}
            style={styles.miniIcon}
          />
          <Text style={styles.miniTemp}>{Math.round(temp)}°{isFahrenheit ? 'F' : 'C'}</Text>
        </View>
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
                trackColor={{ false: '#ccc', true: COLORS.primary }} // 🔄 배경색 변경
                thumbColor={isFahrenheit ? COLORS.secondary : '#f4f3f4'} // 🔄 원 색상
                ios_backgroundColor="#ccc" // iOS용 백그라운드 색상
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
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  miniContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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

  // ✅ Full Widget (Modal) Style
  fullContainer: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3542',
  },
  temp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2f3542',
  },
  description: {
    fontSize: 16,
    textTransform: 'capitalize',
    color: '#2f3542',
    marginBottom: 5,
  },
  details: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 14,
    color: '#2f3542',
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
    color: '#2f3542',
  },
});

export default WeatherWidget;
