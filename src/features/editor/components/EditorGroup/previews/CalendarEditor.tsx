import React, { useRef, useMemo, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

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

    // Sync external content changes if they differ (e.g. reload or cloud sync)
    useEffect(() => {
        if (content && content !== lastSavedData.current) {
            try {
                const parsed = JSON.parse(content);
                setEvents(parsed.events || []);
                // If we wanted to sync view changes from disk, we'd do it here too, but view state is usually local session preference
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

    const handleEventAdd = (addInfo: any) => {
        const newEvent = {
            id: addInfo.event.id || Date.now().toString(),
            title: addInfo.event.title,
            start: addInfo.event.startStr,
            end: addInfo.event.endStr,
            allDay: addInfo.event.allDay
        };
        const newEvents = [...events, newEvent];
        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
    };

    const handleEventChange = (changeInfo: any) => {
        const newEvents = events.map(ev => {
            if (ev.id === changeInfo.event.id) {
                return {
                    ...ev,
                    title: changeInfo.event.title,
                    start: changeInfo.event.startStr,
                    end: changeInfo.event.endStr,
                    allDay: changeInfo.event.allDay
                };
            }
            return ev;
        });
        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
    };

    const handleEventRemove = (removeInfo: any) => {
        const newEvents = events.filter(ev => ev.id !== removeInfo.event.id);
        setEvents(newEvents);
        save(newEvents, calendarRef.current?.getApi().view.type || 'dayGridMonth');
    };

    // To handle simple clicking to add, we'd need a modal or quick-prompt.
    // For MVP, select adds a default "New Event" which user can click to rename?
    // Best practice: allow 'select' to trigger a creation flow.
    const handleDateSelect = (selectInfo: any) => {
        let title = prompt('Please enter a new title for your event');
        let calendarApi = selectInfo.view.calendar;

        calendarApi.unselect(); // clear date selection

        if (title) {
            calendarApi.addEvent({
                id: Date.now().toString(),
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            });
            // handleEventAdd will be called by the API hook? No, binding specific listeners is safer.
            // Actually, FullCalendar's addEvent triggers 'eventsSet' or individual hooks.
            // Let's use the individual hooks (eventAdd) which we bound below?
            // Wait, manual addEvent calls `eventAdd` callback? Yes.
        }
    };

    const handleViewDidMount = (mountInfo: any) => {
        // Apply theme classes or logic if needed
    };

    return (
        <div className={`h-full w-full bg-white dark:bg-slate-900 p-2 overflow-hidden calendar-wrapper ${theme === 'dark' ? 'fc-dark-mode' : ''}`}>
            <style>{`
                /* Minimal override for Typoly's aesthetic */
                :root {
                    --fc-border-color: #e2e8f0;
                    --fc-button-bg-color: #3b82f6;
                    --fc-button-border-color: #3b82f6;
                    --fc-button-hover-bg-color: #2563eb;
                    --fc-button-hover-border-color: #2563eb;
                    --fc-button-active-bg-color: #1d4ed8;
                    --fc-button-active-border-color: #1d4ed8;
                    --fc-today-bg-color: transparent;
                }
                .dark {
                    --fc-border-color: #1e293b;
                    --fc-page-bg-color: #0f172a;
                    --fc-neutral-bg-color: #1e293b;
                    --fc-list-event-hover-bg-color: #334155;
                }
                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; color: inherit; }
                .fc .fc-button { padding: 0.4rem 0.8rem; font-weight: 500; text-transform: capitalize; border-radius: 0.5rem; }
                .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: #1e40af; }

                /* Day cell header style */
                .fc-col-header-cell-cushion { padding: 8px; font-weight: 600; text-decoration: none !important; color: inherit; }
                .fc-daygrid-day-number { padding: 8px; font-weight: 500; text-decoration: none !important; color: inherit; }

                /* Today highlight */
                .fc-day-today { background-color: #eff6ff !important; }
                .dark .fc-day-today { background-color: #1e293b !important; }
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
                events={events} // We pass state here, so it updates visually
                select={handleDateSelect}
                eventClick={(clickInfo) => {
                    if (confirm(`Are you sure you want to delete '${clickInfo.event.title}'?`)) {
                        clickInfo.event.remove();
                    }
                }}
                eventAdd={handleEventAdd}
                eventChange={handleEventChange} // Handles resize/drop
                eventRemove={handleEventRemove}
                height="100%"
                viewDidMount={handleViewDidMount}
            />
        </div>
    );
};
