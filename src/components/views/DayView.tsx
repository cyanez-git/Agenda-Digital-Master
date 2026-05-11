import React from 'react';
import { Phone, Plus } from 'lucide-react';
import { AppConfig, Appointment } from '../../types';
import { formatDateKey, generateTimeSlots, isSlotExpired, COLOR_PALETTES } from '../../utils/calendar';
import { getHoliday } from '../../utils/holidays';

interface DayViewProps {
    currentDate: Date;
    appointments: Appointment[]; // Filtered
    config: AppConfig;
    onSlotClick: (time: string) => void;
    onAppointmentClick: (appt: Appointment) => void;
}

export const DayView: React.FC<DayViewProps> = ({
    currentDate,
    appointments,
    config,
    onSlotClick,
    onAppointmentClick
}) => {
    const dateKey = formatDateKey(currentDate);
    const dayAppts = appointments.filter(a => a.date === dateKey);
    const timeSlots = generateTimeSlots(config.gridStep, config.startHour || 8, config.endHour || 20);

    return (
        <div className="bg-white h-full overflow-y-auto pb-20">
            {timeSlots.map(time => {
                const appt = dayAppts.find(a => a.time === time);
                const isExpired = isSlotExpired(dateKey, time);
                const type = config.types.find(t => t.id === appt?.typeId);
                const colorKey = type ? type.colorKey : 'blue';
                const palette = COLOR_PALETTES[colorKey] || COLOR_PALETTES['blue'];
                // Construct color classes manually to ensure lookup works
                const colorClass = `${palette.bg} ${palette.text} ${palette.border}`;

                const holiday = getHoliday(dateKey, config.country);
                const isHolidaySlot = holiday && time === '09:00';

                return (
                    <div key={time} className={`flex border-b border-slate-100 min-h-[70px] ${holiday ? 'bg-red-50/30' : ''}`}>
                        <div className="w-16 flex items-start pt-2 justify-center text-xs text-slate-700 border-r bg-slate-50 font-bold relative">
                            {time}
                            {isHolidaySlot && <span className="absolute mt-6 text-[9px] text-red-500 font-bold uppercase w-14 text-center leading-tight">{holiday}</span>}
                        </div>
                        <div className="flex-1 p-1 relative">
                            {appt ? (
                                <div
                                    onClick={() => onAppointmentClick(appt)}
                                    className={`absolute top-0 left-0 right-0 z-20 rounded p-2 ${colorClass} border-l-4 shadow-sm cursor-pointer overflow-hidden`}
                                    style={{ height: `calc(${(appt.duration / config.gridStep) * 100}% + 1px)` }}
                                >
                                    <div className="font-bold text-sm">{appt.clientName}</div>
                                    <div className="text-xs opacity-80 flex gap-1 items-center">{appt.phone && <Phone size={10} />} {appt.title} ({appt.duration} min)</div>
                                </div>
                            ) : (
                                <div onClick={() => {
                                    if (isExpired) return;
                                    onSlotClick(time);
                                }} className={`h-full w-full flex items-center justify-center ${isExpired ? 'bg-[length:4px_4px] bg-slate-50 opacity-50 cursor-not-allowed' : 'opacity-0 hover:opacity-100 cursor-pointer'}`}>
                                    {!isExpired && <Plus className="text-slate-300" />}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
