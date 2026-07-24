import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarTab.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarTab = ({ events = [], onEventClick }) => {
  // Use current date for initialization (e.g. July 2026 for demo or actual Date.now)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1));

  // Group dynamic events by date string (YYYY-MM-DD)
  const groupedEvents = React.useMemo(() => {
    const groups = {};
    events.forEach(e => {
      if (!e.scheduledFor) return;
      const d = new Date(e.scheduledFor);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push({
        id: e.meetingCode,
        title: e.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: `${e.participants?.length || 0} Participants`,
        raw: e
      });
    });
    return groups;
  }, [events]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Generate grid cells
  const cells = [];
  
  // Empty cells for days before the 1st of the month
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = groupedEvents[dateString] || [];
    
    // Check if it's today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = dateString === todayStr || dateString === '2026-07-19'; // Keep demo today fallback

    cells.push(
      <div key={`day-${day}`} className={`calendar-day-cell ${isToday ? 'today' : ''}`}>
        <div className="day-number">{day}</div>
        {dayEvents.map(event => (
          <div 
            key={event.id} 
            className="calendar-event"
            onClick={() => onEventClick && onEventClick({
              id: event.id,
              title: event.title,
              date: new Date(event.raw.scheduledFor).toLocaleDateString(),
              time: event.time,
              languageFlow: `${event.raw.translationSettings?.meetingLanguage || 'en-US'} → ${event.raw.translationSettings?.translationLanguage || 'hi-IN'}`,
              participants: event.description,
              translationStatus: event.raw.settings?.liveTranslation ? 'Translation Enabled' : 'Translation Disabled'
            })}
          >
            <div className="event-time">{event.time}</div>
            <div className="event-title">{event.title}</div>
            <div className="event-desc">{event.description}</div>
          </div>
        ))}
      </div>
    );
  }

  // Fill remaining cells to complete the grid (optional, but looks better)
  const totalCells = cells.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remainingCells; i++) {
    cells.push(<div key={`empty-end-${i}`} className="calendar-day-cell empty"></div>);
  }

  return (
    <div className="calendar-tab">
      <div className="calendar-header">
        <h2>{monthName} {year}</h2>
        <div className="calendar-nav">
          <button onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth}><ChevronRight size={20} /></button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {cells}
      </div>
    </div>
  );
};

export default CalendarTab;
