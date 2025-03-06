import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner, Table, InputGroup } from 'react-bootstrap';
import { 
  createInterval, 
  getIntervalsForVaccine, 
  deleteInterval, 
  deleteAllIntervalsForVaccine,
  createMultipleIntervals
} from '../services/doseIntervalService';

const DoseIntervalForm = ({ vaccine, onClose }) => {
  const [intervals, setIntervals] = useState([]);
  const [totalDoses, setTotalDoses] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [warning, setWarning] = useState(null);
  const [intervalUnits, setIntervalUnits] = useState({});

  // Extract total doses from vaccine dosage when vaccine changes
  useEffect(() => {
    if (vaccine) {
      console.log(`Vaccine changed, ID: ${vaccine.id}, Name: ${vaccine.name}`);
      
      // Extract total doses from dosage (e.g., "3 dose(s)")
      const dosageMatch = vaccine.dosage?.match(/(\d+)/);
      const extractedDoses = dosageMatch ? parseInt(dosageMatch[1]) : 1;
      console.log(`Extracted total doses: ${extractedDoses} from dosage: ${vaccine.dosage}`);
      
      setTotalDoses(extractedDoses);
      fetchIntervals();
    }
  }, [vaccine]);

  // Fetch intervals for the current vaccine
  const fetchIntervals = async () => {
    if (!vaccine?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching intervals for vaccine ID: ${vaccine.id}`);
      
      const data = await getIntervalsForVaccine(vaccine.id);
      console.log(`Fetched ${data.length} intervals:`, data);
      
      // Sort intervals by fromDose
      const sortedIntervals = [...data].sort((a, b) => a.fromDose - b.fromDose);
      
      // Create placeholder intervals for any missing ones
      const placeholders = [];
      if (totalDoses > 1) {
        for (let fromDose = 1; fromDose < totalDoses; fromDose++) {
          const toDose = fromDose + 1;
          const exists = sortedIntervals.some(i => i.fromDose === fromDose && i.toDose === toDose);
          
          if (!exists) {
            placeholders.push({
              id: `placeholder-${fromDose}-${toDose}`,
              vaccineId: vaccine.id,
              fromDose,
              toDose,
              intervalDays: 0,
              isPlaceholder: true
            });
          }
        }
      }
      
      // Combine real and placeholder intervals
      const combinedIntervals = [...sortedIntervals, ...placeholders].sort((a, b) => a.fromDose - b.fromDose);
      console.log('Combined intervals:', combinedIntervals);
      setIntervals(combinedIntervals);
      
      if (placeholders.length > 0) {
        setWarning(`Some intervals were not found in the database. Default values have been provided.`);
      } else {
        setWarning(null);
      }
    } catch (error) {
      console.error('Error fetching intervals:', error);
      setError(`Failed to fetch intervals: ${error.message}`);
      
      // Create empty placeholders if fetch fails
      if (totalDoses > 1) {
        const emptyIntervals = [];
        for (let fromDose = 1; fromDose < totalDoses; fromDose++) {
          emptyIntervals.push({
            id: `placeholder-${fromDose}-${toDose}`,
            vaccineId: vaccine.id,
            fromDose,
            toDose: fromDose + 1,
            intervalDays: 0,
            isPlaceholder: true
          });
        }
        setIntervals(emptyIntervals);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle changes to total doses
  const handleTotalDosesChange = (e) => {
    const newValue = e.target.value === '' ? '' : parseInt(e.target.value);
    setTotalDoses(newValue);
    updateIntervalsForTotalDoses(newValue);
  };
  
  // Update intervals array based on total doses
  const updateIntervalsForTotalDoses = (newTotalDoses) => {
    // If newTotalDoses is empty or less than 1, set a default value
    const validDoses = (newTotalDoses === '' || newTotalDoses < 1) ? 1 : newTotalDoses;
    
    console.log(`Updating intervals for ${validDoses} total doses`);
    
    // Make a copy of the current intervals
    const updatedIntervals = [...intervals];
    
    // If there's only one dose, no intervals are needed
    if (validDoses <= 1) {
      // Filter out any non-placeholder intervals and keep only placeholders
      setIntervals(updatedIntervals.filter(i => i.isPlaceholder));
      return;
    }
    
    // For multiple doses, create placeholders for any missing intervals
    const placeholders = [];
    for (let fromDose = 1; fromDose < validDoses; fromDose++) {
      const toDose = fromDose + 1;
      
      // Check if this interval already exists
      const exists = updatedIntervals.some(i => i.fromDose === fromDose && i.toDose === toDose);
      
      if (!exists) {
        // Create a placeholder interval
        placeholders.push({
          id: `placeholder-${fromDose}-${toDose}`,
          vaccineId: vaccine.id,
          fromDose,
          toDose,
          intervalDays: 0,
          isPlaceholder: true
        });
      }
    }
    
    // Remove intervals that are no longer needed
    const filteredIntervals = updatedIntervals.filter(i => 
      i.fromDose < validDoses && i.toDose <= validDoses
    );
    
    // Combine and sort
    const combinedIntervals = [...filteredIntervals, ...placeholders].sort(
      (a, b) => a.fromDose - b.fromDose
    );
    
    console.log('Updated intervals:', combinedIntervals);
    setIntervals(combinedIntervals);
  };

  // Handle interval unit change (days/months)
  const handleIntervalUnitChange = (fromDose, unit) => {
    const updatedUnits = { ...intervalUnits };
    updatedUnits[fromDose] = unit;
    setIntervalUnits(updatedUnits);
    
    // Find the current interval
    const currentInterval = intervals.find(i => i.fromDose === fromDose);
    if (currentInterval) {
      let newValue = currentInterval.intervalDays;
      
      // If changing from days to months, divide by 30
      if (unit === 'months' && intervalUnits[fromDose] === 'days') {
        newValue = Math.round(newValue / 30);
      }
      // If changing from months to days, multiply by 30
      else if (unit === 'days' && intervalUnits[fromDose] === 'months') {
        newValue = newValue * 30;
      }
      
      // Update the interval with the converted value
      handleIntervalChange(fromDose - 1, 'intervalDays', newValue);
    }
  };

  // Update the handleIntervalChange function to handle unit conversions
  const handleIntervalChange = (index, field, value) => {
    if (value < 0) value = 0;
    
    // Create a deep copy of the intervals array
    const updatedIntervals = [...intervals];
    
    // Find the interval with the matching fromDose and toDose
    const fromDose = index + 1;
    const toDose = index + 2;
    
    // Get the current unit (days or months)
    const unit = intervalUnits[fromDose] || 'days';
    
    // If unit is months, convert to days for storage
    const convertedValue = unit === 'months' ? value * 30 : value;
    
    // Find the existing interval or create a new one
    let intervalIndex = updatedIntervals.findIndex(
      interval => interval.fromDose === fromDose && interval.toDose === toDose
    );
    
    if (intervalIndex === -1) {
      // If interval doesn't exist, create a new one
      updatedIntervals.push({
        id: `new-${fromDose}-${toDose}`,
        vaccineId: vaccine.id,
        fromDose,
        toDose,
        intervalDays: convertedValue
      });
    } else {
      // If interval exists, update it
      updatedIntervals[intervalIndex] = {
        ...updatedIntervals[intervalIndex],
        [field]: convertedValue
      };
    }
    
    // Sort by fromDose
    updatedIntervals.sort((a, b) => a.fromDose - b.fromDose);
    setIntervals(updatedIntervals);
  };

  // Submit the form to save intervals
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate that totalDoses is not empty
      if (totalDoses === '' || isNaN(totalDoses)) {
        throw new Error("Please enter a valid number for Total Doses");
      }
      
      // Ensure totalDoses is at least 1
      const validTotalDoses = Math.max(1, totalDoses);
      
      // If there's only one dose, no intervals are needed
      if (validTotalDoses <= 1) {
        setSuccess("No intervals needed for a single dose vaccine.");
        setLoading(false);
        return;
      }
      
      // Validate that all interval days are set
      const missingIntervals = intervals.filter(interval => 
        !interval.isPlaceholder && 
        (interval.intervalDays === undefined || interval.intervalDays === null || interval.intervalDays === '')
      );
      
      if (missingIntervals.length > 0) {
        const missingDetails = missingIntervals.map(i => `Dose ${i.fromDose} to ${i.toDose}`).join(', ');
        throw new Error(`Please set interval days for all dose transitions: ${missingDetails}`);
      }
      
      // Step 1: Delete all existing intervals
      console.log("Deleting all existing intervals...");
      await deleteAllIntervalsForVaccine(vaccine.id);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for deletion to complete
      
      // Step 2: Create intervals using the batch endpoint
      console.log("Creating intervals using batch endpoint...");
      
      // Sort intervals by fromDose (ascending order) and filter out placeholders
      const sortedIntervals = [...intervals]
        .filter(interval => !interval.isPlaceholder)
        .sort((a, b) => a.fromDose - b.fromDose);
      
      // Prepare interval data for the batch request
      const intervalRequests = sortedIntervals.map(interval => ({
        fromDose: interval.fromDose,
        toDose: interval.toDose,
        intervalDays: interval.intervalDays
      }));
      
      if (intervalRequests.length === 0) {
        setSuccess("No intervals to save.");
        setLoading(false);
        return;
      }
      
      // Send the batch request
      const results = await createMultipleIntervals(vaccine.id, intervalRequests);
      console.log(`Created ${results.length} intervals using batch endpoint`);
      
      setSuccess(`Successfully saved all ${results.length} intervals.`);
      
      // Refresh intervals after saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchIntervals();
      
    } catch (error) {
      console.error("Error saving intervals:", error);
      setError(error.message || "An error occurred while saving intervals.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a single interval
  const handleDeleteInterval = async (intervalId) => {
    if (!intervalId || intervalId.toString().includes('placeholder')) {
      return; // Don't try to delete placeholders
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await deleteInterval(vaccine.id, intervalId);
      setSuccess(`Interval deleted successfully.`);
      
      // Refresh intervals after deletion
      await fetchIntervals();
    } catch (error) {
      console.error("Error deleting interval:", error);
      setError(`Failed to delete interval: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Refresh intervals manually
  const refreshIntervals = async () => {
    await fetchIntervals();
  };

  // Generate interval form fields based on total doses
  const renderIntervalFields = () => {
    if (totalDoses <= 1) {
      return (
        <Alert variant="info">
          No intervals needed for a single dose vaccine.
        </Alert>
      );
    }

    const fields = [];
    for (let fromDose = 1; fromDose < totalDoses; fromDose++) {
      const toDose = fromDose + 1;
      
      // Find the current value for this interval
      const currentInterval = intervals.find(i => i.fromDose === fromDose && i.toDose === toDose);
      let currentValue = currentInterval ? currentInterval.intervalDays : '';
      
      // Get or set default unit
      const unit = intervalUnits[fromDose] || 'days';
      if (!intervalUnits[fromDose]) {
        setIntervalUnits(prev => ({ ...prev, [fromDose]: 'days' }));
      }
      
      // Convert value for display if unit is months
      if (unit === 'months' && currentValue) {
        currentValue = Math.round(currentValue / 30);
      }
      
      // Create a unique key for this interval field
      const intervalKey = `interval-${fromDose}-${toDose}`;
      
      fields.push(
        <Form.Group className="mb-3" key={intervalKey}>
          <Form.Label>{`Interval from Dose ${fromDose} to Dose ${toDose}`}</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min="0"
              value={currentValue}
              onChange={(e) => handleIntervalChange(fromDose - 1, 'intervalDays', parseInt(e.target.value) || 0)}
              disabled={loading}
              required
              aria-label={`Interval between dose ${fromDose} and dose ${toDose}`}
            />
            <Form.Select
              value={unit}
              onChange={(e) => handleIntervalUnitChange(fromDose, e.target.value)}
              disabled={loading}
              aria-label="Unit for interval"
            >
              <option value="days">Days</option>
              <option value="months">Months</option>
            </Form.Select>
          </InputGroup>
          <Form.Text className="text-muted">
            Time between dose {fromDose} and dose {toDose}
          </Form.Text>
        </Form.Group>
      );
    }
    
    return fields;
  };

  // Show existing intervals in a table (without the Actions column)
  const renderExistingIntervals = () => {
    const realIntervals = intervals.filter(i => !i.isPlaceholder);
    
    if (realIntervals.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h5>Existing Intervals</h5>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>From Dose</th>
              <th>To Dose</th>
              <th>Interval Days</th>
            </tr>
          </thead>
          <tbody>
            {realIntervals.map(interval => (
              <tr key={`existing-${interval.id}`}>
                <td>{interval.fromDose}</td>
                <td>{interval.toDose}</td>
                <td>{interval.intervalDays}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <h3>Manage Dose Intervals for {vaccine?.name}</h3>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {warning && <Alert variant="warning">{warning}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Total Doses</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={totalDoses}
            onChange={handleTotalDosesChange}
            disabled={loading}
            placeholder="Enter number of doses"
          />
        </Form.Group>
        
        {renderIntervalFields()}
        
        <div className="d-flex justify-content-between mt-4">
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Saving...</span>
              </>
            ) : (
              'Save Intervals'
            )}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </div>
      </Form>
      
      {renderExistingIntervals()}
    </div>
  );
};

export default DoseIntervalForm; 