import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

const CourtAvailabilityPage = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCourts();
    }, []);

    const fetchCourts = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {
                setError("No token found!");
                setLoading(false);
                return;
            }

            const response = await fetch('http://192.168.1.50:3000/courts/getAllCourts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            
            if (response.ok) {
                setCourts(data);
            } else {
                setError(data.error || 'Failed to fetch courts');
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
            setError('Failed to fetch courts');
        } finally {
            setLoading(false);
        }
    };

    // Group courts by sport
    const groupedCourts = courts.reduce((acc, court) => {
        const sportName = court.sport_name;
        if (!acc[sportName]) {
            acc[sportName] = [];
        }
        acc[sportName].push(court);
        return acc;
    }, {});

    const renderCourt = (court) => (
        <TouchableOpacity
            key={court._id}
            style={[
                styles.court,
                court.is_available ? styles.available : styles.reserved,
            ]}
        >
            <Text style={styles.courtText}>{court.court_name}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#778FFF" />
                <Text style={styles.loadingText}>Loading courts...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCourts}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Page Title */}
            <Text style={styles.pageTitle}>Court Availability</Text>

            {/* Legend */}
            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, styles.available]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, styles.reserved]} />
                    <Text style={styles.legendText}>Reserved</Text>
                </View>
            </View>

            {/* Render courts grouped by sport */}
            {Object.entries(groupedCourts).map(([sportName, sportCourts]) => (
                <View key={sportName}>
                    <Text style={styles.sectionTitle}>{sportName} Courts</Text>
                    <View style={styles.grid}>
                        {sportCourts.map((court) => renderCourt(court))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#1B263B',
        paddingBottom: 80, // Prevent overlap with the tab bar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B263B',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1B263B',
        padding: 20,
    },
    errorText: {
        color: '#F56565',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#778FFF',
        padding: 15,
        borderRadius: 10,
        width: '50%',
    },
    retryButtonText: {
        color: '#FFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginTop: '10%', // Add margin to the top
        marginBottom: 20, // Add spacing below the title
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    legendColor: {
        width: 20,
        height: 20,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 16,
        color: '#FFF',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    court: {
        width: '48%', // Two columns
        height: 100,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    reserved: {
        backgroundColor: '#A0AEC0', // Cool gray
    },
    available: {
        backgroundColor: '#68D391', // Cool green
    },
    courtText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    tableTennisContainer: {
        marginBottom: 20,
    },
});

export default CourtAvailabilityPage;