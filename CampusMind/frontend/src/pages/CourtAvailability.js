import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FaBasketballBall, FaTableTennis, FaVolleyballBall } from 'react-icons/fa';
import { GiTennisRacket } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/CourtAvailability.css';

const CourtAvailability = () => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourts();
    }, []);

    const fetchCourts = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/courts`);
            setCourts(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching courts:', err);
            setError('Failed to fetch court availability');
            setLoading(false);
        }
    };

    const getSportIcon = (sportName) => {
        switch (sportName.toLowerCase()) {
            case 'basketball':
                return <FaBasketballBall className="sport-icon" />;
            case 'badminton':
                return <GiTennisRacket className="sport-icon" />;
            case 'pickleball':
                return <FaVolleyballBall className="sport-icon" />;
            case 'table tennis':
                return <FaTableTennis className="sport-icon" />;
            default:
                return null;
        }
    };

    const handleBookCourt = (courtId) => {
        if (!user) {
            toast.info('Please log in to book a court');
            navigate('/login');
            return;
        }
        navigate(`/booking/${courtId}`);
    };

    const getSharedCourtInfo = (court) => {
        if (!court.is_shared) return null;
        return (
            <div className="shared-court-info">
                <Badge bg="info" className="me-2">Shared Court</Badge>
                <small className="text-muted">
                    Shared with: {court.shared_with.join(', ')}
                </small>
            </div>
        );
    };

    if (loading) {
        return (
            <Container className="text-center my-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h1 className="text-center mb-5">Court Availability</h1>
            <Row xs={1} md={2} lg={3} className="g-4">
                {courts.map((court) => (
                    <Col key={court._id}>
                        <Card className="h-100 court-card">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <Card.Title className="mb-2">{court.court_name}</Card.Title>
                                        <div className="d-flex align-items-center mb-2">
                                            {getSportIcon(court.sport_id.sport_name)}
                                            <span className="ms-2">{court.sport_id.sport_name}</span>
                                        </div>
                                        {getSharedCourtInfo(court)}
                                    </div>
                                    <Badge 
                                        bg={court.is_available ? "success" : "danger"}
                                        className="status-badge"
                                    >
                                        {court.is_available ? "Available" : "Occupied"}
                                    </Badge>
                                </div>
                                <Button
                                    variant={court.is_available ? "primary" : "secondary"}
                                    className="w-100"
                                    onClick={() => handleBookCourt(court._id)}
                                    disabled={!court.is_available}
                                >
                                    {court.is_available ? "Book Now" : "Not Available"}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
};

export default CourtAvailability;

// Add these styles to your CSS file
const styles = `
.court-card {
    transition: transform 0.2s;
    border: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.court-card:hover {
    transform: translateY(-5px);
}

.sport-icon {
    font-size: 1.5rem;
    color: #666;
}

.status-badge {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
}

.shared-court-info {
    margin-top: 0.5rem;
    font-size: 0.9rem;
}

.court-card .btn {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    font-weight: 500;
}

.court-card .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
`; 