//bookingOption.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const COURTS = [
  { name: 'Badminton', icon: 'https://img.icons8.com/color/48/000000/badminton.png' },
  { name: 'Basketball', icon: 'https://img.icons8.com/color/48/000000/basketball.png' },
  { name: 'Table Tennis', icon: 'https://img.icons8.com/color/48/000000/table-tennis.png' },
  { name: 'Pickleball', icon: 'https://img.icons8.com/color/48/000000/pickle-ball.png' },
];

// Component for selecting a sport using icon buttons in a grid
function SelectSport({ onNext, onBack }) {
  const [selectedSport, setSelectedSport] = useState('Basketball');

  const handleSportSelect = (court) => {
    setSelectedSport(court.name);
    // Immediately move to the next step with the selected sport
    onNext({ sport: court.name });
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.header}>Select a Sport</Text>
      <View style={styles.gridContainer}>
        {COURTS.map((court, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.sportButton,
              selectedSport === court.name && styles.selectedSportButton,
            ]}
            onPress={() => handleSportSelect(court)}
          >
            <Image source={{ uri: court.icon }} style={styles.sportIcon} />
            <Text style={styles.sportText}>{court.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Component for selecting a date and time slot (hour) with a modern horizontal scroll design
function SelectHour({ onNext, initialData, onBack }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const generateHours = () => {
    const hoursArray = [];
    for (let hour = 7; hour <= 23; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const period = hour >= 12 ? 'pm' : 'am';
      hoursArray.push(`${displayHour}:00 ${period}`);
    }
    return hoursArray;
  };

  const hours = generateHours();
  const [selectedHour, setSelectedHour] = useState(null);

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    // Immediately navigate to the next step with the selected hour and date
    onNext({ ...initialData, hour, date: selectedDate });
  };

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.header}>Select Date & Time</Text>
      <View style={styles.datePickerContainer}>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (date) setSelectedDate(date);
          }}
          style={styles.datePicker}
        />
      </View>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScrollContainer}
      >
        {hours.map((hour, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.hourCard,
              selectedHour === hour && styles.selectedHourCard,
            ]}
            onPress={() => handleHourSelect(hour)}
          >
            <Text style={styles.hourText}>{hour}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Component for selecting the number of people and submitting the reservation
function SelectPeople({ onSubmit, initialData, onBack }) {
  const [numPeople, setNumPeople] = useState(1);

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.header}>Number of People</Text>
      <Picker
        selectedValue={numPeople}
        style={styles.inputContainer}
        onValueChange={(itemValue) => setNumPeople(itemValue)}
      >
        {[...Array(10).keys()].map(i => (
          <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
        ))}
      </Picker>
      <TouchableOpacity
        style={styles.button_signUp}
        onPress={() => onSubmit({ ...initialData, numPeople })}
      >
        <Text style={styles.buttonText}>Reserve</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main booking screen that handles the multi-step process
export default function BookingScreen() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});

  const handleNext = (data) => {
    setFormData(prevData => ({ ...prevData, ...data }));
    setStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prevStep => prevStep - 1);
    }
  };

  const handleSubmit = async (data) => {
    try {
      const response = await fetch('https://192.168.1.167:3000/reservations/createReservation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Reservation failed');
      }
      const result = await response.json();
      console.log('Reservation successful:', result);
      // Optionally, navigate to a confirmation screen or reset the form
    } catch (error) {
      console.error('Error during reservation:', error);
    }
  };

  return (
    <View style={styles.container}>
      {step === 0 && <SelectSport onNext={handleNext} />}
      {step === 1 && <SelectHour onNext={handleNext} initialData={formData} onBack={handleBack} />}
      {step === 2 && <SelectPeople onSubmit={handleSubmit} initialData={formData} onBack={handleBack} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1B263B',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFF',
  },
  sub_header: {
    fontSize: 14,
    marginBottom: 40,
    color: '#FFF',
  },
  // Input container for Picker styling (used in SelectPeople)
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
  // Date picker container style
  datePickerContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  datePicker: {
    width: '100%',
  },
  // Styles for horizontal hour selection
  horizontalScrollContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  hourCard: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  selectedHourCard: {
    backgroundColor: '#778DA9',
  },
  hourText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Styles for the sport selection grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  sportButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  selectedSportButton: {
    backgroundColor: '#e0e0e0',
  },
  sportIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  sportText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Button styles
  button: {
    marginTop: 10,
    backgroundColor: '#778DA9',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 15,
  },
  button_signUp: {
    marginTop: 10,
    backgroundColor: '#778FFF',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Back button styling
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
