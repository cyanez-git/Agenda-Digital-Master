import React, { useState, useEffect } from 'react';
import { createWhatsAppLink } from '../utils/whatsapp';
import { MessageSquare, Check, X, Send, Calendar, ExternalLink, Play } from 'lucide-react';

interface Appointment {
    id: string;
    clientName: string;
    phone?: string;
    patientId?: string;
    whatsappName?: string;
    time: string;
    date: string;
    reminderSent?: boolean;
    professionalId: string;
}

interface Professional {
    id: string;
    name: string;
}

interface Patient {
    id: string;
    name: string;
    phone: string;
}

interface MessagingCenterProps {
    appointments: Appointment[];
    onMarkSent: (id: string) => void;
    template: string;
    professionals: Professional[];
    patients?: Patient[];
}

export const MessagingCenter: React.FC<MessagingCenterProps> = ({ appointments, onMarkSent, template, professionals, patients = [] }) => {
    // Default to tomorrow
    const getTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };

    const [selectedDate, setSelectedDate] = useState(getTomorrow());
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchIndex, setBatchIndex] = useState(0);

    // Format YYYY-MM-DD is native for input type="date"
    const dateInputValue = selectedDate;

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    // Filter appointments for selected date
    const dailyAppointments = appointments
        .filter(a => a.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time));

    const pendingCount = dailyAppointments.filter(a => !a.reminderSent).length;
    const sentCount = dailyAppointments.length - pendingCount;

    // Helper: Get effective phone (from appointment or patient record)
    const getEffectivePhone = (appt: Appointment): string | undefined => {
        if (appt.phone) return appt.phone;
        if (appt.patientId) {
            const linkedPatient = patients.find(p => p.id === appt.patientId);
            if (linkedPatient?.phone) return linkedPatient.phone;
        }
        return undefined;
    };

    // Helper: Get effective name (prefer patient record if exists)
    const getEffectiveName = (appt: Appointment): string => {
        if (appt.patientId) {
            const linkedPatient = patients.find(p => p.id === appt.patientId);
            if (linkedPatient?.name) return linkedPatient.name;
        }
        return appt.clientName;
    };

    // Generate WhatsApp Link
    const getWhatsappLink = (appt: Appointment) => {
        const phone = getEffectivePhone(appt);
        if (!phone) return '#';

        // Resolve date variable (smart check for "mañana")
        // Simple check: if selectedDate is actually tomorrow's YYYY-MM-DD
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${yyyy}-${mm}-${dd}`;

        const isTomorrow = selectedDate === tomorrowStr;

        const dateString = isTomorrow
            ? 'mañana'
            : `${selectedDate.split('-')[2]}/${selectedDate.split('-')[1]}/${selectedDate.split('-')[0]}`;

        let msg = template
            .replace(/{paciente}/gi, getEffectiveName(appt))
            .replace(/{nombreWA}/gi, appt.whatsappName || getEffectiveName(appt))
            .replace(/{hora}/gi, appt.time)
            .replace(/{fecha}/gi, dateString);

        // Resolve professional name
        const profName = professionals.find(p => p.id === appt.professionalId)?.name || '';
        msg = msg.replace(/{profesional}/gi, profName);

        return createWhatsAppLink(phone, msg);
    };

    // Batch Sending Logic
    const currentBatchAppt = isBatchMode && dailyAppointments[batchIndex] ? dailyAppointments[batchIndex] : null;

    useEffect(() => {
        if (isBatchMode) {
            // If current index is out of bounds or already sent (if we want to skip sent ones, logic goes here)
            // For now, let's iterate all, but maybe skip ones without phone
            if (batchIndex >= dailyAppointments.length) {
                // End of batch
                // setIsBatchMode(false); // Optional: Auto close or show summary
            }
        }
    }, [batchIndex, isBatchMode, dailyAppointments.length]);

    const handleBatchNext = () => {
        if (batchIndex < dailyAppointments.length - 1) {
            setBatchIndex(batchIndex + 1);
        } else {
            setIsBatchMode(false);
        }
    };

    const handleBatchSend = (appt: Appointment) => {
        onMarkSent(appt.id);
        const link = getWhatsappLink(appt);
        window.location.href = link;
        handleBatchNext();
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white p-4 md:p-6 shadow-sm z-10 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <MessageSquare className="text-green-600 shrink-0" /> Centro de Mensajería
                    </h1>
                    <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
                        <div className="text-sm font-medium text-slate-500 w-full md:w-auto flex justify-between md:justify-start gap-2">
                            <span><span className="text-green-600 font-bold">{sentCount}</span> Enviados</span>
                            <span className="md:hidden">/</span>
                            <span><span className="text-slate-800 font-bold">{dailyAppointments.length}</span> Total</span>
                        </div>
                        <div className="hidden md:block h-8 w-px bg-slate-200"></div>
                        <input
                            type="date"
                            value={dateInputValue}
                            onChange={handleDateChange}
                            className="bg-white md:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 outline-none focus:ring-2 ring-green-500 w-full md:w-auto"
                        />
                    </div>
                </div>

                {dailyAppointments.length > 0 && String(dailyAppointments.some(a => !a.reminderSent)) === 'true' && (
                    <button
                        onClick={() => { setIsBatchMode(true); setBatchIndex(0); }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white p-3 md:p-4 rounded-xl shadow-lg shadow-green-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3 font-bold text-sm md:text-lg"
                    >
                        <Play size={20} className="md:w-6 md:h-6" fill="currentColor" /> Iniciar Modo Ráfaga (Enviar {pendingCount})
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {dailyAppointments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <Calendar size={64} className="mb-4" />
                        <p className="text-lg font-medium">No hay turnos para esta fecha</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {dailyAppointments.map((appt) => (
                            <div key={appt.id} className={`bg-white p-4 rounded-xl border flex items-center justify-between transition-all ${appt.reminderSent ? 'border-green-200 bg-green-50/30' : 'border-slate-100 hover:shadow-md'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${appt.reminderSent ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {appt.reminderSent ? <Check size={20} /> : appt.time}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800">{getEffectiveName(appt)}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            {getEffectivePhone(appt) || 'Sin celular'}
                                            {getEffectivePhone(appt) ? '' : <span className="text-red-400 font-bold">(No se puede enviar)</span>}
                                        </div>
                                    </div>
                                </div>

                                {getEffectivePhone(appt) && (
                                    <button
                                        onClick={() => {
                                            onMarkSent(appt.id);
                                            window.open(getWhatsappLink(appt), '_blank');
                                        }}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${appt.reminderSent ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-800 text-white hover:bg-slate-700 shadow-lg shadow-slate-500/20'}`}
                                    >
                                        <Send size={16} /> {appt.reminderSent ? 'Reenviar' : 'Enviar'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Batch Mode Modal */}
            {isBatchMode && currentBatchAppt && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <h2 className="font-bold flex items-center gap-2">
                                <Play size={18} fill="currentColor" /> Modo Ráfaga ({batchIndex + 1}/{dailyAppointments.length})
                            </h2>
                            <button onClick={() => setIsBatchMode(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                                {currentBatchAppt.time}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-1">{getEffectiveName(currentBatchAppt)}</h3>
                            <p className="text-slate-500 mb-6 font-mono">{getEffectivePhone(currentBatchAppt) || 'Sin Número'}</p>

                            {!getEffectivePhone(currentBatchAppt) ? (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6 text-sm">
                                    Este paciente no tiene número de celular registrado.
                                </div>
                            ) : (
                                <div className="w-full">
                                    <button
                                        autoFocus
                                        onClick={() => handleBatchSend(currentBatchAppt)}
                                        className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-xl shadow-xl shadow-green-600/30 hover:bg-green-500 active:scale-95 transition-all flex items-center justify-center gap-2 mb-3"
                                    >
                                        <ExternalLink size={24} /> Enviar y Siguiente
                                    </button>
                                    <p className="text-xs text-slate-400">Presiona Enter para confirmar</p>
                                </div>
                            )}

                            <div className="flex gap-3 w-full mt-6">
                                <button onClick={handleBatchNext} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Saltar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Complete Modal */}
            {isBatchMode && !currentBatchAppt && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check size={40} strokeWidth={4} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Todo Listo!</h2>
                        <p className="text-slate-500 mb-8">Has revisado todos los turnos del día.</p>
                        <button onClick={() => setIsBatchMode(false)} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">Finalizar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
