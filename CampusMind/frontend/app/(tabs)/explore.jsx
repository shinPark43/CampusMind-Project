// HomePage.jsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity, PanResponder } from 'react-native';
import { Link } from 'expo-router';
import { COLORS } from './theme'; // Import COLORS
import WeatherWidget from './WeatherWidget';
import courtImage from '../../assets/images/court.jpg';
import marketplaceImage from '../../assets/images/marketplace.jpg';
import trackerImage from '../../assets/images/tracker.jpg';
import { Image } from 'react-native';
import { useBooking } from './BookingContext';



const { width, height } = Dimensions.get('window');


const HomePage = () => {
  const [features, setFeatures] = useState([
    { title: 'Book a Court', link: 'BookingPage', image: courtImage }, 
    { title: 'Marketplace', link: 'MarketplacePage', image: marketplaceImage },  
    { title: 'Building Tracker', link: 'TrackingPage', image: trackerImage },  
  ]);

  const { bookingDetails } = useBooking();

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
              <Image source={feature.image} style={styles.cardImage} />
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
      <View style={styles.bookingSummary}>
        {bookingDetails ? (
          <View style={styles.bookingSummary}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <Text style={styles.summaryText}>Sport: {bookingDetails.sport}</Text>
            <Text style={styles.summaryText}>Date: {bookingDetails.date}</Text>
            <Text style={styles.summaryText}>Time: {bookingDetails.time}</Text>
          </View>
        ) : (
          <View style={styles.bookingSummary}>
            <Text style={styles.summaryTitle}>No Bookings Yet</Text>
            <Text style={styles.summaryText}>Go to the Booking Page to make a reservation.</Text>
          </View>
        )}
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
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    position: 'absolute',
    opacity: 0.8, // Make it slightly transparent
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
  bookingSummary: {
    width: width * 0.9,
    marginTop: height * 0.053,
    padding: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000', // Shadow for depth
    shadowOffset: { width: 0, height: height * 0.005 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: COLORS.textPrimary,
  },
  summaryText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
});


export default HomePage;
