import React from 'react';
import { Calendar } from 'lucide-react';

interface CalendarPaneProps {
    onOpenCalendar?: () => void;
}

export const CalendarPane: React.FC<CalendarPaneProps> = ({ onOpenCalendar }) => {
    return (
        <div className="flex-1 flex flex-col overflow-auto bg-slate-50">
            <div className="p-3 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex flex-col gap-3">
                <button
                    onClick={onOpenCalendar}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700"
                >
                    <Calendar size={18} />
                    Open Calendar
                </button>
            </div>

            <div className="p-4 text-slate-500 text-sm text-center">
                Manage your schedule, tasks, and deadlines.
            </div>
        </div>
    );
};
