import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Maximize2, Minimize2, Plus, Calendar as CalendarIcon, X, AlignLeft, Trash2, Check } from 'lucide-react';
import { addHours, isValid } from 'date-fns';

// --- Types ---
interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: string | Date;
    end?: string | Date;
    allDay?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: {
        description?: string;
    }
}

interface EventModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    initialData: Partial<CalendarEvent>;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete: (id: string) => void;
}

const STORAGE_KEY = 'typoly_calendar_events';
const COLORS = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#10b981', label: 'Green' },
    { value: '#ef4444', label: 'Red' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#a855f7', label: 'Purple' },
    { value: '#64748b', label: 'Gray' },
];

const INITIAL_EVENTS: CalendarEvent[] = [
    { id: '1', title: 'Deep Work Session', start: new Date().toISOString().split('T')[0] + 'T09:00:00', end: new Date().toISOString().split('T')[0] + 'T11:00:00', backgroundColor: '#3b82f6', extendedProps: { description: 'Focus time for coding.' } },
    { id: '2', title: 'Review Draft', start: new Date().toISOString().split('T')[0] + 'T14:00:00', backgroundColor: '#10b981' },
    { id: '3', title: 'Project Deadline', start: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], allDay: true, backgroundColor: '#ef4444' },
];

// --- Components ---

const EventModal: React.FC<EventModalProps> = ({ isOpen, mode, initialData, onClose, onSave, onDelete }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [color, setColor] = useState(COLORS[0].value);

    // Reset or Initialize state when modal opens
    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title || '');
            setDescription(initialData.description || initialData.extendedProps?.description || '');
            setColor(initialData.backgroundColor || COLORS[0].value);
            setAllDay(initialData.allDay || false);

            const formatDateForInput = (date: string | Date | undefined) => {
                if (!date) return '';
                const d = typeof date === 'string' ? new Date(date) : date;
                if (!isValid(d)) return '';
                const offset = d.getTimezoneOffset() * 60000;
                return new Date(d.getTime() - offset).toISOString().slice(0, 16);
            };

            setStart(formatDateForInput(initialData.start));
            setEnd(formatDateForInput(initialData.end));
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData.id || Date.now().toString(),
            title: title || '(No Title)',
            start: allDay ? start.split('T')[0] : new Date(start).toISOString(),
            end: end ? (allDay ? end.split('T')[0] : new Date(end).toISOString()) : undefined,
            allDay,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { description }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-[#333] overflow-hidden flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-[#333] flex items-center justify-between bg-slate-50/50 dark:bg-[#252525]">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            {mode === 'create' ? 'New Event' : 'Edit Event'}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Title</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#444] bg-white dark:bg-[#111] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Meeting title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Start</label>
                                <input
                                    type={allDay ? "date" : "datetime-local"}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#444] bg-white dark:bg-[#111] text-xs font-medium dark:text-slate-200"
                                    value={allDay ? start.split('T')[0] : start}
                                    onChange={e => setStart(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">End</label>
                                <input
                                    type={allDay ? "date" : "datetime-local"}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#444] bg-white dark:bg-[#111] text-xs font-medium dark:text-slate-200"
                                    value={allDay ? (end ? end.split('T')[0] : '') : end}
                                    onChange={e => setEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="allDay"
                                checked={allDay}
                                onChange={e => setAllDay(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="allDay" className="text-sm font-medium text-slate-700 dark:text-slate-300">All Day Event</label>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Color</label>
                            <div className="flex flex-wrap gap-3">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setColor(c.value)}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${color === c.value ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-[#1e1e1e]' : ''}`}
                                        style={{ backgroundColor: c.value }}
                                        title={c.label}
                                    >
                                        {color === c.value && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                <AlignLeft className="w-3 h-3" /> Description
                            </label>
                            <textarea
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#444] bg-white dark:bg-[#111] text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24 text-sm"
                                placeholder="Add notes..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 dark:border-[#333] flex items-center justify-between bg-slate-50/50 dark:bg-[#252525]">
                        {mode === 'edit' && initialData.id ? (
                            <button
                                type="button"
                                onClick={() => { onDelete(initialData.id!); onClose(); }}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow transition-all text-sm font-bold active:scale-95"
                            >
                                Save Event
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const CalendarPane: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isZenMode, setIsZenMode] = useState(false);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        data: Partial<CalendarEvent>;
    }>({ isOpen: false, mode: 'create', data: {} });

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
        const start = arg.date;
        const end = addHours(start, 1);
        setModalState({
            isOpen: true,
            mode: 'create',
            data: {
                start: arg.dateStr,
                end: arg.allDay ? undefined : end.toISOString(),
                allDay: arg.allDay,
                backgroundColor: '#3b82f6'
            }
        });
    };

    const handleEventClick = (arg: any) => {
        setModalState({
            isOpen: true,
            mode: 'edit',
            data: {
                id: arg.event.id,
                title: arg.event.title,
                start: arg.event.start,
                end: arg.event.end,
                allDay: arg.event.allDay,
                backgroundColor: arg.event.backgroundColor,
                description: arg.event.extendedProps.description
            }
        });
    };

    const handleEventDrop = (arg: any) => {
        const updatedEvents = events.map(e => {
            if (e.id === arg.event.id) {
                return {
                    ...e,
                    start: arg.event.startStr,
                    end: arg.event.endStr || undefined,
                    allDay: arg.event.allDay
                };
            }
            return e;
        });
        setEvents(updatedEvents);
    };

    const handleSaveEvent = (event: CalendarEvent) => {
        if (modalState.mode === 'create') {
            setEvents([...events, event]);
        } else {
            setEvents(events.map(e => e.id === event.id ? event : e));
        }
    };

    const handleDeleteEvent = (id: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            setEvents(events.filter(e => e.id !== id));
        }
    };



    return (
        <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] relative">
            <EventModal
                isOpen={modalState.isOpen} // Now modalState is defined
                mode={modalState.mode}
                initialData={modalState.data}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />
            <style>{`
                /* FullCalendar Customization Overrides */
                .fc { --fc-border-color: #e2e8f0; --fc-page-bg-color: transparent; --fc-neutral-bg-color: rgba(0,0,0,0.05); }
                .dark .fc { --fc-border-color: #333; --fc-page-bg-color: #1e1e1e; --fc-neutral-bg-color: rgba(255,255,255,0.05); --fc-list-event-hover-bg-color: rgba(255,255,255,0.05); }
                .fc-theme-standard .fc-list-day-cushion { background-color: transparent !important; }
                .fc-list-event:hover td { background-color: rgba(0,0,0,0.02) !important; }
                .dark .fc-list-event:hover td { background-color: rgba(255,255,255,0.05) !important; }

                /* Sidebar Specific Overrides for "Clean List" Look */
                .sidebar-calendar .fc-list-table { border-collapse: separate; border-spacing: 0 4px; }
                .sidebar-calendar .fc-list-table td { border: none !important; background: transparent !important; }
                .sidebar-calendar .fc-list-day-cushion { background: transparent !important; padding: 16px 8px 8px 4px !important; }
                .sidebar-calendar .fc-list-day-text { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; }
                .sidebar-calendar .fc-list-day-side-text { display: none; }
                .sidebar-calendar .fc-list-event-graphic { display: none !important; }
                .sidebar-calendar .fc-list-event-time { display: none !important; }
                .sidebar-calendar .fc-list-event { cursor: default; }
                .sidebar-calendar .fc-list-event:hover td { background: transparent !important; }
                .sidebar-calendar .fc-toolbar { display: none !important; }

                .fc-col-header-cell-cushion { color: #64748b; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
                .dark .fc-col-header-cell-cushion { color: #94a3b8; }
                .fc-daygrid-day-number { color: #334155; font-size: 0.875rem; font-weight: 500; }
                .dark .fc-daygrid-day-number { color: #cbd5e1; }
                .fc-day-today { background-color: #f0f9ff !important; }
                .dark .fc-day-today { background-color: rgba(59, 130, 246, 0.1) !important; }

                /* --- Unified Button Styles (Next, Prev, Month, Week) --- */
                .fc .fc-button {
                    background-color: white !important;
                    border: 1px solid #e2e8f0 !important;
                    color: #475569 !important;
                    text-transform: capitalize;
                    font-weight: 600;
                    padding: 0 1rem !important;
                    height: 2.25rem !important;
                    min-width: 2.25rem !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 0.875rem !important;
                    line-height: 1 !important;
                    box-shadow: none !important;
                    outline: none !important;
                    transition: all 0.2s;
                    margin: 0 !important;
                }
                .dark .fc .fc-button {
                    background-color: #1e1e1e !important;
                    border-color: #333 !important;
                    color: #94a3b8 !important;
                }

                /* Fix Grouping: Attached Borders */
                .fc .fc-button-group > .fc-button {
                    border-radius: 0 !important;
                }
                .fc .fc-button-group > .fc-button:not(:first-child) {
                    margin-left: -1px !important;
                }
                .fc .fc-button-group > .fc-button:first-child {
                    border-top-left-radius: 0.5rem !important;
                    border-bottom-left-radius: 0.5rem !important;
                }
                .fc .fc-button-group > .fc-button:last-child {
                    border-top-right-radius: 0.5rem !important;
                    border-bottom-right-radius: 0.5rem !important;
                }

                /* Icon Buttons (Prev/Next) - Explicit Size */
                .fc .fc-prev-button, .fc .fc-next-button {
                    width: 2.25rem !important;
                    padding: 0 !important;
                }
                .fc .fc-icon {
                    font-size: 1.25em !important;
                    vertical-align: middle;
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    height: 100%;
                }

                /* Hover & Active States */
                .fc .fc-button:hover {
                    background-color: #f8fafc !important;
                    color: #1e293b !important;
                    border-color: #cbd5e1 !important;
                    z-index: 5;
                }
                .dark .fc .fc-button:hover {
                    background-color: #262626 !important;
                    color: #e5e5e5 !important;
                    border-color: #525252 !important;
                }
                .fc .fc-button-primary:not(:disabled).fc-button-active,
                .fc .fc-button-primary:not(:disabled):active {
                    background-color: #eff6ff !important;
                    border-color: #3b82f6 !important;
                    color: #2563eb !important;
                    box-shadow: none;
                    z-index: 6;
                }
                .dark .fc .fc-button-primary:not(:disabled).fc-button-active,
                .dark .fc .fc-button-primary:not(:disabled):active {
                    background-color: rgba(59, 130, 246, 0.15) !important;
                    border-color: #3b82f6 !important;
                    color: #60a5fa !important;
                }
                .fc .fc-button:focus,
                .fc .fc-button-primary:focus {
                    box-shadow: none !important;
                }

                /* Header Spacing */
                .fc-header-toolbar {
                    gap: 1rem;
                    margin-bottom: 1.5rem !important;
                    display: flex;
                    align-items: center;
                }
                .fc-toolbar-title {
                    font-size: 1.5rem !important;
                    font-weight: 800 !important;
                    line-height: 1.2;
                }
            `}</style>

            {/* --- Zen Mode (Full Calendar) --- */}
            {isZenMode && (
                <div className="fixed inset-0 z-50 bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-sm flex flex-col p-8 animate-in fade-in zoom-in duration-300">
                    <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-6">
                        {/* Zen Mode Header with Primary Actions */}
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Schedule</h1>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage your workspace timeline</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleDateClick({ dateStr: new Date().toISOString().split('T')[0], date: new Date(), allDay: true })}
                                    className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all font-semibold text-sm flex items-center gap-2 active:scale-95"
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2.5} /> <span className="hidden sm:inline">New Event</span>
                                </button>
                                <div className="w-[1px] h-8 bg-slate-200 dark:bg-[#333] mx-1" />
                                <button
                                    onClick={() => setIsZenMode(false)}
                                    className="h-10 px-4 rounded-lg bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-600 dark:text-slate-300 transition-all font-semibold text-sm shadow-sm hover:shadow flex items-center gap-2"
                                >
                                    <Minimize2 className="w-4 h-4" /> <span>Exit Focus</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-slate-200 dark:border-[#333] p-6 overflow-hidden relative">
                            <FullCalendar
                                ref={zenCalendarRef}
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek,listWeek'
                                }}
                                events={events}
                                dateClick={handleDateClick}
                                eventClick={handleEventClick}
                                eventDrop={handleEventDrop}
                                eventResize={handleEventDrop}
                                editable={true}
                                selectable={true}
                                droppable={true}
                                height="100%"
                                eventClassNames="cursor-pointer font-medium text-xs rounded-md shadow-sm border-0 my-0.5 px-1 py-0.5 transition-transform hover:scale-[1.02]"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- Sidebar Mode (List View) --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Custom Toolbar - Optimized for spacing and touch targets */}
                <div className="shrink-0 p-3 border-b border-gray-100 dark:border-[#333] flex items-center justify-between bg-white/50 dark:bg-[#1e1e1e]/50 backdrop-blur-sm sticky top-0 z-10">
                    <span className="text-xs font-extra-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-1">Agenda</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleDateClick({ dateStr: new Date().toISOString().split('T')[0], date: new Date(), allDay: true })}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#333] hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                            title="Add Event"
                        >
                            <Plus className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => setIsZenMode(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#333] hover:text-purple-600 dark:hover:text-purple-400 transition-all active:scale-95"
                            title="Enter Focus Mode"
                        >
                            <Maximize2 className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-2 sidebar-calendar">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[listPlugin, interactionPlugin]}
                        initialView="listMonth"
                        headerToolbar={false} // Use concise look
                        events={events}
                        eventClick={handleEventClick}
                        height="auto" // Allow scrolling by container
                        noEventsContent={() => (
                            <div className="flex flex-col items-center justify-center py-10 opacity-50 gap-2">
                                <CalendarIcon className="w-10 h-10 text-slate-300" />
                                <span className="text-xs text-slate-400">No events this month</span>
                            </div>
                        )}
                        eventContent={(arg) => (
                            <div className="flex items-center gap-3 py-2 px-2 min-w-0 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                                <div
                                    className="w-1 h-8 rounded-full shrink-0 shadow-sm"
                                    style={{ backgroundColor: arg.event.backgroundColor }}
                                />
                                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                    <div className="font-semibold truncate text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {arg.event.title}
                                    </div>
                                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                                        {!arg.event.allDay ? (
                                            <>
                                                <span className="tracking-tight">{arg.event.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {arg.event.end && <span className="opacity-50">-</span>}
                                                {arg.event.end && <span className="tracking-tight">{arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                            </>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">All Day</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};
