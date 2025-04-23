import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

export default function AdminPortal() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const mockReservations = [
    { id: 1, time: '2 PM - 4 PM', sport: 'Basketball', user: 'CID 1234' },
    { id: 2, time: '4 PM - 6 PM', sport: 'Volleyball', user: 'CID 5678' }
  ];

  return (
    <div className="flex p-4 gap-4">
      <div className="w-1/3">
        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
        <Card className="mt-4">
          <CardContent>
            <h2 className="text-lg font-bold mb-2">Reservations</h2>
            {mockReservations.map((res) => (
              <div key={res.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <p className="font-semibold">{res.sport}</p>
                  <p className="text-sm text-gray-500">{res.time} | {res.user}</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedReservation(res)}>Modify</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="w-2/3">
        {selectedReservation ? (
          <Card>
            <CardContent>
              <h2 className="text-lg font-bold mb-4">Edit Reservation</h2>
              <p><strong>Sport:</strong> {selectedReservation.sport}</p>
              <p><strong>Time:</strong> {selectedReservation.time}</p>
              <p><strong>User:</strong> {selectedReservation.user}</p>
              {/* Inputs for editing can go here */}
              <div className="mt-4">
                <Button className="mr-2">Save Changes</Button>
                <Button variant="outline" onClick={() => setSelectedReservation(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent>
              <p className="text-gray-500">Select a reservation to modify</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
