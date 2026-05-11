import React from 'react';
import { AppConfig, Appointment } from '../../types';
import { formatDateKey, generateTimeSlots, isSlotExpired, getStartOfWeek, addDays, COLOR_PALETTES } from '../../utils/calendar';
import { getHoliday } from '../../utils/holidays';

interface WeekViewProps {
    currentDate: Date;
    appointments: Appointment[]; // Filtered
    config: AppConfig;
    onSlotClick: (date: string, time: string) => void;
    onAppointmentClick: (appt: Appointment) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
    currentDate,
    appointments,
    config,
    onSlotClick,
    onAppointmentClick
}) => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
    const timeSlots = generateTimeSlots(config.gridStep, config.startHour || 8, config.endHour || 20);

    return (
        <div className="flex flex-col h-full bg-white overflow-auto">
            <div className="min-w-[800px] flex flex-col h-full">
                {/* Header */}
                <div className="flex border-b sticky top-0 bg-white z-10 shadow-sm">
                    <div className="w-14 shrink-0 bg-slate-50 border-r"></div>
                    {days.map(d => {
                        const dKey = formatDateKey(d);
                        const holiday = getHoliday(dKey, config.country);
                        const isToday = dKey === formatDateKey(new Date());
                        return (
                            <div key={d.toISOString()} className={`flex-1 text-center py-2 border-r font-bold text-sm ${isToday ? 'text-blue-600 bg-blue-50' : (holiday ? 'text-red-600 bg-red-50' : 'text-slate-600')}`}>
                                {d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).toUpperCase()}
                                {holiday && <div className="text-[10px] lowercase truncate px-1">{holiday}</div>}
                            </div>
                        );
                    })}
                </div>
                {/* Grid */}
                <div className="flex-1">
                    {timeSlots.map(time => (
                        <div key={time} className="flex min-h-[50px] border-b">
                            <div className="w-14 shrink-0 text-xs text-slate-700 font-bold text-right pr-2 py-2 border-r sticky left-0 bg-white">{time}</div>
                            {days.map(d => {
                                const dateKey = formatDateKey(d);
                                const appt = appointments.find(a => a.date === dateKey && a.time === time);
                                const expired = isSlotExpired(dateKey, time);
                                const type = config.types.find(t => t.id === appt?.typeId);
                                const colorKey = type ? type.colorKey : 'gray';
                                const palette = COLOR_PALETTES[colorKey] || { bg: 'bg-gray-100', text: '', border: '' };
                                const colorClass = `${palette.bg} ${palette.border}`;

                                return (
                                    <div key={dateKey + time} className="flex-1 border-r relative group p-0.5">
                                        {appt ? (
                                            <div
                                                onClick={() => onAppointmentClick(appt)}
                                                className={`absolute top-0 left-0 right-0 z-20 rounded text-[10px] p-1 font-bold leading-tight cursor-pointer ${colorClass} border-l-2 shadow-sm truncate`}
                                                style={{ height: `calc(${(appt.duration / config.gridStep) * 100}% + 1px)` }}
                                                title={`${appt.time} - ${appt.clientName} (${appt.duration} min)`}
                                            >
                                                {appt.clientName}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    if (expired) return;
                                                    onSlotClick(dateKey, time);
                                                }}
                                                className={`w-full h-full ${expired ? 'bg-slate-50 opacity-40' : 'hover:bg-blue-50 cursor-pointer'} transition-colors`}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
