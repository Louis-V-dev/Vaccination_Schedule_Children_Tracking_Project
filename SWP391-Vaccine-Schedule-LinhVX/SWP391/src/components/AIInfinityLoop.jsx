import React from 'react';
import { motion } from 'framer-motion';
import { Container, Row, Col } from 'react-bootstrap';
import { FaSyringe, FaCalendarCheck, FaBell, FaUserMd, FaChild, FaCheckCircle } from 'react-icons/fa';
import '../css/AIInfinityLoop.css';

const AIInfinityLoop = () => {
    const loopItems = [
        { icon: <FaChild />, text: "Child Profile", color: "#38A3A5" },
        { icon: <FaSyringe />, text: "Vaccine Selection", color: "#48B89F" },
        { icon: <FaCalendarCheck />, text: "Schedule Appointment", color: "#57CC99" },
        { icon: <FaUserMd />, text: "Medical Examination", color: "#57CC99" },
        { icon: <FaSyringe />, text: "Vaccination", color: "#48B89F" },
        { icon: <FaBell />, text: "Follow-up Reminder", color: "#38A3A5" },
        { icon: <FaCheckCircle />, text: "Health Record Update", color: "#38A3A5" }
    ];

    return (
        <Container className="ai-infinity-section py-5">
            <Row className="justify-content-center mb-5">
                <Col md={8} className="text-center">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="section-title"
                    >
                        AI-Powered Vaccination Journey
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                        className="section-subtitle"
                    >
                        Our intelligent system guides you through the complete vaccination process
                    </motion.p>
                </Col>
            </Row>
            
            <div className="infinity-loop-container">
                <div className="infinity-track">
                    {loopItems.map((item, index) => (
                        <motion.div
                            key={index}
                            className="loop-item"
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ 
                                duration: 0.5, 
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 100
                            }}
                            viewport={{ once: true }}
                            style={{ backgroundColor: item.color }}
                        >
                            <div className="loop-icon">
                                {item.icon}
                            </div>
                            <div className="loop-text">{item.text}</div>
                            {index < loopItems.length - 1 && (
                                <div className="connector-line"></div>
                            )}
                        </motion.div>
                    ))}
                </div>
                
                <motion.div 
                    className="ai-pulse"
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop"
                    }}
                >
                    <div className="ai-core">AI</div>
                </motion.div>
            </div>
        </Container>
    );
};

export default AIInfinityLoop; 