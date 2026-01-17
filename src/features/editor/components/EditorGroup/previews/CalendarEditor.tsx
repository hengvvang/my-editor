import React, { useRef, useMemo, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { CalendarEventModal } from './CalendarEventModal';

interface CalendarEditorProps {
    content: string; // JSON string
    onChange: (newContent: string) => void;
    theme?: 'light' | 'dark';
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
    description?: string;
    color?: string;
}

interface CalendarData {
    initialView: string;
    events: CalendarEvent[];
}

export const CalendarEditor: React.FC<CalendarEditorProps> = ({ content, onChange, theme = 'light' }) => {
    const calendarRef = useRef<FullCalendar>(null);
    const lastSavedData = useRef<string>(content);

    // Parse initial content safely
    const initialData: CalendarData = useMemo(() => {
        try {
            const parsed = JSON.parse(content || '{}');
            return {
                initialView: parsed.initialView || 'dayGridMonth',
                events: Array.isArray(parsed.events) ? parsed.events : []
            };
        } catch {
            return { initialView: 'dayGridMonth', events: [] };
        }
    }, []); // Only initial parse

    // Internal state to track events for instant feedback before saving
    const [events, setEvents] = useState<CalendarEvent[]>(initialData.events);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);

    // Sync external content changes if they differ (e.g. reload or cloud sync)
    useEffect(() => {
        if (content && content !== lastSavedData.current) {
            try {
                const parsed = JSON.parse(content);
                setEvents(parsed.events || []);
                lastSavedData.current = content;
            } catch (e) {
                console.error("Failed to sync external calendar content", e);
            }
        }
    }, [content]);

    // Save helper
    const save = (currentEvents: CalendarEvent[], currentView: string) => {
        const data = {
            initialView: currentView,
            events: currentEvents
        };
        const jsonString = JSON.stringify(data, null, 2);

        lastSavedData.current = jsonString;
        onChange(jsonString);
    };

    // Called when user drags/drops or resizes
    const handleEventChange = (changeInfo: any) => {
        const newEvents = events.map(ev => {
            if (ev.id === changeInfo.event.id) {
                return {
                    ...ev,
                    title: changeInfo.event.title,
                    start: changeInfo.event.startStr,
                    end: changeInfo.event.endStr,
                    allDay: changeInfo.event.allDay,
                    // Persist other props that FullCalendar doesn't automatically mutate
                    description: changeInfo.event.extendedProps.description,
                    color: changeInfo.event.backgroundColor
                };
            }
            return ev;
        });
        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
    };

    const handleEventRemove = (id: string) => {
        const newEvents = events.filter(ev => ev.id !== id);
        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
        const api = calendarRef.current?.getApi();
        const apiEvent = api?.getEventById(id);
        if (apiEvent) {
            apiEvent.remove();
        }
    };

    // User Selects a date range -> Open Create Modal
    const handleDateSelect = (selectInfo: any) => {
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // clear selection visual

        setSelectedEvent({
            start: selectInfo.startStr,
            end: selectInfo.endStr,
            allDay: selectInfo.allDay,
            title: '',
            description: '',
            color: '#3b82f6' // default blue
        });
        setModalMode('create');
        setIsModalOpen(true);
    };

    // User Clicks an event -> Open Edit Modal
    const handleEventClick = (clickInfo: any) => {
        const eventPlain = {
            id: clickInfo.event.id,
            title: clickInfo.event.title,
            start: clickInfo.event.startStr,
            end: clickInfo.event.endStr,
            allDay: clickInfo.event.allDay,
            description: clickInfo.event.extendedProps.description,
            color: clickInfo.event.backgroundColor
        };

        setSelectedEvent(eventPlain);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    // Modal Callback
    const handleModalSave = (eventData: Partial<CalendarEvent>) => {
        let newEvents = [...events];

        if (modalMode === 'create') {
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                title: eventData.title || 'Untitled',
                start: eventData.start || new Date().toISOString(),
                end: eventData.end,
                allDay: eventData.allDay,
                description: eventData.description,
                color: eventData.color
            };
            newEvents.push(newEvent);
        } else if (modalMode === 'edit' && eventData.id) {
            newEvents = newEvents.map(ev =>
                ev.id === eventData.id ? { ...ev, ...eventData } as CalendarEvent : ev
            );
        }

        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
    };



    return (
        <div className={`h-full w-full bg-white dark:bg-slate-900 p-2 overflow-hidden calendar-wrapper relative ${theme === 'dark' ? 'fc-dark-mode' : ''}`}>
            <style>{`
                /* Minimal override for Typoly's aesthetic */
                :root {
                    --fc-border-color: #e2e8f0;
                    --fc-button-bg-color: transparent;
                    --fc-button-border-color: #e2e8f0;
                    --fc-button-text-color: #64748b;
                    --fc-button-hover-bg-color: #f1f5f9;
                    --fc-button-hover-border-color: #cbd5e1;
                    --fc-button-active-bg-color: #e2e8f0;
                    --fc-button-active-border-color: #94a3b8;
                    --fc-today-bg-color: transparent;
                    --fc-event-border-color: transparent;
                }
                .dark {
                    --fc-border-color: #1e293b;
                    --fc-page-bg-color: #0f172a;
                    --fc-neutral-bg-color: #1e293b;
                    --fc-list-event-hover-bg-color: #334155;
                    --fc-button-border-color: #334155;
                    --fc-button-text-color: #94a3b8;
                    --fc-button-hover-bg-color: #1e293b;
                    --fc-button-hover-border-color: #475569;
                    --fc-button-active-bg-color: #334155;
                    --fc-button-active-border-color: #64748b;
                }

                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 600; color: inherit; }
                .fc .fc-button { padding: 0.4rem 0.8rem; font-weight: 500; text-transform: capitalize; border-radius: 0.5rem; transition: all 0.2s; }
                .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #3b82f6; border-color: #3b82f6; color: white; }
                .fc .fc-button-primary:not(:disabled):active { background-color: #2563eb; border-color: #2563eb; color: white; }

                /* Day cell header style */
                .fc-col-header-cell-cushion { padding: 8px; font-weight: 600; text-decoration: none !important; color: inherit; }
                .fc-daygrid-day-number { padding: 8px; font-weight: 500; text-decoration: none !important; color: inherit; }

                /* Today highlight */
                .fc-day-today { background-color: #eff6ff !important; }
                .dark .fc-day-today { background-color: #1e293b !important; }

                /* Event Styling */
                .fc-event { border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: none; }
                .fc-event-main { padding: 2px 4px; font-size: 0.85rem; font-weight: 500; }
            `}</style>

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                initialView={initialData.initialView}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventChange={handleEventChange} // Handles resize/drop
                height="100%"
            />

            <CalendarEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleModalSave}
                onDelete={handleEventRemove}
                initialEvent={selectedEvent}
                mode={modalMode}
            />
        </div>
    );
};
