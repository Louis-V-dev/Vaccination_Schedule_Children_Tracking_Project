import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faChild, 
    faCalendarAlt, 
    faSyringe, 
    faBox,
    faListAlt,
    faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import '../css/UserSidebar.css';

const UserSidebar = ({ username }) => {
    const location = useLocation();
    
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };
    
    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const defaultAvatar = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
            <rect width="150" height="150" fill="#e8f5e9"/>
            <circle cx="75" cy="60" r="30" fill="#28a745"/>
            <circle cx="75" cy="140" r="50" fill="#28a745"/>
        </svg>
    `)}`;
    
    return (
        <div className="user-sidebar">
            <div className="user-profile-image">
                <div className="profile-image-container">
                    <img 
                        src={defaultAvatar}
                        alt="Profile" 
                        className="profile-avatar"
                    />
                </div>
                <div className="username-display">{username || 'User'}</div>
            </div>
            
            <nav className="sidebar-nav">
                <ul>
                    <li className={isActive('/profile')}>
                        <Link to="/profile">
                            <FontAwesomeIcon icon={faUser} className="nav-icon" />
                            USER PROFILE
                        </Link>
                    </li>
                    <li className={isActive('/children')}>
                        <Link to="/children">
                            <FontAwesomeIcon icon={faChild} className="nav-icon" />
                            CHILDREN MANAGEMENT
                        </Link>
                    </li>
                    <li className={isActive('/appointments')}>
                        <Link to="/appointments">
                            <FontAwesomeIcon icon={faListAlt} className="nav-icon" />
                            MY APPOINTMENTS
                        </Link>
                    </li>
                    <li className={isActive('/vaccination-history')}>
                        <Link to="/vaccination-history">
                            <FontAwesomeIcon icon={faSyringe} className="nav-icon" />
                            VACCINATION HISTORY
                        </Link>
                    </li>
                    <li className={isActive('/service-package')}>
                        <Link to="/service-package">
                            <FontAwesomeIcon icon={faBox} className="nav-icon" />
                            SERVICE PACKAGE
                        </Link>
                    </li>
                    <li>
                        <a href="#" onClick={handleLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
                            LOGOUT
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default UserSidebar; 