// explore.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, PanResponder, Alert, Modal, ScrollView, TextInput, ActivityIndicator, } from 'react-native'; // Import ScrollView and TextInput
import { Link } from 'expo-router';
import { COLORS } from '../components/theme'; // Import COLORS
import WeatherWidget from '../components/WeatherWidget';
import courtImage from '../../assets/images/court.jpg';
import marketplaceImage from '../../assets/images/modify.jpg';
import trackerImage from '../../assets/images/tracker.jpg';
import defaultProfileImage from '../../assets/images/default_profile.jpeg';
import { Image } from 'react-native';
import weatherImage from '../../assets/images/weather.jpeg'; // Import the weather image
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // Import the image picker library
import { useRouter } from 'expo-router'; // Import useRouter
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const API_URL = 'http://10.80.89.61:3000'; // Base URL for the backend

const HomePage = () => {
  const router = useRouter(); // Initialize router

  const [features, setFeatures] = useState([
    { title: 'Book a Court', link: 'BookingPage', image: courtImage, comment: 'Reserve your favorite sport!' },
    { title: 'Modify your Booking', link: 'Status', image: marketplaceImage, comment: 'Review your reservations and edit!' },
    { title: 'Available Court', link: 'CourtAvailability', image: trackerImage, comment: 'Check available courts to play!' },
  ]);

  const [favorites, setFavorites] = useState([
    { title: 'Basketball Court', image: courtImage },
    { title: 'Tennis Court', image: trackerImage },
  ]); // Example favorites data

  const [reservations, setReservations] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState(defaultProfileImage); // State for profile image
  const [isModalVisible, setIsModalVisible] = useState(false); // State for modal visibility
  const [loading, setLoading] = useState(true);

  // Fetch user profile and reservations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) throw new Error('User not authenticated');

        // Fetch user profile
        const profileResponse = await fetch(`${API_URL}/users/getUserProfile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const profileData = await profileResponse.json();
        if (profileResponse.ok) {
          setFirstName(profileData.firstName);
          setLastName(profileData.lastName);
        } else {
          Alert.alert('Error', profileData.error || 'Failed to fetch user profile');
        }

        // Fetch reservations
        const reservationsResponse = await fetch(`${API_URL}/reservations/getUserReservation`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const reservationsData = await reservationsResponse.json();
        if (!reservationsResponse.ok) throw new Error(reservationsData.error || 'Fetch failed');
        setReservations(reservationsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', error.message || 'Unable to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          if (!token) throw new Error('User not authenticated');

          // Fetch user profile
          const profileResponse = await fetch(`${API_URL}/users/getUserProfile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          const profileData = await profileResponse.json();
          if (profileResponse.ok) {
            setFirstName(profileData.firstName);
            setLastName(profileData.lastName);
          } else {
            Alert.alert('Error', profileData.error || 'Failed to fetch user profile');
          }

          // Fetch reservations
          const reservationsResponse = await fetch(`${API_URL}/reservations/getUserReservation`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          const reservationsData = await reservationsResponse.json();
          if (!reservationsResponse.ok) throw new Error(reservationsData.error || 'Fetch failed');
          setReservations(reservationsData);
        } catch (error) {
          console.error('Error fetching data:', error);
          Alert.alert('Error', error.message || 'Unable to fetch data');
        } finally {
          setLoading(false);
        }
      };

      fetchData();

      // Cleanup function (optional, if needed)
      return () => {
        setLoading(true); // Reset loading state if necessary
      };
    }, [])
  );

  // Function to handle profile image selection
  const handleSelectProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'You need to grant permission to access the photo gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Selected Image URI:', result.assets[0].uri);
      setProfileImage({ uri: result.assets[0].uri }); // Update the profile image state
    }

    setIsModalVisible(false); // Close the modal after selecting an image
  };

  // Function to navigate to ProfilePage
  const handleEditProfile = () => {
    setIsModalVisible(false); // Close the modal
    router.push('ProfilePage'); // Navigate to ProfilePage
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <Text style={styles.header}>CampusMind</Text>
        <Text style={styles.welcomeText}>Welcome, {firstName}!</Text>

        {/* Profile Circle */}
        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => setIsModalVisible(true)} // Show the modal when the profile icon is touched
        >
          <Image
            source={profileImage} // Use the profile image state
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for courts or activities..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient
        colors={['#1B2650', '#98C1D9']} // Dark blue gradient 
        style={styles.mainSection}
      >
        {/* Transition Words Section */}
        <View style={styles.transitionSection}>
          <Text style={styles.transitionTitle}>Get ready for your next activity</Text>
          <Text style={styles.transitionDescription}>
            Discover courts, activities, and more—tailored to your preferences.
          </Text>
        </View>

        {/* Horizontal Scrollable Cards */}
        <View style={styles.cardSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {features.map((feature, index) => (
              <TouchableOpacity
                key={feature.title}
                style={styles.card}
                onPress={() => router.push(feature.link)}
              >
                <Image source={feature.image} style={styles.cardImage} />
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardDescription}>{feature.comment}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {/* Favorites Section */}
      <View style={styles.favoritesSection}>
        <Text style={styles.sectionTitle}>Your Favorites</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {favorites.map((favorite, index) => (
            <TouchableOpacity key={index} style={styles.favoriteCard}>
              <Image source={favorite.image} style={styles.favoriteImage} />
              <Text style={styles.favoriteTitle}>{favorite.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Upcoming Bookings Section */}
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#778DA9" />
        ) : !reservations.length ? (
          <Text style={styles.noReservations}>No reservations.</Text>
        ) : (
          reservations.map((item, index) => (
            <View key={index} style={styles.bookingCard}>
              <Text style={styles.bookingTitle}>{item.sportName}</Text>
              <Text style={styles.bookingDetails}>
                {item.date} at {item.time}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Modal for Options */}
      {isModalVisible && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)} // Close the modal when the user presses back
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleSelectProfileImage} // Handle selecting a profile image
              >
                <Text style={styles.modalOptionText}>Edit Profile Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleEditProfile} // Handle navigating to ProfilePage
              >
                <Text style={styles.modalOptionText}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsModalVisible(false)} // Close the modal
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Weather Section */}
      <View style={styles.weatherSection}>
        <WeatherWidget />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#1B2640', // Navy-ish background
    paddingTop: height * 0.05,
    paddingBottom: height * 0.01,
    alignItems: 'center',
  },
  header: {
    fontSize: width * 0.1,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    alignSelf: 'left',
    marginLeft: width * 0.05,
    marginTop: height * 0.02,
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card width
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
  },
  welcomeText: {
    fontSize: width * 0.05,
    color: COLORS.textPrimary,
    marginTop: width * 0.05,
    alignSelf: 'left',
    marginLeft: width * 0.05,
    fontWeight: 'bold',
    textAlign: 'left',
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card width
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
  },
  profileCircle: {
    position: 'absolute',
    top: height * 0.05, // Aligns with the top of "CampusMind"
    right: width * 0.05, // Adjust based on your design
    width: height * 0.1, // Dynamically set the size to match the height of the text
    height: height * 0.1, // Same as width to keep it circular
    borderRadius: height * 0.05, // Half of the width/height to make it circular
    backgroundColor: COLORS.secondary, // Fallback background color
    justifyContent: 'center', // Centers the content vertically
    alignItems: 'center', // Centers the content horizontally
    overflow: 'hidden', // Ensures the content stays within the circle
    borderWidth: 0.5, // Thickness of the white outline
    borderColor: '#FFFFFF', // White color for the outline
    marginTop: height * 0.02, // Adjust based on your design  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImage: {
    width: '120%',
    height: '120%',
    resizeMode: 'cover', // Ensures the image fills the circle
    borderRadius: height * 0.05, // Same as the circle's radius
    borderWidth: 0.5, // Thickness of the white outline
    borderColor: '#FFFFFF', // White color for the outline
    overflow: 'hidden', // Ensures the image stays within the circle
    position: 'absolute', // Position it absolutely within the circle
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.02,
    marginHorizontal: width * 0.05,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  mainSection: {
    paddingHorizontal: width * 0.05,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    shadowColor: 'lightblue',
    shadowOffset: { width: 5, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    marginLeft: width * 0.05,
    marginTop: height * 0.02,
  },
  transitionSection: {
    alignItems: 'left',
    justifyContent: 'left',
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card width
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
    textDecorationThickness: 2, // Thickness of the underline
    textAlign: 'left',
  },
  transitionTitle: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginTop: height * 0.01,
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
    textDecorationThickness: 2, // Thickness of the underline
    textAlign: 'left',
    width: '100%', // Ensures the text takes the full width
    maxWidth: '90%', // Ensures the text doesn't exceed the card width
  },
  transitionDescription: {
    fontSize: width * 0.04,
    color: COLORS.textPrimary,
    textAlign: 'left',
    marginTop: height * 0.01,
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Add a shadow effect to the text
    textShadowOffset: { width: 1, height: 1 }, // Shadow offset
    textShadowRadius: 3, // Shadow radius
    textDecorationThickness: 2, // Thickness of the underline
    textAlign: 'left',
    width: '100%', // Ensures the text takes the full width
  },
  cardSection: {
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
  },
  card: {
    width: width * 0.6,
    marginRight: width * 0.05,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: height * 0.15,
    resizeMode: 'cover',
  },
  cardTitle: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 5,
  },
  cardDescription: {
    fontSize: width * 0.03,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  weatherSection: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  favoritesSection: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: height * 0.01,
  },
  favoriteCard: {
    width: width * 0.4,
    marginRight: width * 0.05,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  favoriteImage: {
    width: '100%',
    height: height * 0.1,
    resizeMode: 'cover',
  },
  favoriteTitle: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 4,
  },
  upcomingSection: {
    marginTop: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  bookingCard: {
    marginBottom: height * 0.01,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderColor: '#fff',
    borderWidth: 0.2,
  },
  bookingTitle: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  bookingDetails: {
    fontSize: width * 0.035,
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalOption: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCancel: {
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: 'red',
  },
});

export default HomePage;