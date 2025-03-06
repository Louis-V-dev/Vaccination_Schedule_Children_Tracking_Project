import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8080/api';

// Add auth token to requests
axios.interceptors.request.use(
  config => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

/**
 * Get all intervals for a vaccine
 * @param {number} vaccineId - The ID of the vaccine
 * @returns {Promise<Array>} - List of intervals
 */
export const getIntervalsForVaccine = async (vaccineId) => {
  try {
    const response = await axios.get(`${API_URL}/vaccines/${vaccineId}/intervals`);
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data);
    throw new Error(`Error fetching intervals: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Create a new interval for a vaccine
 * @param {number} vaccineId - The ID of the vaccine
 * @param {Object} intervalData - The interval data
 * @param {number} [retryCount=0] - Number of retry attempts
 * @returns {Promise<Object>} - The created interval
 */
export const createInterval = async (vaccineId, intervalData, retryCount = 0) => {
  try {
    console.log(`Attempt ${retryCount + 1} to create interval:`, intervalData);
    const response = await axios.post(`${API_URL}/vaccines/${vaccineId}/intervals`, intervalData);
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data);
    
    // If we get an overlap error and haven't retried too many times, try again after a delay
    if (error.response?.data?.code === 1010 && retryCount < 2) {
      console.log(`Interval overlap detected. Retrying after delay (attempt ${retryCount + 1})...`);
      // Wait longer with each retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      
      // Try to fetch existing intervals to see what's causing the overlap
      try {
        console.log(`Checking existing intervals for vaccine ${vaccineId}...`);
        const intervals = await getIntervalsForVaccine(vaccineId);
        console.log(`Found ${intervals.length} intervals:`, intervals);
        
        // Find any intervals that might overlap with our range
        const potentialOverlaps = intervals.filter(interval => 
          (interval.fromDose === intervalData.fromDose && interval.toDose === intervalData.toDose) ||
          (interval.fromDose <= intervalData.fromDose && interval.toDose >= intervalData.fromDose) ||
          (interval.fromDose <= intervalData.toDose && interval.toDose >= intervalData.toDose)
        );
        
        if (potentialOverlaps.length > 0) {
          console.log(`Found ${potentialOverlaps.length} potentially overlapping intervals:`, potentialOverlaps);
          
          // Try to delete each potential overlap
          for (const overlap of potentialOverlaps) {
            try {
              console.log(`Deleting overlapping interval: ${overlap.id}`);
              await deleteInterval(vaccineId, overlap.id);
              // Wait a bit after each deletion
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (deleteError) {
              console.error(`Error deleting interval ${overlap.id}:`, deleteError);
            }
          }
          
          // Wait a bit after all deletions
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (fetchError) {
        console.error('Error fetching intervals:', fetchError);
      }
      
      // Retry the creation
      return createInterval(vaccineId, intervalData, retryCount + 1);
    }
    
    throw new Error(`Error creating interval: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Update an existing interval
 * @param {number} vaccineId - The ID of the vaccine
 * @param {number} intervalId - The ID of the interval
 * @param {Object} intervalData - The updated interval data
 * @returns {Promise<Object>} - The updated interval
 */
export const updateInterval = async (vaccineId, intervalId, intervalData) => {
  try {
    const response = await axios.put(`${API_URL}/vaccines/${vaccineId}/intervals/${intervalId}`, intervalData);
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data);
    throw new Error(`Error updating interval: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Delete an interval
 * @param {number} vaccineId - The ID of the vaccine
 * @param {number} intervalId - The ID of the interval
 * @returns {Promise<void>}
 */
export const deleteInterval = async (vaccineId, intervalId) => {
  try {
    await axios.delete(`${API_URL}/vaccines/${vaccineId}/intervals/${intervalId}`);
  } catch (error) {
    console.error('Error details:', error.response?.data);
    throw new Error(`Error deleting interval: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Delete all intervals for a vaccine
 * @param {number} vaccineId - The ID of the vaccine
 * @returns {Promise<void>}
 */
export const deleteAllIntervalsForVaccine = async (vaccineId) => {
  try {
    await axios.delete(`${API_URL}/vaccines/${vaccineId}/intervals`);
  } catch (error) {
    console.error('Error details:', error.response?.data);
    throw new Error(`Error deleting intervals: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Check for existing intervals that might conflict with the ones we want to create
 * @param {number} vaccineId - The ID of the vaccine
 * @param {Array} intervalDataArray - Array of interval data objects
 * @returns {Promise<Array>} - Array of potentially conflicting intervals
 */
export const checkForConflictingIntervals = async (vaccineId) => {
  try {
    console.log(`Checking for existing intervals for vaccine ${vaccineId}`);
    const intervals = await getIntervalsForVaccine(vaccineId);
    console.log(`Found ${intervals.length} existing intervals`);
    return intervals;
  } catch (error) {
    console.error('Error checking for existing intervals:', error);
    return [];
  }
};

/**
 * Special function to handle the case where we need to create intervals in a specific order
 * to avoid overlap errors
 * @param {number} vaccineId - The ID of the vaccine
 * @param {Array} intervalDataArray - Array of interval data objects
 * @returns {Promise<Array>} - Array of created intervals
 */
export const createIntervalsWithRetry = async (vaccineId, intervalDataArray) => {
  console.log(`Attempting to create ${intervalDataArray.length} intervals with special handling`);
  
  // First, delete all existing intervals
  try {
    console.log(`Deleting all existing intervals for vaccine ${vaccineId}`);
    await deleteAllIntervalsForVaccine(vaccineId);
    // Increase wait time after deletion to 3 seconds
    console.log('Waiting 3 seconds for deletion to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Deleted all existing intervals');
    
    // Verify deletion by fetching intervals
    const remainingIntervals = await getIntervalsForVaccine(vaccineId);
    console.log(`After deletion, found ${remainingIntervals.length} remaining intervals`);
    if (remainingIntervals.length > 0) {
      console.warn('Warning: Some intervals still exist after deletion. Attempting to delete them individually.');
      for (const interval of remainingIntervals) {
        try {
          await deleteInterval(vaccineId, interval.id);
          console.log(`Manually deleted interval ${interval.id}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Failed to delete interval ${interval.id}:`, err);
        }
      }
      // Check again
      const finalCheck = await getIntervalsForVaccine(vaccineId);
      console.log(`After manual deletion, found ${finalCheck.length} remaining intervals`);
    }
  } catch (deleteError) {
    console.error('Error deleting existing intervals:', deleteError);
    // Continue even if deletion fails
  }
  
  // Try different strategies to create intervals
  const strategies = [
    // Strategy 1: Create in reverse order (last to first)
    async () => {
      console.log('Strategy 1: Creating intervals in reverse order');
      const results = [];
      const errors = [];
      
      // Clone and reverse the array
      const reversedData = [...intervalDataArray].reverse();
      
      for (const data of reversedData) {
        try {
          console.log(`Attempting to create interval from dose ${data.fromDose} to ${data.toDose} with ${data.intervalDays} days`);
          // Increase delay between creations
          await new Promise(resolve => setTimeout(resolve, 1500));
          const result = await createInterval(vaccineId, data);
          results.push(result);
          console.log(`Successfully created interval ${data.fromDose} to ${data.toDose} with ID ${result.id}`);
        } catch (error) {
          console.error(`Error creating interval ${data.fromDose} to ${data.toDose}:`, error);
          errors.push({ data, error });
          
          // If we get an overlap error, try to find and delete the overlapping interval
          if (error.message && error.message.includes('overlap')) {
            try {
              console.log(`Attempting to resolve overlap for interval ${data.fromDose} to ${data.toDose}`);
              const intervals = await getIntervalsForVaccine(vaccineId);
              console.log(`Found ${intervals.length} intervals to check for overlap`);
              
              // Find potentially overlapping intervals
              const overlapping = intervals.filter(i => 
                (data.fromDose <= i.toDose && data.toDose >= i.fromDose)
              );
              
              console.log(`Found ${overlapping.length} potentially overlapping intervals`);
              
              // Delete overlapping intervals
              for (const interval of overlapping) {
                console.log(`Deleting overlapping interval: ${interval.id}`);
                await deleteInterval(vaccineId, interval.id);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
              
              // Try again after deleting overlapping intervals
              console.log(`Retrying creation of interval ${data.fromDose} to ${data.toDose}`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              const retryResult = await createInterval(vaccineId, data);
              results.push(retryResult);
              console.log(`Successfully created interval ${data.fromDose} to ${data.toDose} on retry`);
            } catch (retryError) {
              console.error(`Failed to resolve overlap for interval ${data.fromDose} to ${data.toDose}:`, retryError);
            }
          }
        }
      }
      
      return { results, errors };
    },
    
    // Strategy 2: Create in forward order with longer delays
    async () => {
      console.log('Strategy 2: Creating intervals in forward order with longer delays');
      const results = [];
      const errors = [];
      
      // Delete all intervals again before trying this strategy
      try {
        await deleteAllIntervalsForVaccine(vaccineId);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error deleting intervals before strategy 2:', error);
      }
      
      for (const data of intervalDataArray) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const result = await createInterval(vaccineId, data);
          results.push(result);
          console.log(`Successfully created interval ${data.fromDose} to ${data.toDose}`);
        } catch (error) {
          console.error(`Error creating interval ${data.fromDose} to ${data.toDose}:`, error);
          errors.push({ data, error });
        }
      }
      
      return { results, errors };
    },
    
    // Strategy 3: Create one by one with individual deletion before each
    async () => {
      console.log('Strategy 3: Creating intervals with individual deletion before each');
      const results = [];
      const errors = [];
      
      // Delete all intervals again before trying this strategy
      try {
        await deleteAllIntervalsForVaccine(vaccineId);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Error deleting intervals before strategy 3:', error);
      }
      
      for (const data of intervalDataArray) {
        try {
          // Check for existing intervals with the same dose range
          try {
            const intervals = await getIntervalsForVaccine(vaccineId);
            const existing = intervals.find(i => 
              i.fromDose === data.fromDose && i.toDose === data.toDose
            );
            
            if (existing) {
              console.log(`Found existing interval for doses ${data.fromDose} to ${data.toDose}, deleting it`);
              await deleteInterval(vaccineId, existing.id);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (checkError) {
            console.error('Error checking for existing intervals:', checkError);
          }
          
          // Create the interval
          await new Promise(resolve => setTimeout(resolve, 1000));
          const result = await createInterval(vaccineId, data);
          results.push(result);
          console.log(`Successfully created interval ${data.fromDose} to ${data.toDose}`);
        } catch (error) {
          console.error(`Error creating interval ${data.fromDose} to ${data.toDose}:`, error);
          errors.push({ data, error });
        }
      }
      
      return { results, errors };
    }
  ];
  
  // Try each strategy until one works or we run out of strategies
  let bestResult = { results: [], errors: intervalDataArray.map(data => ({ data, error: new Error('No strategy attempted') })) };
  
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = await strategies[i]();
      console.log(`Strategy ${i+1} results: ${result.results.length} successes, ${result.errors.length} errors`);
      
      // If this strategy was better than our previous best, update bestResult
      if (result.results.length > bestResult.results.length) {
        bestResult = result;
      }
      
      // If we created all intervals, we can stop
      if (result.results.length === intervalDataArray.length) {
        console.log(`Strategy ${i+1} successfully created all intervals`);
        return result.results;
      }
    } catch (strategyError) {
      console.error(`Error executing strategy ${i+1}:`, strategyError);
    }
  }
  
  // Return the best result we got
  if (bestResult.results.length > 0) {
    console.log(`Best strategy created ${bestResult.results.length}/${intervalDataArray.length} intervals`);
    return bestResult.results;
  }
  
  // If all strategies failed, throw an error
  throw new Error(`Failed to create intervals after trying multiple strategies`);
};

/**
 * Create multiple intervals at once for a vaccine using the batch endpoint
 * @param {number} vaccineId - The ID of the vaccine 
 * @param {Array} intervals - Array of interval data objects
 * @returns {Promise<Array>} - Array of created intervals
 */
export const createMultipleIntervals = async (vaccineId, intervals) => {
  try {
    console.log(`Creating ${intervals.length} intervals in batch for vaccine ${vaccineId}:`, intervals);
    const response = await axios.post(`${API_URL}/vaccines/${vaccineId}/intervals/batch`, intervals);
    return response.data;
  } catch (error) {
    console.error('Error details:', error.response?.data);
    throw new Error(`Error creating intervals: ${error.response?.data?.message || error.message}`);
  }
}; 