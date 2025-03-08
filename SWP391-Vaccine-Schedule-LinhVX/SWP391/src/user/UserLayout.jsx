import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import UserSidebar from '../components/UserSidebar';
import NavBar from '../components/Navbar';
import '../css/UserLayout.css';

const UserLayout = ({ children }) => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!token || !isLoggedIn) {
            navigate('/login');
            return;
        }
        
        try {
            const decoded = jwtDecode(token);
            setUsername(decoded.sub || 'User');
            
            // Check token expiration
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
                localStorage.clear();
                navigate('/login');
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            localStorage.clear();
            navigate('/login');
        }
    }, [navigate]);
    
    return (
        <div className="user-layout-container">
            <NavBar />
            <div className="user-layout">
                <Container fluid className="p-0">
                    <Row className="g-0">
                        <Col xs={12} md={3} lg={2} className="sidebar-col">
                            <UserSidebar username={username} />
                        </Col>
                        <Col xs={12} md={9} lg={10} className="content-col">
                            <div className="user-content">
                                {children}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    );
};

export default UserLayout; 