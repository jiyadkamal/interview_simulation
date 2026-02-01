import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { interviewAPI } from '../../services/api';
import './CalendarWidget.css';

export default function CalendarWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [allInterviews, setAllInterviews] = useState([]);

    useEffect(() => {
        // Fetch completed interview dates from history
        async function fetchInterviewDates() {
            try {
                const data = await interviewAPI.getHistory();
                if (data.interviews) {
                    // Store full interview data with dates
                    const interviews = data.interviews.map(i => ({
                        date: new Date(i.completedAt || i.startedAt),
                        category: i.category,
                        score: i.totalScore
                    }));
                    setAllInterviews(interviews);
                }
            } catch (error) {
                console.error('Failed to fetch interview history:', error);
                setAllInterviews([]);
            }
        }
        fetchInterviewDates();
    }, []);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const todayDate = new Date();
    const today = todayDate.getDate();
    const todayMonth = todayDate.getMonth();
    const todayYear = todayDate.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Get interviews for the current displayed month
    const getInterviewsForDay = (day) => {
        return allInterviews.filter(i => {
            return i.date.getDate() === day &&
                i.date.getMonth() === month &&
                i.date.getFullYear() === year;
        });
    };

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const renderDays = () => {
        const days = [];

        // Previous month days
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="calendar__day calendar__day--other">
                    {daysInPrevMonth - i}
                </div>
            );
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today && month === todayMonth && year === todayYear;
            const dayInterviews = getInterviewsForDay(day);
            const hasInterview = dayInterviews.length > 0;

            days.push(
                <div
                    key={day}
                    className={`calendar__day ${isToday ? 'calendar__day--today' : ''} ${hasInterview ? 'calendar__day--scheduled' : ''}`}
                    title={hasInterview ? `${dayInterviews.length} interview(s)` : ''}
                >
                    {day}
                    {hasInterview && <span className="calendar__day-dot"></span>}
                </div>
            );
        }

        // Next month days
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            days.push(
                <div key={`next-${day}`} className="calendar__day calendar__day--other">
                    {day}
                </div>
            );
        }

        return days;
    };

    return (
        <div className="calendar glass-card">
            <div className="calendar__header">
                <h3 className="calendar__title">Interview History</h3>
                <div className="calendar__nav">
                    <button onClick={prevMonth} className="calendar__nav-btn" type="button">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="calendar__month">{monthNames[month]} {year}</span>
                    <button onClick={nextMonth} className="calendar__nav-btn" type="button">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="calendar__weekdays">
                {dayNames.map(day => (
                    <div key={day} className="calendar__weekday">{day}</div>
                ))}
            </div>

            <div className="calendar__days">
                {renderDays()}
            </div>

            <div className="calendar__legend">
                <div className="calendar__legend-item">
                    <span className="calendar__legend-dot calendar__legend-dot--scheduled"></span>
                    <span>Completed Interview</span>
                </div>
            </div>
        </div>
    );
}
