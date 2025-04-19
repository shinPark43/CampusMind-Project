import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';

const mockCourtData = {
    basketball: [
    { name: 'Court A', reserved: false },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    { name: 'Court B', reserved: true },
    { name: 'Court C', reserved: false },
    { name: 'Court D', reserved: true },
    ],
    badminton: [
    { name: 'Court A-1', reserved: true },
    { name: 'Court A-2', reserved: false },
    { name: 'Court B-1', reserved: false },
    { name: 'Court B-2', reserved: true },
    ],
    tableTennis: [
    { name: 'Table 1', reserved: false },
    { name: 'Table 2', reserved: true },
    ],
};

const CourtAvailabilityPage = () => {
    const renderCourt = (court) => (
        <TouchableOpacity
        key={court.name} // Add a unique key here
        style={[
            styles.court,
            court.reserved ? styles.reserved : styles.available,
        ]}
        >
        <Text style={styles.courtText}>{court.name}</Text>
        </TouchableOpacity>
    );

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

        {/* Basketball Courts */}
        <Text style={styles.sectionTitle}>Basketball Courts</Text>
        <View style={styles.grid}>
            {mockCourtData.basketball.map((court) => renderCourt(court))}
        </View>

        {/* Badminton/Pickleball Courts */}
        <Text style={styles.sectionTitle}>Badminton / Pickleball Courts</Text>
        <View style={styles.grid}>
            {mockCourtData.badminton.map((court) => renderCourt(court))}
        </View>

        {/* Table Tennis */}
        <Text style={styles.sectionTitle}>Table Tennis</Text>
        <FlatList
            data={mockCourtData.tableTennis}
            keyExtractor={(item) => item.name} // Ensure keyExtractor is set
            renderItem={({ item }) => renderCourt(item)}
            horizontal
            contentContainerStyle={styles.tableTennisContainer}
        />
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