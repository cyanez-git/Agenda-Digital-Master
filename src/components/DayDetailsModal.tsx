import React from 'react';
import { X, Clock, User, Phone } from 'lucide-react';
import { Appointment, AppConfig } from '../types';
import { COLOR_PALETTES } from '../utils/calendar';

interface DayDetailsModalProps {
    date: string;
    appointments: Appointment[];
    config: AppConfig;
    onClose: () => void;
    onEdit: (appt: Appointment) => void;
    onAdd: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
    date,
    appointments,
    config,
    onClose,
    onEdit,
    onAdd
}) => {
    // Sort logic handled in parent or here? Doing it here specifically for display
    const sortedAppointments = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

    const [year, month, day] = date.split('-').map(Number);
    const displayDate = new Date(year, month - 1, day).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-lg font-bold capitalize text-gray-800">
                        {displayDate}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {sortedAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No hay turnos para este día</p>
                            <button
                                onClick={() => { onClose(); onAdd(); }}
                                className="mt-4 text-blue-600 font-medium hover:underline"
                            >
                                + Agregar uno ahora
                            </button>
                        </div>
                    ) : (
                        sortedAppointments.map(appt => {
                            const type = config.types.find(t => t.id === appt.typeId);
                            const palette = COLOR_PALETTES[type?.colorKey || 'blue'];

                            return (
                                <div
                                    key={appt.id}
                                    onClick={() => { onClose(); onEdit(appt); }}
                                    className={`p-3 rounded-lg border-l-4 ${palette.bg} ${palette.border} cursor-pointer hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center text-gray-700 font-bold">
                                            <Clock size={16} className="mr-2 opacity-60" />
                                            {appt.time}
                                            {appt.duration && <span className="text-xs font-normal ml-1 opacity-70">({appt.duration}m)</span>}
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/50 border ${palette.text} font-bold`}>
                                            {type?.label || 'Turno'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-800 font-medium mb-1">
                                        <User size={16} className="mr-2 opacity-60" />
                                        {appt.clientName}
                                    </div>
                                    {appt.phone && (
                                        <div className="flex items-center text-gray-500 text-sm">
                                            <Phone size={14} className="mr-2 opacity-60" />
                                            {appt.phone}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={() => { onClose(); onAdd(); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center shadow-sm"
                    >
                        + Nuevo Turno
                    </button>
                </div>
            </div>
        </div>
    );
};
