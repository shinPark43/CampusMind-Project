// HomePage.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, PanResponder } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from './theme'; // Import COLORS
import WeatherWidget from './WeatherWidget';

const { width, height } = Dimensions.get('window');


const HomePage = () => {
  const [features, setFeatures] = useState([
    { title: 'Book a Court', link: 'BookingPage' }, 
    { title: 'Marketplace', link: 'MarketplacePage' },  
    { title: 'Building Tracker', link: 'TrackingPage' },  
  ]);
  
  const [myBookings, setMyBookings] = useState([
    { id: 1, date: "March 5, 2024", time: "6:00 PM" },
    { id: 2, date: "March 8, 2024", time: "4:30 PM" },
  ]);

  useEffect(() => {
    fetchBookings();
  }, []);
  
  const fetchBookings = async () => {
    try {
      // Need backend API
      const response = await axios.get('https://your-api.com/my-bookings');
      setMyBookings(response.data);
    } catch (error) {
      console.log("Error fetching bookings:", error);
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const tempIndex = useRef(0);  

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (tempIndex.current < features.length - 1) {
        handleButtonPress('next');
      } else {
        tempIndex.current = 0;
        setCurrentIndex(0);
        animateCard(0);
      }
    }, 5000);
  
    return () => clearInterval(interval);
  }, [currentIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderMove: (_, gestureState) => {
        scrollX.setValue(-tempIndex.current * width + gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = width * 0.15;

        if (gestureState.dx > swipeThreshold && tempIndex.current > 0) {
          tempIndex.current -= 1;
          setCurrentIndex(tempIndex.current);
          animateCard(tempIndex.current);
        } else if (gestureState.dx < -swipeThreshold && tempIndex.current < features.length - 1) {
          tempIndex.current += 1;
          setCurrentIndex(tempIndex.current);
          animateCard(tempIndex.current);
        } else {
          animateCard(tempIndex.current);
        }
      },
    })
  ).current;

  const animateCard = (newIndex) => {
    Animated.spring(scrollX, {
      toValue: -newIndex * width,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPress = (direction) => {
    let newIndex = tempIndex.current;

    if (direction === 'next' && newIndex < features.length - 1) {
      newIndex++;
    } else if (direction === 'prev' && newIndex > 0) {
      newIndex--;
    }

    tempIndex.current = newIndex;
    setCurrentIndex(newIndex);
    animateCard(newIndex);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CampusMind</Text>

      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: width * features.length,
            transform: [{ translateX: scrollX }],
          }}
        >
          {features.map((feature, index) => (
            <View 
              key={feature.title} 
              style={[
                styles.card,
                styles[`card${index}`],
              ]}
              >
              <Link href={feature.link} style={styles.link}>
                <Text style={styles.linkText}>{feature.title}</Text>
              </Link>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Indicator Dots */}
      <View style={styles.indicatorContainer}>
        {features.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { backgroundColor: index === currentIndex ? COLORS.indicatorActive : COLORS.indicatorInactive },
            ]}
          />
        ))}
      </View>

      <View style={styles.bookingContainer}>
        <Text style={styles.sectionTitle}>My Bookings</Text>

        {myBookings.length > 0 ? (
          myBookings.slice(0, 2).map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <Text style={styles.bookingDate}>{booking.date} at {booking.time}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noBookingText}>No bookings available</Text>
        )}

        <TouchableOpacity onPress={() => console.log("Go to Booking Page")} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <WeatherWidget />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: height * 0.05,
    backgroundColor: COLORS.background, //Background color
  },
  header: {
    fontSize: width * 0.1,
    paddingTop: height * 0.02,
    fontWeight: 'bold',
    marginBottom: height * 0.03,
    color: COLORS.textPrimary, //Header text color
  },
  carouselContainer: {
    width: width,
    height: height * 0.28,
    overflow: 'hidden',
  },
  card: {
    width: width * 0.9,
    height: height * 0.28,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: width * 0.05,
    shadowColor: '#000', // Shadow for depth
    shadowOffset: { width: 0, height: height * 0.005 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  // Specific card colors using COLORS
  card0: {
    backgroundColor: COLORS.primary, //Book a Court
  },
  card1: {
    backgroundColor: COLORS.primary, //Marketplace
  },
  card2: {
    backgroundColor: COLORS.primary, //Building Tracker
  },
  link: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',  
    alignItems: 'center',      
  },
  linkText: {
    textAlign: 'center',
    color: COLORS.textPrimary, //Link text color
    fontSize: width * 0.07,
    fontWeight: 'bold',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: height * 0.38 + height * 0.02 + width * 0.1,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  bookingContainer: {
    width: width * 0.47,
    height: height * 0.2,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: width * 0.05,
    shadowColor: '#000', // Shadow for depth
    shadowOffset: { width: 0, height: height * 0.005 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
    top: 50,
    marginLeft: width * -0.4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  bookingCard: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingDate: {
    fontSize: 14,
    color: '#2f3542',
  },
  noBookingText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
  },
  seeAllButton: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  seeAllText: {
    color: "#fff",
    fontWeight: "bold",
  },
});


export default HomePage;
