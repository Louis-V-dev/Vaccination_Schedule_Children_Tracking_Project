import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

const ScheduleCalendar = ({ 
    schedules, 
    onEventClick, 
    isAdmin = false, 
    onDateSelect,
    height = '700px'
}) => {
    const events = schedules.map(schedule => ({
        id: schedule.id,
        title: `${schedule.shift.name} ${schedule.employee ? `- ${schedule.employee.fullName}` : ''}`,
        start: `${schedule.workDate}T${schedule.shift.startTime}`,
        end: `${schedule.workDate}T${schedule.shift.endTime}`,
        backgroundColor: getEventColor(schedule),
        extendedProps: {
            schedule: schedule
        }
    }));

    const handleEventClick = (info) => {
        if (onEventClick) {
            onEventClick(info.event.extendedProps.schedule);
        }
    };

    const handleDateSelect = (selectInfo) => {
        if (isAdmin && onDateSelect) {
            onDateSelect(selectInfo);
        }
    };

    const handleEventRender = (info) => {
        const schedule = info.event.extendedProps.schedule;
        
        // Add employee badges for admin view
        if (isAdmin && schedule.employee) {
            const employeeEl = document.createElement('div');
            employeeEl.className = 'fc-event-employee';
            employeeEl.innerHTML = `<small>${schedule.employee.fullName}</small>`;
            info.el.appendChild(employeeEl);
        }

        // Add shift time
        const timeEl = document.createElement('div');
        timeEl.className = 'fc-event-time';
        timeEl.innerHTML = `<small>${formatTime(schedule.shift.startTime)} - ${formatTime(schedule.shift.endTime)}</small>`;
        info.el.appendChild(timeEl);
    };

    const getEventColor = (schedule) => {
        // Color coding based on shift or status
        if (schedule.isPatternGenerated) return '#6c757d'; // Gray for pattern-generated schedules
        if (!schedule.shift.status) return '#dc3545'; // Red for inactive shifts
        return '#0d6efd'; // Blue for active shifts
    };

    const formatTime = (time) => {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <Card>
            <Card.Body>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={events}
                    eventClick={handleEventClick}
                    selectable={isAdmin}
                    select={handleDateSelect}
                    eventContent={handleEventRender}
                    height={height}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    slotDuration="00:30:00"
                    weekends={true}
                    businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
                        startTime: '07:00',
                        endTime: '21:00',
                    }}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false,
                        hour12: false
                    }}
                />
            </Card.Body>
        </Card>
    );
};

export default ScheduleCalendar; 