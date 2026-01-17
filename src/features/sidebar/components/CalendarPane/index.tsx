import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Maximize2, Minimize2, Plus, Calendar as CalendarIcon } from 'lucide-react';

// --- Types ---
interface CalendarEvent {
    id: string;
    title: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
}

const STORAGE_KEY = 'typoly_calendar_events';

const INITIAL_EVENTS: CalendarEvent[] = [
    { id: '1', title: 'Deep Work Session', start: new Date().toISOString().split('T')[0] + 'T09:00:00', end: new Date().toISOString().split('T')[0] + 'T11:00:00', backgroundColor: '#3b82f6' },
    { id: '2', title: 'Review Draft', start: new Date().toISOString().split('T')[0] + 'T14:00:00', backgroundColor: '#10b981' },
    { id: '3', title: 'Project Deadline', start: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], allDay: true, backgroundColor: '#ef4444' },
];

export const CalendarPane: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isZenMode, setIsZenMode] = useState(false);
    const calendarRef = useRef<FullCalendar>(null);
    const zenCalendarRef = useRef<FullCalendar>(null);

    // Load events
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setEvents(JSON.parse(saved));
            } catch (e) {
                setEvents(INITIAL_EVENTS);
            }
        } else {
            setEvents(INITIAL_EVENTS);
        }
    }, []);

    // Save events
    useEffect(() => {
        if (events.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
        }
    }, [events]);

    const handleDateClick = (arg: any) => {
        const title = prompt('Enter event title:');
        if (title) {
            const newEvent: CalendarEvent = {
                id: Date.now().toString(),
                title,
                start: arg.dateStr,
                allDay: arg.allDay,
                backgroundColor: '#3b82f6' // Default blue
            };
            setEvents([...events, newEvent]);
        }
    };

    const handleEventClick = (arg: any) => {
        if (confirm(`Delete event "${arg.event.title}"?`)) {
            setEvents(events.filter(e => e.id !== arg.event.id));
        }
    };



    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] relative">
            <style>{`
                /* FullCalendar Customization Overrides */
                .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-neutral-bg-color: rgba(0,0,0,0.05); }
                .dark .fc { --fc-border-color: #333; --fc-page-bg-color: #1e1e1e; --fc-neutral-bg-color: rgba(255,255,255,0.05); --fc-list-event-hover-bg-color: rgba(255,255,255,0.05); }
                .fc-theme-standard .fc-list-day-cushion { background-color: transparent !important; }
                .fc-list-event:hover td { background-color: rgba(0,0,0,0.02) !important; }
                .dark .fc-list-event:hover td { background-color: rgba(255,255,255,0.05) !important; }
                .fc-toolbar { display: none !important; } /* We use custom toolbar */
                .fc-col-header-cell-cushion { color: #64748b; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
                .dark .fc-col-header-cell-cushion { color: #94a3b8; }
                .fc-daygrid-day-number { color: #334155; font-size: 0.875rem; font-weight: 500; }
                .dark .fc-daygrid-day-number { color: #cbd5e1; }
                .fc-day-today { background-color: #f0f9ff !important; }
                .dark .fc-day-today { background-color: rgba(59, 130, 246, 0.1) !important; }
            `}</style>
            
            {/* --- Zen Mode (Full Calendar) --- */}
            {isZenMode && (
                <div className="fixed inset-0 z-50 bg-white dark:bg-[#1e1e1e] flex flex-col p-6 animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Workspace Calendar</h1>
                        </div>
                        <button 
                            onClick={() => setIsZenMode(false)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#333] hover:bg-slate-200 dark:hover:bg-[#444] transition-colors font-medium text-sm"
                        >
                            <Minimize2 className="w-4 h-4" /> Exit Focus
                        </button>
                    </div>

                    <div className="flex-1 bg-white dark:bg-[#1e1e1e] rounded-xl shadow-sm border border-slate-200 dark:border-[#333] p-4 overflow-hidden">
                        <FullCalendar
                            ref={zenCalendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                            events={events}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            editable={true}
                            selectable={true}
                            height="100%"
                            eventClassNames="cursor-pointer font-medium text-xs rounded shadow-sm border-0"
                        />
                    </div>
                </div>
            )}

            {/* --- Sidebar Mode (List View) --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Custom Toolbar */}
                <div className="shrink-0 p-4 border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">Today's Agenda</span>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handleDateClick({ dateStr: new Date().toISOString().split('T')[0] })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Add Event"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setIsZenMode(true)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#333] rounded transition-colors"
                            title="Open Full Calendar"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-2">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[listPlugin, interactionPlugin]}
                        initialView="listDay"
                        headerToolbar={false} // Use concise look
                        events={events}
                        eventClick={handleEventClick}
                        height="auto" // Allow scrolling by container
                        noEventsContent={() => (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50 gap-2">
                                <CalendarIcon className="w-10 h-10 text-slate-300" />
                                <span className="text-xs text-slate-400">No events today</span>
                            </div>
                        )}
                        eventContent={(arg) => (
                            <div className="flex flex-col py-1 min-w-0">
                                <div className="font-semibold truncate text-slate-700 dark:text-slate-200">{arg.event.title}</div>
                                {!arg.event.allDay && (
                                    <div className="text-[10px] text-slate-400">
                                        {arg.event.start?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        {arg.event.end && ` - ${arg.event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                    </div>
                                )}
                            </div>
                        )}
                        views={{
                            listDay: {
                                buttonText: 'list',
                                duration: { days: 3 } // Show next 3 days to fill space
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
