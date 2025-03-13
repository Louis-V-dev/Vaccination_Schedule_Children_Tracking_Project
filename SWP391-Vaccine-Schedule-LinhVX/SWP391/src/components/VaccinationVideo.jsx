import React, { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FaPlay } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../css/VaccinationVideo.css';

const VaccinationVideo = () => {
    const [showModal, setShowModal] = useState(false);

    const handleClose = () => setShowModal(false);
    const handleShow = () => setShowModal(true);

    return (
        <>
            <motion.div 
                className="video-preview"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShow}
            >
                <div className="video-thumbnail">
                    <img 
                        src="https://img.freepik.com/free-photo/doctor-vaccinating-child-clinic_23-2148982492.jpg" 
                        alt="Vaccination Video Preview" 
                    />
                    <div className="play-button">
                        <FaPlay />
                    </div>
                </div>
                <div className="video-info">
                    <h4>Watch How Vaccination Protects Your Child</h4>
                    <p>Learn about the importance of timely vaccinations</p>
                </div>
            </motion.div>

            <Modal show={showModal} onHide={handleClose} size="lg" centered className="video-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Vaccination Information Video</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="video-container">
                        <iframe 
                            width="100%" 
                            height="400" 
                            src="https://www.youtube.com/embed/3aNhzLUL2ys" 
                            title="Vaccination Information Video" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                        ></iframe>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default VaccinationVideo; 