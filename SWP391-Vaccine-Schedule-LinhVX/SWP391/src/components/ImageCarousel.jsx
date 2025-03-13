import React from 'react';
import { Carousel } from 'react-bootstrap';
import { motion } from 'framer-motion';
import '../css/ImageCarousel.css';

const ImageCarousel = () => {
    const carouselItems = [
        {
            id: 1,
            image: '/images/carousel/21x9__Image_3__A_diverse_group_of_hea.png',
            title: 'Safe Vaccination for Children',
            description: 'Our expert medical staff ensures a comfortable experience for your child.'
        },
        {
            id: 2,
            image: '/images/carousel/21x9_Image_1__A_friendly_female_pedia.png',
            title: 'Modern Healthcare Facilities',
            description: 'State-of-the-art equipment and child-friendly environments.'
        },
        {
            id: 3,
            image: '/images/carousel/21x9_Image_5__A_close_up_of_a_healthc.png',
            title: 'Comprehensive Health Monitoring',
            description: 'We track your child\'s health progress with detailed records and follow-ups.'
        }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="carousel-container"
        >
            <Carousel fade interval={5000} className="home-carousel">
                {carouselItems.map(item => (
                    <Carousel.Item key={item.id}>
                        <div className="carousel-image-container">
                            <img
                                className="d-block w-100 carousel-image"
                                src={item.image}
                                alt={item.title}
                            />
                            <div className="carousel-overlay"></div>
                        </div>
                        <Carousel.Caption>
                            <motion.h3 
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                {item.title}
                            </motion.h3>
                            <motion.p
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                {item.description}
                            </motion.p>
                        </Carousel.Caption>
                    </Carousel.Item>
                ))}
            </Carousel>
        </motion.div>
    );
};

export default ImageCarousel; 