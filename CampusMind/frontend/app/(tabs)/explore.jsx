// HomePage.jsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, PanResponder } from 'react-native';
import { Link } from 'expo-router';

const { width } = Dimensions.get('window');

const HomePage = () => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const features = [
    { title: 'Book a Court', link: 'BookingPage' },
    { title: 'Marketplace', link: 'MarketplacePage' },
    { title: 'Building Tracker', link: 'TrackingPage' },
  ];

  // ✅ PanResponder to handle swipes
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        const threshold = width * 0.25; // Minimum swipe distance
        let newIndex = currentIndex;

        if (gestureState.dx < -threshold) {
          // Left Swipe → Next Card
          if (currentIndex < features.length - 1) {
            newIndex += 1;
          }
        } else if (gestureState.dx > threshold) {
          // Right Swipe → Previous Card
          if (currentIndex > 0) {
            newIndex -= 1;
          }
        }

        // Update Index & Animate Scroll
        setCurrentIndex(newIndex);
        Animated.spring(scrollX, {
          toValue: newIndex * width,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CampusMind</Text>
      <View style={styles.carouselContainer} {...panResponder.panHandlers}>
        {features.map((feature, index) => {
          const translateX = Animated.multiply(scrollX, -1); // Reverse scroll for left swipe

          return (
            <Animated.View
              key={feature.title}
              style={[
                styles.card,
                {
                  transform: [{ translateX: Animated.add(translateX, index * width) }],
                  opacity: scrollX.interpolate({
                    inputRange: features.map((_, i) => i * width), // Ascending inputRange
                    outputRange: features.map((_, i) => (i === index ? 1 : 0.5)), // Active card = 1, Others = 0.5
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            >
              <Link href={feature.link} style={styles.link}>
                <Text style={styles.linkText}>{feature.title}</Text>
              </Link>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  carouselContainer: {
    width: width,
    height: 400,
    overflow: 'hidden',
  },
  card: {
    width: width * 0.8,
    height: 350,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: width * 0.1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  link: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  linkText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default HomePage;
