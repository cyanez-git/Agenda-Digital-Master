import { useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import { APP_THEMES, type ViewMode } from './constants';
import type { Appointment, Patient, ToastMessage, AppNotification } from './types';
import { formatDateKey } from './utils/calendar';
import { normalizeText } from './utils/string';

// Components
import { LoginScreen } from './components/LoginScreen';
import { TopBar } from './components/TopBar';
import { PatientsView } from './components/PatientsView';
import { AppointmentModal } from './components/AppointmentModal';
import { PatientModal } from './components/PatientModal';
import { ConfigScreen } from './components/ConfigScreen';
import { MessagingCenter } from './components/MessagingCenter';
import { DayDetailsModal } from './components/DayDetailsModal';
import { DayView } from './components/views/DayView';
import { WeekView } from './components/views/WeekView';
import { MonthView } from './components/views/MonthView';
import { NoteModal } from './components/NoteModal';
import { NotesMonthView } from './components/views/NotesMonthView';
import { HelpModal } from './components/HelpModal';

// Hooks
import { useAppData } from './hooks/useAppData';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';

// Icons
import {
    Clock, Grid, Calendar as CalendarIcon, Users, MessageSquare,
    Settings, StickyNote, Plus, Check, AlertCircle, X,
} from 'lucide-react';

export default function AgendaProSaaS() {
    // --- AUTH ---
    const [user, setUser] = useState<any>(null);
    const [clientId, setClientId] = useState<string | null>(() => localStorage.getItem('agenda_client_id'));

    // --- APP STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewMode>('day');
    const [selectedProfId, setSelectedProfId] = useState<string>('1');
    const [patientFilter, setPatientFilter] = useState('');

    // --- UI STATE ---
    const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
    const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [isDrivingMode, setDrivingMode] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedNoteDate, setSelectedNoteDate] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<any>(null);

    // --- DATA LAYER ---
    const {
        appointments, setAppointments,
        patients, config,
        notes,
        dbSaveAppointment, dbDeleteAppointment,
        dbSavePatient, dbDeletePatient,
        dbSaveConfig,
        dbSaveNote, dbDeleteNote,
    } = useAppData({ user, clientId, selectedProfId, setSelectedProfId, onToast: setToastMessage });

    // --- AUTH INITIALIZATION ---
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (!import.meta.env.VITE_FIREBASE_API_KEY) throw new Error('Falta configuración de Firebase (.env)');
                // @ts-ignore
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    // @ts-ignore
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err: any) {
                console.error('[Auth]', err);
            }
        };
        initAuth();
        const unsub = onAuthStateChanged(auth, setUser, (err) => console.error('[AuthState]', err));
        return () => unsub();
    }, []);

    // --- DERIVED STATE ---
    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(a => a.clientId === clientId && a.professionalId === selectedProfId)
            .map(a => {
                if (a.patientId) {
                    const linked = patients.find(p => p.id === a.patientId);
                    if (linked) return { ...a, clientName: linked.name, phone: linked.phone || a.phone, whatsappName: linked.whatsappName || linked.name };
                }
                return a;
            });
    }, [appointments, clientId, selectedProfId, patients]);

    const currentProfessional = config.professionals.find(p => p.id === selectedProfId) || config.professionals[0] || { name: 'Cargando...', id: '0' };
    const currentTheme = APP_THEMES[config.theme] ?? APP_THEMES.blue;

    // --- STARTUP NOTIFICATION ---
    useEffect(() => {
        if (appointments.length === 0) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = formatDateKey(tomorrow);
        const pending = appointments.filter(a => a.date === tomorrowKey && !a.reminderSent && a.clientId === clientId).length;
        if (pending === 0) return;

        const notif: AppNotification = {
            id: 'pending-reminders-' + tomorrowKey,
            title: 'Recordatorios Pendientes',
            msg: `Tenés ${pending} mensajes para mañana`,
            timestamp: new Date(),
            read: false,
            type: 'warning',
            actionLabel: 'Ir a Mensajes',
            onAction: () => setView('messages'),
        };
        setNotifications(prev => prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]);

        if (!sessionStorage.getItem('startupCheckDismissed')) {
            setToastMessage({ title: notif.title, msg: notif.msg, type: 'warning', actionLabel: 'Ocultar', onAction: () => {} });
            sessionStorage.setItem('startupCheckDismissed', 'true');
        }
    }, [appointments.length]);

    // --- VOICE ASSISTANT ---
    const handleVoiceExecution = useCallback(async (action: any) => {
        if (action.intent === 'MOVE_APPOINTMENT') {
            const { targetName, newDate, newTime } = action.params || {};
            const found = appointments.find(a => normalizeText(a.clientName).includes(normalizeText(targetName || '')));
            if (found && newDate && newTime) {
                await dbSaveAppointment({ ...found, date: newDate, time: newTime });
                setToastMessage({ title: 'Voz', msg: 'Turno reprogramado', type: 'success' });
            }
        }
    }, [appointments, dbSaveAppointment]);

    const { isListening, transcript, messages, agentState } = useVoiceAssistant({
        isEnabled: isDrivingMode,
        context: {
            professionalId: selectedProfId,
            professionalName: currentProfessional.name,
        },
        clientId: clientId || undefined,
        onExecute: handleVoiceExecution,
    });

    // --- AUTH HANDLERS ---
    const handleLogin = (orgId: string) => {
        setClientId(orgId);
        localStorage.setItem('agenda_client_id', orgId);
        setToastMessage({ title: 'Bienvenido', msg: `Sesión iniciada en: ${orgId}`, type: 'success' });
    };

    const handleLogout = () => {
        if (!confirm('¿Cerrar sesión de la organización?')) return;
        setClientId(null);
        localStorage.removeItem('agenda_client_id');
    };

    // --- TOAST AUTO-DISMISS ---
    useEffect(() => {
        if (!toastMessage) return;
        const t = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(t);
    }, [toastMessage]);

    // --- RENDER: LOGIN ---
    if (!clientId) {
        return (
            <>
                <LoginScreen onLogin={handleLogin} onHelp={() => setIsHelpModalOpen(true)} />
                {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
            </>
        );
    }

    // --- RENDER: MAIN APP ---
    return (
        <div className={`flex h-screen w-full bg-slate-50 ${currentTheme.text} overflow-hidden`}>
            {/* Sidebar */}
            {!isDrivingMode && (
                <div className={`w-20 ${currentTheme.primary} flex flex-col items-center py-6 gap-6 shrink-0 overflow-y-auto`}>
                    <button
                        onClick={() => setDrivingMode(true)}
                        className="w-14 h-14 rounded-full flex items-center justify-center mb-4 hover:scale-105 hover:shadow-lg transition-all"
                        title="Asistente IA"
                    >
                        <img src="/ai-avatar.jpg" alt="IA" className="w-full h-full rounded-full object-cover border-2 border-white/30" />
                    </button>

                    {([
                        { v: 'day',      icon: <Clock size={24} />,          title: 'Día' },
                        { v: 'week',     icon: <Grid size={24} />,           title: 'Semana' },
                        { v: 'month',    icon: <CalendarIcon size={24} />,   title: 'Mes' },
                        { v: 'patients', icon: <Users size={24} />,          title: 'Pacientes' },
                        { v: 'messages', icon: <MessageSquare size={24} />,  title: 'Mensajes' },
                        { v: 'notes',    icon: <StickyNote size={24} />,     title: 'Notas' },
                    ] as const).map(({ v, icon, title }) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            title={title}
                            className={`p-3 rounded-xl transition-all ${view === v ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        >
                            {icon}
                        </button>
                    ))}

                    <div className="mt-auto">
                        <button
                            onClick={() => setView('config')}
                            title="Configuración"
                            className={`p-3 rounded-xl transition-all ${view === 'config' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        >
                            <Settings size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!isDrivingMode && (
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <TopBar
                        currentDate={currentDate}
                        view={view}
                        config={config}
                        selectedProfId={selectedProfId}
                        currentProfessional={currentProfessional}
                        notifications={notifications}
                        isNotificationsOpen={isNotificationsOpen}
                        onDateChange={setCurrentDate}
                        onProfessionalChange={setSelectedProfId}
                        onClearNotifications={() => setNotifications([])}
                        onNotificationsOpenChange={setIsNotificationsOpen}
                        onLogout={handleLogout}
                        onHelp={() => setIsHelpModalOpen(true)}
                    />

                    <div className="flex-1 overflow-hidden relative">
                        {view === 'config' && (
                            <ConfigScreen
                                config={config}
                                onSave={async (newConfig) => {
                                    const ok = await dbSaveConfig(newConfig);
                                    if (ok !== false) setView('day');
                                }}
                                onCancel={() => setView('day')}
                            />
                        )}
                        {view === 'messages' && (
                            <MessagingCenter
                                appointments={filteredAppointments}
                                template={config.whatsappReminderTemplate}
                                professionals={config.professionals}
                                patients={patients}
                                onMarkSent={(id) => {
                                    const updated = appointments.map(a => a.id === id ? { ...a, reminderSent: true } : a);
                                    setAppointments(updated);
                                    const appt = updated.find(a => a.id === id);
                                    if (appt) dbSaveAppointment(appt);
                                }}
                            />
                        )}
                        {view === 'notes' && (
                            <NotesMonthView
                                currentDate={currentDate}
                                notes={notes.filter(n => n.clientId === clientId && n.professionalId === selectedProfId)}
                                onDayClick={(dateKey) => { setSelectedNoteDate(dateKey); setEditingNote(null); setIsNoteModalOpen(true); }}
                                onNoteClick={(note) => { setEditingNote(note); setIsNoteModalOpen(true); }}
                                country={config.country}
                            />
                        )}
                        {view === 'day' && (
                            <DayView
                                currentDate={currentDate}
                                appointments={filteredAppointments}
                                config={config}
                                onSlotClick={(time) => { setSelectedSlot({ date: formatDateKey(currentDate), time }); setEditingAppointment(null); setIsModalOpen(true); }}
                                onAppointmentClick={(appt) => { setEditingAppointment(appt); setIsModalOpen(true); }}
                            />
                        )}
                        {view === 'week' && (
                            <WeekView
                                currentDate={currentDate}
                                appointments={filteredAppointments}
                                config={config}
                                onSlotClick={(date, time) => { setSelectedSlot({ date, time }); setEditingAppointment(null); setIsModalOpen(true); }}
                                onAppointmentClick={(appt) => { setEditingAppointment(appt); setIsModalOpen(true); }}
                            />
                        )}
                        {view === 'month' && (
                            <MonthView
                                currentDate={currentDate}
                                appointments={filteredAppointments}
                                config={config}
                                onDayClick={(date) => setSelectedDayDetail(date)}
                                onAppointmentClick={(appt) => { setEditingAppointment(appt); setIsModalOpen(true); }}
                            />
                        )}
                        {view === 'patients' && (
                            <PatientsView
                                patients={patients}
                                patientFilter={patientFilter}
                                onFilterChange={setPatientFilter}
                                onNewPatient={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                                onEditPatient={(p) => { setEditingPatient(p); setIsPatientModalOpen(true); }}
                                onDeletePatient={dbDeletePatient}
                                onScheduleAppointment={(p) => {
                                    setEditingAppointment({
                                        id: crypto.randomUUID(),
                                        clientId: config.clientId,
                                        professionalId: config.professionals[0]?.id || '',
                                        title: '',
                                        clientName: p.name,
                                        patientId: p.id,
                                        dni: p.dni,
                                        email: p.email,
                                        phone: p.phone,
                                        date: formatDateKey(new Date()),
                                        time: '09:00',
                                        duration: config.slotDuration || 30,
                                        typeId: config.types[0]?.id || '',
                                        isNewPatient: false,
                                        notes: '',
                                    });
                                    setIsModalOpen(true);
                                }}
                            />
                        )}

                        {view !== 'patients' && (
                            <button
                                onClick={() => { setEditingAppointment(null); setIsModalOpen(true); }}
                                className={`absolute bottom-8 right-8 w-14 h-14 ${currentTheme.primary} text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20`}
                            >
                                <Plus size={32} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* AI Assistant Overlay */}
            {isDrivingMode && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`rounded-full p-1 ${agentState === 'IDLE' ? 'bg-slate-800' : 'bg-indigo-500 animate-pulse'}`}>
                            <img src="/ai-avatar.jpg" alt="IA" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-3xl font-bold text-white">Asistente IA</h2>
                            <p className="text-gray-400 text-lg">
                                {agentState === 'IDLE' ? 'Escuchando... (Hacé silencio para enviar)' : 'Procesando...'}
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-lg h-64 overflow-y-auto bg-gray-900 rounded-xl p-4 mb-8 border border-gray-800 space-y-4">
                        {messages.length === 0 && <p className="text-gray-600 text-center italic mt-10">Historial vacío...</p>}
                        {messages.filter(m => m.role !== 'system').map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-gray-500 mb-1 uppercase">{m.role}</span>
                                <div className={`p-3 rounded-lg max-w-[90%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : m.role === 'tool' ? 'bg-slate-800 text-slate-300 font-mono text-xs' : 'bg-gray-700 text-white'}`}>
                                    {m.content?.toString() || (m.tool_calls ? '🛠️ (Herramienta)' : '')}
                                </div>
                            </div>
                        ))}
                        {isListening && transcript && agentState !== 'IDLE' && (
                            <div className="flex flex-col items-end opacity-50">
                                <span className="text-xs text-gray-500 mb-1">Escuchando...</span>
                                <div className="p-3 rounded-lg bg-gray-800 text-gray-300 italic border border-dashed border-gray-600">{transcript}</div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setDrivingMode(false)}
                        className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl flex items-center gap-3 transition-colors shadow-lg"
                    >
                        <X className="w-6 h-6" /> Salir
                    </button>
                </div>
            )}

            {/* Day Details Modal */}
            {selectedDayDetail && (
                <DayDetailsModal
                    date={selectedDayDetail}
                    appointments={filteredAppointments.filter(a => a.date === selectedDayDetail)}
                    config={config}
                    onClose={() => setSelectedDayDetail(null)}
                    onEdit={(appt) => { setEditingAppointment(appt); setIsModalOpen(true); }}
                    onAdd={() => { setSelectedSlot({ date: selectedDayDetail, time: '09:00' }); setIsModalOpen(true); }}
                />
            )}

            {/* Modals */}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(appt: Appointment) => {
                    dbSaveAppointment(appt);
                    setIsModalOpen(false);
                    setToastMessage({ title: 'Guardado', msg: 'Turno agendado correctamente', type: 'success' });
                }}
                onDelete={(id: string) => { dbDeleteAppointment(id); setIsModalOpen(false); }}
                initialData={editingAppointment}
                selectedSlot={selectedSlot || { date: formatDateKey(currentDate), time: '09:00' }}
                types={config.types}
                professionalId={selectedProfId}
                clientId={clientId}
                patients={patients}
                dbSavePatient={dbSavePatient}
                confirmTemplate={config.whatsappConfirmTemplate}
                professionalName={currentProfessional.name}
            />

            <PatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSave={(p: Patient) => { dbSavePatient(p); setIsPatientModalOpen(false); }}
                initialData={editingPatient}
                clientId={clientId}
            />

            <NoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSave={async (note) => { const ok = await dbSaveNote(note); if (ok) setIsNoteModalOpen(false); }}
                onDelete={async (id) => { const ok = await dbDeleteNote(id); if (ok) setIsNoteModalOpen(false); }}
                initialData={editingNote}
                selectedDate={selectedNoteDate}
                professionalId={selectedProfId}
                clientId={clientId}
            />

            {/* Toast */}
            {toastMessage && (
                <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : toastMessage.type === 'warning' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-white'}`}>
                    {toastMessage.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <div>
                        <div className="font-bold text-sm">{toastMessage.title}</div>
                        <div className="text-xs opacity-90">{toastMessage.msg}</div>
                    </div>
                    {toastMessage.actionLabel && (
                        <button
                            onClick={() => { toastMessage.onAction?.(); setToastMessage(null); }}
                            className="bg-white text-slate-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100"
                        >
                            {toastMessage.actionLabel}
                        </button>
                    )}
                </div>
            )}

            {isHelpModalOpen && <HelpModal onClose={() => setIsHelpModalOpen(false)} />}
        </div>
    );
}
