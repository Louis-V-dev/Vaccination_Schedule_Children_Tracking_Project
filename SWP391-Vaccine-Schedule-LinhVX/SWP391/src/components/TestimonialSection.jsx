import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../css/TestimonialSection.css';

const TestimonialSection = () => {
    const testimonials = [
        {
            id: 1,
            name: "Sarah Johnson",
            role: "Parent of two",
            image: "https://randomuser.me/api/portraits/women/32.jpg",
            quote: "The vaccination scheduling system has made keeping track of my children's immunizations so much easier. The reminders are a lifesaver for busy parents!",
            rating: 5
        },
        {
            id: 2,
            name: "Michael Chen",
            role: "Healthcare Professional",
            image: "https://randomuser.me/api/portraits/men/45.jpg",
            quote: "As a pediatrician, I recommend this platform to all my patients. It helps ensure children receive their vaccines on time and maintains accurate records.",
            rating: 5
        },
        {
            id: 3,
            name: "Emily Rodriguez",
            role: "First-time parent",
            image: "https://randomuser.me/api/portraits/women/65.jpg",
            quote: "Being a new parent is overwhelming, but this system has guided me through the vaccination process step by step. The educational resources are excellent!",
            rating: 4
        }
    ];

    return (
        <section className="testimonial-section py-5">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-5"
                >
                    <h2 className="section-title">What Parents Say</h2>
                    <p className="section-subtitle">Hear from families who trust our vaccination scheduling system</p>
                </motion.div>

                <Row>
                    {testimonials.map((testimonial, index) => (
                        <Col lg={4} md={6} className="mb-4" key={testimonial.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                                viewport={{ once: true }}
                            >
                                <Card className="testimonial-card">
                                    <div className="quote-icon">
                                        <FaQuoteLeft />
                                    </div>
                                    <Card.Body>
                                        <div className="testimonial-rating mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar key={i} className={i < testimonial.rating ? 'star-filled' : 'star-empty'} />
                                            ))}
                                        </div>
                                        <Card.Text className="testimonial-quote">
                                            "{testimonial.quote}"
                                        </Card.Text>
                                        <div className="testimonial-author">
                                            <img 
                                                src={testimonial.image} 
                                                alt={testimonial.name} 
                                                className="testimonial-avatar" 
                                            />
                                            <div className="testimonial-info">
                                                <h5 className="testimonial-name">{testimonial.name}</h5>
                                                <p className="testimonial-role">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
};

export default TestimonialSection; 