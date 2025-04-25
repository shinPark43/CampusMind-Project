import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export default function AdminPortal() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [sports, setSports] = useState([]);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reservations, setReservations] = useState([]);

  const TIME_OPTIONS = [
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
    "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
    "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
    "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM"
  ];

  const fetchReservationsByDate = async (dateString) => {
    try {
      const response = await fetch(`http://localhost:3000/reservations/by-date?date=${dateString}`);
      const data = await response.json();
      if (response.ok) {
        setReservations(data);
      } else {
        console.error("Failed to fetch reservations:", data.error);
        setReservations([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setReservations([]);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      fetchReservationsByDate(formattedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/sports");
        const data = await res.json();
        setSports(data);
      } catch (err) {
        console.error("Failed to load sports:", err);
      }
    };
    fetchSports();
  }, []);

  const handleCreateWalkIn = async () => {
    if (!selectedSport || !selectedDate || !startTime || !endTime) {
      alert("Please fill in all fields.");
      return;
    }
    const startIndex = TIME_OPTIONS.indexOf(startTime);
const endIndex = TIME_OPTIONS.indexOf(endTime);
if (startIndex >= endIndex) {
  alert("End time must be after start time.");
  return;
}
    const reservationData = {
      sportName: selectedSport,
      date: selectedDate.toISOString().split('T')[0],
      time: `${startTime} - ${endTime}`,
    };
    try {
      const response = await fetch("http://localhost:3000/reservations/createWalkIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationData),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to create reservation.");
      } else {
        alert("✅ Walk-in reservation created!");
        setSelectedSport("");
        setSelectedDate(null);
        setStartTime("");
        setEndTime("");
      }
    } catch (err) {
      console.error("Walk-in error:", err);
      alert("An error occurred while creating the reservation.");
    }
  };
  const handleDelete = async (reservationId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this reservation?");
    if (!confirmDelete) return;
  
    try {
      const response = await fetch(`http://localhost:3000/reservations/cancelReservation/${reservationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.error || "Failed to delete reservation.");
      } else {
        alert("✅ Reservation deleted successfully!");
        if (selectedDate) {
          const formattedDate = selectedDate.toISOString().split("T")[0];
          fetchReservationsByDate(formattedDate);
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the reservation.");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-left mb-6">Gym Reservation System</h1>
      <div className="flex gap-6">
        <div className="w-2/5 flex flex-col gap-4">
          <Card className="p-4 w-full">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[500px]">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 w-full">
            <h2 className="text-lg font-bold mb-2">Reservations</h2>
            {reservations.length > 0 ? (
  reservations.map((res) => (
    <div key={res._id} className="flex justify-between items-center border-b py-2">
      <div>
        <p className="font-semibold">{res.sportName}</p>
        <p className="text-sm text-gray-500">
          {res.time} | {res.userName || "Walk-in reservation"}
        </p>
      </div>
      <div className="space-x-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedReservation(res)}>
          Modify
        </Button>
        <Button
  variant="destructive"
  size="sm"
  onClick={() => handleDelete(res._id)}
>
  Delete
</Button>
      </div>
    </div>
  ))
) : (
  <p className="text-gray-500">Nothing is booked on this day so far.</p>
)}
          </Card>
        </div>

        <div className="w-3/5 space-y-4">
          <Card className="p-4">
            <h2 className="text-lg font-bold mb-4">Create Walk-in Reservation</h2>
            <div className="space-y-3">
              <label className="block font-medium">Sport</label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              >
                <option value="" disabled>Select a sport</option>
                {sports.map((sport) => (
                  <option key={sport._id} value={sport.sport_name}>
                    {sport.sport_name}
                  </option>
                ))}
              </select>

              <div>
                <div
                  className="w-full border p-2 rounded cursor-pointer"
                  onClick={() => setCalendarVisible(!calendarVisible)}
                >
                  {selectedDate ? selectedDate.toLocaleDateString() : "Select a date"}
                </div>

                {calendarVisible && (
                  <div className="mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarVisible(false);
                      }}
                      className="rounded-md border w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block font-medium mb-1">Start Time</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  >
                    <option value="" disabled>Select start time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="w-1/2">
                  <label className="block font-medium mb-1">End Time</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  >
                    <option value="" disabled>Select end time</option>
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleCreateWalkIn}>Create</Button>
            </div>
          </Card>

          {selectedReservation && (
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-4">Edit Reservation</h2>
              <p><strong>Sport:</strong> {selectedReservation.sport}</p>
              <p><strong>Time:</strong> {selectedReservation.time}</p>
              <p><strong>User:</strong> {selectedReservation.user}</p>
              <div className="mt-4 space-x-2">
                <Button>Save Changes</Button>
                <Button variant="outline" onClick={() => setSelectedReservation(null)}>Cancel</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}