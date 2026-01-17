import React, { useEffect, useState } from 'react';
import { X, Trash2, Clock, AlignLeft } from 'lucide-react';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay?: boolean;
    description?: string;
    color?: string;
}

interface CalendarEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<CalendarEvent>) => void;
    onDelete: (id: string) => void;
    initialEvent: Partial<CalendarEvent> | null;
    mode: 'create' | 'edit';
}

const COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Gray', value: '#64748b' },
];

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialEvent,
    mode
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0].value);

    useEffect(() => {
        if (isOpen && initialEvent) {
            setTitle(initialEvent.title || '');
            setDescription(initialEvent.description || '');
            setColor(initialEvent.color || COLORS[0].value);
        } else {
            setTitle('');
            setDescription('');
            setColor(COLORS[0].value);
        }
    }, [isOpen, initialEvent]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...initialEvent,
            title,
            description,
            color
        });
        onClose();
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden animation-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        {mode === 'create' ? 'Add Event' : 'Edit Event'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title Input */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Event Title"
                            className="w-full text-xl font-medium bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-0 px-0 py-2 placeholder-slate-400 dark:text-white transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Time Info (Read-only for now) */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Clock size={16} />
                        <span>
                            {initialEvent?.start ? new Date(initialEvent.start).toLocaleString() : ''}
                            {initialEvent?.end ? ` - ${new Date(initialEvent.end).toLocaleString()}` : ''}
                        </span>
                    </div>

                    {/* Color Picker */}
                    <div className="flex gap-2">
                        {COLORS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setColor(c.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.value ? 'border-slate-400 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c.value }}
                                title={c.name}
                            />
                        ))}
                    </div>

                    {/* Description */}
                    <div className="flex gap-3">
                        <AlignLeft className="mt-1 text-slate-400 flex-shrink-0" size={18} />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add description..."
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm min-h-[80px] focus:outline-none focus:border-blue-500 dark:text-slate-200 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between pt-4 mt-2">
                        {mode === 'edit' && initialEvent?.id ? (
                            <button
                                type="button"
                                onClick={() => {
                                    if (initialEvent.id) onDelete(initialEvent.id);
                                    onClose();
                                }}
                                className="flex items-center text-red-500 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                            >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                            </button>
                        ) : <div></div>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim()}
                                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
