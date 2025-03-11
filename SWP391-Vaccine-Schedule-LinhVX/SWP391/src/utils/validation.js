import { validationRules } from '../services/scheduleService';

const validateField = (value, rules) => {
    if (!rules) return null;

    if (rules.required && !value) {
        return 'This field is required';
    }

    if (value) {
        if (rules.minLength && value.length < rules.minLength) {
            return `Must be at least ${rules.minLength} characters`;
        }

        if (rules.maxLength && value.length > rules.maxLength) {
            return `Must not exceed ${rules.maxLength} characters`;
        }

        if (rules.format === 'HH:mm') {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
                return 'Invalid time format (HH:mm)';
            }
        }
    }

    return null;
};

const validateShift = (data) => {
    const errors = {};
    const rules = validationRules.shift;

    errors.name = validateField(data.name, rules.name);
    errors.startTime = validateField(data.startTime, rules.time);
    errors.endTime = validateField(data.endTime, rules.time);

    if (!errors.startTime && !errors.endTime) {
        const start = new Date(`2000-01-01T${data.startTime}`);
        const end = new Date(`2000-01-01T${data.endTime}`);
        if (end <= start) {
            errors.endTime = 'End time must be after start time';
        }
    }

    return removeNulls(errors);
};

const validateSchedule = (data) => {
    const errors = {};
    const rules = validationRules.schedule;

    errors.employeeId = validateField(data.employeeId, rules.employeeId);

    if (!data.weeklySchedules || data.weeklySchedules.length === 0) {
        errors.weeklySchedules = 'At least one weekly schedule is required';
    } else {
        const scheduleErrors = data.weeklySchedules.map(week => {
            const weekErrors = {};
            if (!week.dailySchedules || week.dailySchedules.length === 0) {
                weekErrors.dailySchedules = 'At least one daily schedule is required';
            } else {
                const dailyErrors = week.dailySchedules.map(day => {
                    const dayErrors = {};
                    if (!day.dayOfWeek) dayErrors.dayOfWeek = 'Day is required';
                    if (!day.shiftId) dayErrors.shiftId = 'Shift is required';
                    return removeNulls(dayErrors);
                });
                if (dailyErrors.some(e => Object.keys(e).length > 0)) {
                    weekErrors.dailySchedules = dailyErrors;
                }
            }
            return removeNulls(weekErrors);
        });
        if (scheduleErrors.some(e => Object.keys(e).length > 0)) {
            errors.weeklySchedules = scheduleErrors;
        }
    }

    return removeNulls(errors);
};

const validateShiftChangeRequest = (data, schedule) => {
    const errors = {};
    const rules = validationRules.shiftChangeRequest;

    errors.reason = validateField(data.reason, rules.reason);

    if (schedule) {
        const scheduleDate = new Date(schedule.workDate);
        const today = new Date();
        const diffDays = Math.ceil((scheduleDate - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < rules.minDaysInAdvance) {
            errors.schedule = `Request must be made at least ${rules.minDaysInAdvance} days in advance`;
        }
    }

    return removeNulls(errors);
};

const removeNulls = (obj) => {
    const result = {};
    for (const key in obj) {
        if (obj[key] !== null) {
            result[key] = obj[key];
        }
    }
    return result;
};

export {
    validateShift,
    validateSchedule,
    validateShiftChangeRequest
}; 