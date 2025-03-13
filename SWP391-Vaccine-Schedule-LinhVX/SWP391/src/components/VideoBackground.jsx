import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../css/VideoBackground.css';

const VideoBackground = () => {
    const [videoError, setVideoError] = useState(false);

    // Alternative video URLs in case the primary one fails
    const videoUrls = [
        "https://assets.mixkit.co/videos/preview/mixkit-medical-research-in-a-laboratory-with-screens-and-scientists-12698-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-scientist-in-a-laboratory-doing-research-on-a-tablet-12697-large.mp4",
        "https://assets.mixkit.co/videos/preview/mixkit-scientist-in-a-laboratory-looking-at-a-screen-12696-large.mp4"
    ];

    // Fallback image if video fails to load
    const fallbackImage = "https://img.freepik.com/free-photo/doctor-vaccinating-little-girl_23-2149158086.jpg";

    const handleVideoError = () => {
        console.log("Video failed to load, using fallback image");
        setVideoError(true);
    };

    return (
        <div className="video-background">
            <div className="video-overlay"></div>
            
            {!videoError ? (
                <motion.video
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ duration: 1.5 }}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="background-video"
                    onError={handleVideoError}
                    preload="auto"
                >
                    {videoUrls.map((url, index) => (
                        <source key={index} src={url} type="video/mp4" />
                    ))}
                    Your browser does not support the video tag.
                </motion.video>
            ) : (
                <motion.div 
                    className="fallback-image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    style={{ backgroundImage: `url(${fallbackImage})` }}
                />
            )}
        </div>
    );
};

export default VideoBackground; 