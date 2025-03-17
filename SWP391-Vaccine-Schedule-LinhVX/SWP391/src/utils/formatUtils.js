import { format } from 'date-fns';

/**
 * Format a date string to a more readable format
 * @param {string} dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, formatStyle = 'full') => {
  try {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return dateString;
    }
    
    switch (formatStyle) {
      case 'short':
        return format(date, 'MM/dd/yyyy');
      case 'medium':
        return format(date, 'MMM d, yyyy');
      case 'full':
      default:
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Format a time string to a more readable format
 * @param {string} timeString - Time string in 24-hour format (HH:MM)
 * @returns {string} Formatted time string in 12-hour format
 */
export const formatTime = (timeString, includeAmPm = true) => {
  try {
    if (!timeString) return '';
    
    // Handle different time formats
    let time;
    if (timeString.includes('T')) {
      // ISO datetime format
      time = new Date(timeString);
    } else if (timeString.includes(':')) {
      // Time only format (e.g., '14:30:00')
      const [hours, minutes] = timeString.split(':');
      time = new Date();
      time.setHours(parseInt(hours, 10));
      time.setMinutes(parseInt(minutes, 10));
    } else {
      return timeString;
    }
    
    if (isNaN(time.getTime())) {
      console.error('Invalid time:', timeString);
      return timeString;
    }
    
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: includeAmPm
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

/**
 * Format a price to display as currency
 * @param {number} price - The price value
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'USD') => {
  if (price === null || price === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};

/**
 * Format a name to title case
 * @param {string} name - The name to format
 * @returns {string} Formatted name in title case
 */
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Calculate age from date of birth
 * @param {string} dob - Date of birth string
 * @returns {number} - Age in years
 */
export const calculateAge = (dob) => {
  try {
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    
    if (isNaN(birthDate.getTime())) {
      console.error('Invalid date of birth:', dob);
      return 0;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
}; 