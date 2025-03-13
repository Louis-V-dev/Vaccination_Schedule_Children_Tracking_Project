import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import '../css/EndlessLoopVideo.css';

const EndlessLoopVideo = () => {
    return (
        <section className="endless-loop-section py-5">
            <Container>
                <Row className="justify-content-center mb-4">
                    <Col md={8} className="text-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="section-title"
                        >
                            Seamless Vaccination Journey
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="section-subtitle"
                        >
                            Our intelligent system guides your child through the complete vaccination process
                        </motion.p>
                    </Col>
                </Row>
                
                <Row className="justify-content-center">
                    <Col lg={10}>
                        <motion.div 
                            className="video-loop-container"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <div className="ratio ratio-16x9">
                                <iframe 
                                    src="/images/animations/0312(1).mp4" type="video/mp4" 
                                    title="Vaccination Process Loop" 
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    
                                ></iframe>
                            </div>
                            
                            <div className="loop-overlay">
                                <div className="loop-steps">
                                    <div className="loop-step">
                                        <div className="step-number">1</div>
                                        <div className="step-text">Registration</div>
                                    </div>
                                    <div className="loop-step">
                                        <div className="step-number">2</div>
                                        <div className="step-text">Scheduling</div>
                                    </div>
                                    <div className="loop-step">
                                        <div className="step-number">3</div>
                                        <div className="step-text">Vaccination</div>
                                    </div>
                                    <div className="loop-step">
                                        <div className="step-number">4</div>
                                        <div className="step-text">Follow-up</div>
                                    </div>
                                    <div className="loop-step">
                                        <div className="step-number">5</div>
                                        <div className="step-text">Health Record</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default EndlessLoopVideo; 