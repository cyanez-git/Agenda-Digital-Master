import React from 'react';
import { AppConfig, Appointment } from '../../types';
import { formatDateKey, getDaysInMonth, COLOR_PALETTES } from '../../utils/calendar';
import { getHoliday } from '../../utils/holidays';

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[]; // Filtered
    config: AppConfig;
    onDayClick: (date: string) => void;
    onAppointmentClick: (appt: Appointment) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
    currentDate,
    appointments,
    config,
    onDayClick,
    onAppointmentClick
}) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...

    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="h-full flex flex-col bg-white overflow-y-auto">
            <div className="grid grid-cols-7 border-b text-center py-2 bg-slate-50 font-bold text-slate-500 text-xs uppercase sticky top-0 z-10">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 auto-rows-min min-h-0">
                {blankDays.map(d => <div key={`blank-${d}`} className="border-b border-r bg-slate-50/50" />)}
                {days.map(d => {
                    const dateObj = new Date(year, month, d);
                    const dateKey = formatDateKey(dateObj);

                    // Filter AND Sort appointments
                    const dayAppts = appointments
                        .filter(a => a.date === dateKey)
                        .sort((a, b) => a.time.localeCompare(b.time));

                    const isToday = dateKey === formatDateKey(new Date());
                    const holiday = getHoliday(dateKey, config.country);

                    return (
                        <div key={d}
                            className={`border-b border-r p-1 flex flex-col ${isToday ? 'bg-blue-50/50' : (holiday ? 'bg-red-50/50' : 'bg-white')} min-h-[120px] transition-colors hover:bg-gray-50 cursor-pointer`}
                            onClick={() => onDayClick(dateKey)}
                        >
                            <div className={`text-right text-xs font-bold mb-1 flex justify-between items-center ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                                {holiday && <span className="text-[10px] text-red-500 uppercase truncate max-w-[80px] leading-none" title={holiday}>{holiday}</span>}
                                <span>{d}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {dayAppts.map(a => {
                                    const type = config.types.find(t => t.id === a.typeId);
                                    const colorKey = type ? type.colorKey : 'blue';
                                    // Use smaller palette for month view items or standard? Standard.
                                    const palette = COLOR_PALETTES[colorKey] || COLOR_PALETTES['blue'];
                                    return (
                                        <div key={a.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAppointmentClick(a);
                                            }}
                                            className={`text-[9px] px-1 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 ${palette.bg}`}
                                            title={`${a.time} - ${a.clientName}`}
                                        >
                                            <span className="font-bold mr-1">{a.time}</span>
                                            {a.clientName}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
