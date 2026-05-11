import React from 'react';
import { formatDateKey, getDaysInMonth } from '../../utils/calendar';
import { getHoliday } from '../../utils/holidays';

interface Note {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    content: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

interface NotesMonthViewProps {
    currentDate: Date;
    notes: Note[];
    onDayClick: (date: string) => void;
    onNoteClick: (note: Note) => void;
    country: string;
}

export const NotesMonthView: React.FC<NotesMonthViewProps> = ({
    currentDate,
    notes,
    onDayClick,
    onNoteClick,
    country
}) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...

    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            <div className="grid grid-cols-7 border-b text-center py-2 bg-orange-50 font-bold text-orange-700 text-xs uppercase sticky top-0 z-10">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 auto-rows-min min-h-0">
                {blankDays.map(d => <div key={`blank-${d}`} className="border-b border-r bg-slate-50/50" />)}
                {days.map(d => {
                    const dateObj = new Date(year, month, d);
                    const dateKey = formatDateKey(dateObj);

                    // Filter notes for this day
                    const dayNotes = notes.filter(n => n.date === dateKey);

                    const isToday = dateKey === formatDateKey(new Date());
                    const holiday = getHoliday(dateKey, country);

                    return (
                        <div key={d}
                            className={`border-b border-r p-1 flex flex-col ${isToday ? 'bg-orange-50/30' : (holiday ? 'bg-red-50/50' : 'bg-white')} min-h-[120px] transition-colors hover:bg-orange-50/20 cursor-pointer`}
                            onClick={() => onDayClick(dateKey)}
                        >
                            <div className={`text-right text-xs font-bold mb-1 flex justify-between items-center ${isToday ? 'text-orange-600' : 'text-slate-400'}`}>
                                {holiday && <span className="text-[10px] text-red-500 uppercase truncate max-w-[80px] leading-none" title={holiday}>{holiday}</span>}
                                <span>{d}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {dayNotes.map(note => (
                                    <div key={note.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNoteClick(note);
                                        }}
                                        className="text-[10px] px-2 py-1 rounded border-l-2 border-orange-500 bg-orange-100 text-orange-900 truncate cursor-pointer hover:bg-orange-200 transition-colors"
                                        title={`${note.title}\n${note.content}`}
                                    >
                                        <div className="font-bold truncate">{note.title}</div>
                                        {note.content && (
                                            <div className="text-orange-700 truncate mt-0.5">{note.content}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
