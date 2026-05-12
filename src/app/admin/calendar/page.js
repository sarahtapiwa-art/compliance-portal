"use client";
import { useRouter } from "next/navigation";

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { apiClient } from '../../_utils/apiClient';

const localizer = momentLocalizer(moment);

const statusColors = {
    PENDING: '#f59e0b',
    UPLOADED: '#3b82f6',
    SUBMITTED: '#10b981',
    CLOSED: '#6b7280',
    OVERDUE: '#ef4444',
    UPLOADED_OVERDUE: '#f97316',
};

export default function CalendarPage() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/v1/calendar/events');
            const formatted = (Array.isArray(data) ? data : data?.content || []).map(event => ({
                id: event.id,
                title: event.title,
                start: new Date(event.start),
                end: new Date(event.end),
                status: event.status,
                department: event.department,
                regulatoryBody: event.regulatoryBody,
                frequency: event.frequency,
                periodStart: event.periodStart,
                periodEnd: event.periodEnd,
                color: statusColors[event.status] || '#6b7280',
            }));
            setEvents(formatted);
        } catch (err) {
            setError('Failed to load calendar events');
        } finally {
            setIsLoading(false);
        }
    };

    const eventStyleGetter = (event) => ({
        style: {
            backgroundColor: event.color,
            borderRadius: '4px',
            color: 'white',
            border: 'none',
            fontSize: '12px',
            padding: '2px 4px',
        }
    });

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Compliance Calendar</h1>
                    <p style={{ color: '#6b7280', marginTop: '4px' }}>View all submission due dates</p>
                </div>
                <button onClick={fetchEvents} style={{
                    backgroundColor: '#166534', color: 'white', padding: '8px 16px',
                    borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500'
                }}>
                    Refresh
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                {Object.entries(statusColors).map(([status, color]) => (
                    <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: color }}></div>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{status}</span>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading calendar...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error}</div>
            ) : (
                <div style={{ height: '600px', backgroundColor: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={setSelectedEvent}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="month"
                    />
                </div>
            )}

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                        width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>{selectedEvent.title}</h2>
                            <button onClick={() => setSelectedEvent(null)} style={{
                                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280'
                            }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Status</span>
                                <span style={{
                                    backgroundColor: selectedEvent.color, color: 'white',
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500'
                                }}>{selectedEvent.status}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Department</span>
                                <span style={{ fontWeight: '500' }}>{selectedEvent.department}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Regulatory Body</span>
                                <span style={{ fontWeight: '500' }}>{selectedEvent.regulatoryBody}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Frequency</span>
                                <span style={{ fontWeight: '500' }}>{selectedEvent.frequency}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Due Date</span>
                                <span style={{ fontWeight: '500' }}>{new Date(selectedEvent.start).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Period</span>
                                <span style={{ fontWeight: '500' }}>
                                    {new Date(selectedEvent.periodStart).toLocaleDateString()} - {new Date(selectedEvent.periodEnd).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedEvent(null)} style={{
                            marginTop: '20px', width: '100%', backgroundColor: '#166534',
                            color: 'white', padding: '10px', borderRadius: '6px',
                            border: 'none', cursor: 'pointer', fontWeight: '500'
                        }}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
