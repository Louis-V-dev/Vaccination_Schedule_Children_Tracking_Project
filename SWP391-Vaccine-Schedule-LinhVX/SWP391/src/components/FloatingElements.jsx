import React from 'react';
import { motion } from 'framer-motion';
import { 
    FaSyringe, FaVial, FaHeartbeat, FaShieldAlt, FaStethoscope, FaHospital, 
    FaBaby, FaCalendarCheck, FaUserMd, FaClipboardCheck, FaTabletAlt, 
    FaFlask, FaLungs, FaHeadSideMask, FaThermometerHalf, FaFirstAid
} from 'react-icons/fa';
import '../css/FloatingElements.css';

const FloatingElements = () => {
    const elements = [
        // Original elements with faster durations
        { icon: <FaSyringe />, size: 30, color: '#38A3A5', x: '10%', y: '20%', duration: 5 },
        { icon: <FaVial />, size: 25, color: '#48B89F', x: '80%', y: '15%', duration: 6 },
        { icon: <FaHeartbeat />, size: 35, color: '#57CC99', x: '70%', y: '85%', duration: 5.5 },
        { icon: <FaShieldAlt />, size: 40, color: '#38A3A5', x: '20%', y: '80%', duration: 6.5 },
        { icon: <FaStethoscope />, size: 28, color: '#48B89F', x: '90%', y: '60%', duration: 4.5 },
        { icon: <FaHospital />, size: 32, color: '#57CC99', x: '30%', y: '40%', duration: 7 },
        
        // Additional elements
        { icon: <FaBaby />, size: 35, color: '#38A3A5', x: '15%', y: '30%', duration: 6 },
        { icon: <FaCalendarCheck />, size: 30, color: '#48B89F', x: '85%', y: '25%', duration: 5 },
        { icon: <FaUserMd />, size: 38, color: '#57CC99', x: '60%', y: '75%', duration: 5.8 },
        { icon: <FaClipboardCheck />, size: 32, color: '#38A3A5', x: '25%', y: '65%', duration: 4.8 },
        { icon: <FaTabletAlt />, size: 28, color: '#48B89F', x: '75%', y: '45%', duration: 6.2 },
        { icon: <FaFlask />, size: 26, color: '#57CC99', x: '40%', y: '55%', duration: 5.2 },
        { icon: <FaLungs />, size: 34, color: '#38A3A5', x: '50%', y: '35%', duration: 6.8 },
        { icon: <FaHeadSideMask />, size: 30, color: '#48B89F', x: '35%', y: '70%', duration: 5.4 },
        { icon: <FaThermometerHalf />, size: 28, color: '#57CC99', x: '65%', y: '20%', duration: 4.6 },
        { icon: <FaFirstAid />, size: 36, color: '#38A3A5', x: '45%', y: '90%', duration: 6.4 }
    ];

    return (
        <div className="floating-elements">
            {elements.map((element, index) => (
                <motion.div
                    key={index}
                    className="floating-element"
                    style={{
                        color: element.color,
                        fontSize: element.size,
                        left: element.x,
                        top: element.y
                    }}
                    animate={{
                        y: ['-20px', '20px', '-20px'],
                        x: ['-15px', '15px', '-15px'],
                        rotate: [0, 15, -15, 0]
                    }}
                    transition={{
                        duration: element.duration,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                >
                    {element.icon}
                </motion.div>
            ))}
        </div>
    );
};

export default FloatingElements; 