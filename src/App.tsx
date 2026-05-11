import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createWhatsAppLink } from './utils/whatsapp';
import { getInitials } from './utils/string';
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

// Shared Types & Utils
import { Appointment, Patient, AppConfig, Note } from './types';
import { formatDateKey } from './utils/calendar';

import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CalendarPlus,
    Clock,
    Plus,
    Check,
    Users,
    Search,
    Phone,
    Grid,
    Building2,
    LogOut,
    Lock,
    Settings,
    AlertCircle,
    MessageSquare,
    Trash,
    X,
    Bell,
    HelpCircle,
    StickyNote
} from 'lucide-react';

import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { HelpModal } from './components/HelpModal';


// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import {
    getFirestore,
    collection,
    setDoc,
    deleteDoc,
    onSnapshot,
    doc,
    query,
    where
} from 'firebase/firestore';



// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// USE SPECIFIC DATABASE ID AS PROVIDED IN USER SNIPPET
const db = getFirestore(app, "pacientesturnos");

// --- Tipos y Constantes ---

const APP_THEMES = {
    'blue': { primary: 'bg-blue-600', secondary: 'bg-blue-50', text: 'text-slate-800', border: 'border-blue-200' },
    'teal': { primary: 'bg-teal-600', secondary: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200' },
    'violet': { primary: 'bg-violet-600', secondary: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200' },
    'slate': { primary: 'bg-slate-700', secondary: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200' },
    'indigo': { primary: 'bg-indigo-600', secondary: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
    'rose': { primary: 'bg-rose-600', secondary: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200' },
};

type ViewMode = 'day' | 'week' | 'month' | 'patients' | 'config' | 'messages' | 'notes';

const DEFAULT_CONFIG: AppConfig = {
    clientId: '',
    organizationName: 'Mi Consultorio',
    theme: 'blue',
    country: 'AR',
    types: [
        { id: '1', label: 'Consulta General', duration: 30, colorKey: 'blue' },
        { id: '2', label: 'Primera Vez', duration: 60, colorKey: 'green' }
    ],
    professionals: [
        { id: '1', name: 'Dr. Principal', title: 'Especialista' }
    ],
    slotDuration: 30,
    gridStep: 30,
    whatsappConfirmTemplate: 'Hola {paciente}, confirmamos tu turno para el {fecha} a las {hora} con {profesional}.',
    whatsappReminderTemplate: 'Hola {paciente}, recordá tu turno para {fecha} a las {hora} con {profesional}.',
    startHour: 8,
    endHour: 20
};

// @ts-ignore
const formatMessage = (template: string, appt: Appointment, professionalName: string) => {
    const date = new Date(appt.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    return template.replace(/{paciente}/g, appt.clientName).replace(/{fecha}/g, date).replace(/{hora}/g, appt.time).replace(/{profesional}/g, professionalName);
};

// @ts-ignore
const sendWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
};

const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Helper to convert "uno" -> "1" for better search matching (disabled with old voice system)
/*
const textToDigits = (text: string) => {
    const map: Record<string, string> = {
        'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
        'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10'
    };
    return text.split(' ').map(w => map[w.toLowerCase()] || w).join(' ');
};
*/

const LoginScreen = ({ onLogin, onHelp }: { onLogin: (clientId: string) => void, onHelp: () => void }) => {
    const [orgId, setOrgId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgId.length < 3) {
            setError('El ID de organización debe tener al menos 3 caracteres');
            return;
        }
        onLogin(orgId.toLowerCase().replace(/\s+/g, '-'));
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
                        <Building2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">AgendaPro SaaS</h1>
                    <p className="text-slate-500 mt-2">Plataforma de Gestión Multi-Cliente</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Lock size={16} className="text-slate-400" /> ID de Organización
                        </label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Ej: clinica-central, dr-perez"
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-colors font-medium"
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            * Si la organización no existe, se creará automáticamente.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                    >
                        Ingresar al Sistema
                    </button>
                    {/* Help button in top bar (placed here for LoginScreen context) */}
                    <button
                        type="button"
                        onClick={onHelp}
                        className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-bold rounded-xl transition-colors"
                    >
                        <HelpCircle size={20} /> Ayuda
                    </button>
                </form>
            </div>
        </div>
    );
};

interface Notification {
    id: string;
    title: string;
    msg: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    actionLabel?: string;
    onAction?: () => void;
}

export default function AgendaProSaaS() {
    console.log("Rendering AgendaProSaaS Component"); // DEBUG: Mount/Render

    // Notifications State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // GLOBAL AUTH STATE
    const [user, setUser] = useState<any>(null);
    // const [authError, setAuthError] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(() => {
        const stored = localStorage.getItem('agenda_client_id');
        console.log("Initial clientId from storage:", stored); // DEBUG: Storage
        return stored;
    }); // THE TENANT ID

    // APP STATE
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<ViewMode>('day');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [selectedProfId, setSelectedProfId] = useState<string>('1');
    const [patientFilter, setPatientFilter] = useState('');
    const [notes, setNotes] = useState<Note[]>([]);

    // UI STATE
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
    const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null); // For Month View Details
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [toastMessage, setToastMessage] = useState<{ title: string, msg: string, type?: 'info' | 'error' | 'success' | 'warning', actionLabel?: string, onAction?: () => void } | null>(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [isDrivingMode, setDrivingMode] = useState(false); // Driving Model Toggle
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    // Notes UI State
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedNoteDate, setSelectedNoteDate] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // --- AUTH INITIALIZATION ---
    useEffect(() => {
        const initAuth = async () => {
            console.log("Starting Auth Initialization...");
            try {
                // Check if config is loaded
                if (!firebaseConfig.apiKey) {
                    throw new Error("Falta configuración de Firebase (.env)");
                }
                console.log("Firebase Config Code:", firebaseConfig.apiKey.substring(0, 5));

                // @ts-ignore
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    console.log("Signing in with Custom Token...");
                    // @ts-ignore
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    console.log("Signing in Anonymously...");
                    await signInAnonymously(auth);
                }
                console.log("Sign In call finished.");
            } catch (err: any) {
                console.error("Auth Error details:", err);
                // setAuthError(err.message || 'Error desconocido al iniciar sesión');
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth,
            (u) => {
                console.log("AuthStateChanged FIRED. User:", u?.uid);
                setUser(u);
            },
            (err) => {
                console.error("AuthStateChanged ERROR:", err);
                // setAuthError(err.message);
            }
        );
        return () => unsubscribe();
    }, []);

    // --- OLD VOICE HELPERS (DISABLED - Remove manually) ---
    /*
    const parseDateFromVoice = (text: string): Date | null => {
        const now = new Date();
        const lower = text.toLowerCase();

        // 1. Relative Terms
        if (lower.includes('pasado mañana')) {
            const d = new Date(now); d.setDate(d.getDate() + 2); return d;
        }
        if (lower.includes('mañana')) {
            const d = new Date(now); d.setDate(d.getDate() + 1); return d;
        }
        if (lower.includes('hoy')) return now;

        // 2. Full Date (Day + Month) e.g., "18 de diciembre"
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        // Matches "12 de octubre", "5 enero", "el 12 de octubre"
        const fullDateRegex = new RegExp(`(\\d{1,2})\\s+(?:de\\s+)?(${months.join('|')})`, 'i');
        const fullMatch = lower.match(fullDateRegex);

        if (fullMatch) {
            const day = parseInt(fullMatch[1]);
            const monthIdx = months.indexOf(fullMatch[2].toLowerCase());

            if (monthIdx !== -1) {
                const d = new Date(now.getFullYear(), monthIdx, day);
                // Smart Year Rollover: If the date is significantly in the past (e.g., > 1 month), assume next year.
                // Or simply: if today is Dec 20, and user says "5 de Enero", it implies next year.
                // Logic: If (TargetMonth < CurrentMonth) OR (TargetMonth == CurrentMonth && TargetDay < CurrentDay) -> Next Year
                // However, "18 de diciembre" when today is "12 de diciembre" is this year.

                // Let's use a simpler check: If the resulting date is more than 1 month in the past, add a year.
                const oneMonthAgo = new Date(now);
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

                if (d < oneMonthAgo) {
                    d.setFullYear(now.getFullYear() + 1);
                }
                return d;
            }
        }

        // 3. Simple Day e.g., "el 15", "el día 20" (assuming current month or next)
        // Look for number preceded by "el" or "dia" and NOT followed by a month (covered above) or time delimiter
        const dayMatch = lower.match(/(?:el|día|dia)\s+(\d{1,2})(?!\s*(?:de|:|horas?))/i);
        if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            const d = new Date(now);
            d.setDate(day);

            // If the day is in the past (e.g., today is 15th, user says "el 5"), assume next month.
            if (day < now.getDate()) {
                d.setMonth(d.getMonth() + 1);
            }
            return d;
        }

        // 4. Weekdays e.g., "el lunes"
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        for (let i = 0; i < 7; i++) {
            if (lower.includes(days[i]) || (days[i] === 'miercoles' && lower.includes('miércoles')) || (days[i] === 'sabado' && lower.includes('sábado'))) {
                const targetDay = i;
                const currentDay = now.getDay();
                let diff = targetDay - currentDay;
                if (diff <= 0) diff += 7; // Always next occurrence
                const d = new Date(now); d.setDate(d.getDate() + diff); return d;
            }
        }
        return null; // Fallback: Caller uses default logic (selectedSlot or today)
    };

    const parseTimeFromVoice = (text: string): string | null => {
        const match = text.match(/(?:a las|alas|hora)\s*(\d{1,2})(?::(\d{2}))?(\s*y\s*(?:media|cuarto))?/i);
        if (match) {
            let hour = parseInt(match[1]);
            let minute = match[2] ? parseInt(match[2]) : 0;
            const extra = match[3]?.trim();
            if (extra === 'y media') minute = 30;
            if (extra === 'y cuarto') minute = 15;
            if (hour < 7) hour += 12;
            return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
        return null;
    };

    // --- VOICE ASSISTANT ---
    const handleVoiceCommand = useCallback((action: VoiceCommandAction, text: string) => {
        console.log('Voice:', text, action);
        let msg = `Comando: "${text}"`;
        const lower = text.toLowerCase();

        // 1. Resolve Action if UNKNOWN (Client-side parsing)
        if (action === 'UNKNOWN') {
            if (lower.includes('turno') || lower.includes('cita') || lower.includes('agendar')) action = 'NEW_APPOINTMENT';
            else if (lower.includes('cancelar')) action = 'CANCEL';
            else if (lower.includes('guardar') || lower.includes('confirmar')) action = 'SAVE';
            else if (lower.includes('día') || lower.includes('diaria')) action = 'VIEW_DAY';
            else if (lower.includes('semana')) action = 'VIEW_WEEK';
            else if (lower.includes('mes')) action = 'VIEW_MONTH';
            else if (lower.includes('paciente')) action = 'VIEW_PATIENTS';
            else if (lower.includes('configuración')) action = 'VIEW_CONFIG';
            else if (lower.includes('hoy')) action = 'TODAY';
            else if (lower.includes('siguiente') || lower.includes('próximo')) action = 'NEXT';
            else if (lower.includes('anterior') || lower.includes('atrás') || lower.includes('viejo')) action = 'PREVIOUS';
        }

        // Updated Regex to include 'del', 'al', 'desde', 'hasta' as separators for better name isolation
        const nameMatch = text.match(/(?:para|a|de)\s+(.+?)(?:\s+(?:para|el|la|mañana|pasado|hoy|a las|del|al|desde|hasta)|$)/i);
        const modifyMatch = text.match(/(?:cambia|modifica|mueve|pasa|reprogramar)\s+(?:el\s+turno\s+de\s+|a\s+)(.+?)(?:\s+(?:del|de el|desde|el)\s+(.+?))?(?:\s+(?:para|al|a las|el|a la|hacia)\s+(.+)|$)/i);

        if (action !== 'UNKNOWN' && !nameMatch && !modifyMatch) {
            // Standard commands (View, etc) -> processed below in switch
        } else if (modifyMatch) {
            // --- MODIFY APPOINTMENT ---
            const rawName = modifyMatch[1].trim();
            const sourceDateText = modifyMatch[2]; // "Friday" (optional)
            const targetText = modifyMatch[3] || ''; // "Monday at 10"

            // 1. Parse Source Date (optional)
            const sourceDate = sourceDateText ? parseDateFromVoice(sourceDateText) : null;

            const normName = normalizeText(textToDigits(rawName));

            // 2. Find Appointment
            // Filter: Name match AND (SourceDate match OR Future match if no source date)
            const candidates = appointments.filter(a => {
                const nameOk = normalizeText(a.clientName).includes(normName) ||
                    normalizeText(textToDigits(a.clientName)).includes(normName);
                if (!nameOk) return false;

                if (sourceDate) {
                    return a.date === formatDateKey(sourceDate);
                } else {
                    // Default: next future appointment
                    return new Date(a.date + 'T' + a.time) >= new Date();
                }
            });

            // Sort candidates by date (nearest first)
            candidates.sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime());

            const targetAppt = candidates[0];

            if (targetAppt) {
                // 3. Parse Target Values
                const newDate = parseDateFromVoice(targetText);
                const newTime = parseTimeFromVoice(targetText);

                setEditingAppointment({
                    ...targetAppt,
                    date: newDate ? formatDateKey(newDate) : targetAppt.date,
                    time: newTime || targetAppt.time
                });
                setIsModalOpen(true);
                msg = `Reprogramando a ${targetAppt.clientName}`;
            } else {
                msg = `No encontré turno para ${rawName} ${sourceDate ? 'en esa fecha' : 'próximamente'}`;
            }
        } else if (action === 'NEW_APPOINTMENT' || nameMatch) {
            // Simplified for callback stability - relying on current state refs would be better but simple dependency is ok for now
            // Warning: captured state might be stale if deps not correct. 
            // Ideally we use refs for mutable state (isModalOpen, etc) inside callbacks, 
            // OR include them in deps.

            // For now, including main deps to just reduce frequency, although it will still change on state change.
            // Better than EVERY render.

            if (!isModalOpen) {
                let prefillName = '';
                let foundPatient: Patient | undefined;

                if (nameMatch) {
                    const rawName = nameMatch[1].trim();
                    const normSearch = normalizeText(rawName);
                    foundPatient = patients.find(p => normalizeText(p.name).includes(normSearch));

                    if (foundPatient) {
                        prefillName = foundPatient.name;
                        msg = `Encontrado: ${foundPatient.name}`;
                    } else {
                        prefillName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                        msg = `Nuevo paciente: ${prefillName}`;
                    }
                }

                const voiceDate = parseDateFromVoice(text);
                const voiceTime = parseTimeFromVoice(text);

                // Note: relying on closure state 'selectedSlot', 'currentDate', 'config'
                const baseDate = voiceDate || (selectedSlot ? new Date(selectedSlot.date + 'T00:00:00') : currentDate);
                const baseTime = voiceTime || selectedSlot?.time || '09:00';

                const initialAppt: Appointment = {
                    id: crypto.randomUUID(),
                    clientId: clientId || '',
                    professionalId: selectedProfId,
                    title: 'Consulta',
                    clientName: prefillName,
                    date: formatDateKey(baseDate),
                    time: baseTime,
                    duration: config.slotDuration,
                    typeId: config.types[0].id,
                    isNewPatient: !foundPatient,
                    notes: '',
                    phone: foundPatient?.phone || ''
                };

                setEditingAppointment(initialAppt);
                setIsModalOpen(true);
                if (!msg.includes("Encontrado")) msg = nameMatch ? `Agendando para ${prefillName}` : "Abriendo nuevo turno...";
            }
            setToastMessage({ title: 'Voz', msg, type: 'info' });
            setTimeout(() => setToastMessage(null), 3000);
            return;
        }

        switch (action) {
            case 'CANCEL':
                setIsModalOpen(false);
                msg = "Cancelado";
                break;
            case 'SAVE':
                msg = "Guardando...";
                if (isModalOpen) {
                    const saveBtn = document.getElementById('btn-save-appt');
                    if (saveBtn) saveBtn.click();
                }
                break;
            case 'VIEW_DAY': setView('day'); msg = "Vista Diaria"; break;
            case 'VIEW_WEEK': setView('week'); msg = "Vista Semanal"; break;
            case 'VIEW_MONTH': setView('month'); msg = "Vista Mensual"; break;
            case 'VIEW_PATIENTS': setView('patients'); msg = "Pacientes"; break;
            case 'TODAY': setCurrentDate(new Date()); msg = "Yendo a hoy"; break;
            case 'NEXT':
                // We use function state setters or simple logic to avoid stale closures if possible, 
                // but currentDate is needed.
                setCurrentDate(d => {
                    const next = new Date(d);
                    next.setDate(next.getDate() + (view === 'month' ? 30 : view === 'week' ? 7 : 1));
                    return next;
                });
                msg = "Siguiente";
                break;
            case 'PREVIOUS':
                setCurrentDate(d => {
                    const prev = new Date(d);
                    prev.setDate(prev.getDate() - (view === 'month' ? 30 : view === 'week' ? 7 : 1));
                    return prev;
                });
                msg = "Anterior";
                break;
            default:
                msg = `No entendí: "${text}"`;
        }

        setToastMessage({ title: 'Voz', msg, type: 'info' });
        setTimeout(() => setToastMessage(null), 2000);
    }, [isModalOpen, patients, selectedSlot, currentDate, config, clientId, selectedProfId, view]);
    */

    // --- OLD VOICE SYSTEM (DISABLED - Remove manually) ---
    /*
    const { isListening: isVoiceListening, startListening, stopListening, support, transcript: voiceTranscript, error: voiceError } = useVoice({
        onCommand: (action, text) => {
            handleVoiceCommand(action, text);
        }
    });

    useEffect(() => {
        if (voiceError) {
            setToastMessage({ title: 'Error de Voz', msg: voiceError, type: 'error' });
            setTimeout(() => setToastMessage(null), 4000);
        }
    }, [voiceError]);

    const toggleVoice = () => {
        if (isVoiceListening) {
            stopListening();
        } else {
            startListening();
        }
    };
    */

    // --- VOICE ASSISTANT (DRIVING MODE) ---
    const handleVoiceExecution = useCallback(async (action: any) => {
        console.log("Executing Voice Action:", action);

        if (action.intent === 'MOVE_APPOINTMENT') {
            // Logic to find and move appointment
            // action.params: { targetName, sourceDate?, newDate, newTime }
            const { targetName, newDate, newTime } = action.params || {};

            // Find Appt
            // Simple search by name
            const found = appointments.find(a => normalizeText(a.clientName).includes(normalizeText(targetName || '')));
            if (found && newDate && newTime) {
                const updated = { ...found, date: newDate, time: newTime };
                await dbSaveAppointment(updated);
                setToastMessage({ title: 'Voz', msg: 'Turno reprogramado', type: 'success' });
            }
        }
    }, [appointments, clientId]);

    const { isListening, transcript, messages, agentState } = useVoiceAssistant({
        isEnabled: isDrivingMode,
        context: {
            professionalId: selectedProfId,
            professionalName: config.professionals.find(p => p.id === selectedProfId)?.name || ''
        },
        clientId: clientId || undefined,
        onExecute: handleVoiceExecution
    });
    // --- DERIVED STATE ---
    const filteredAppointments = useMemo(() => {
        return appointments
            .filter(a => {
                if (a.clientId !== clientId) return false;
                // Filter by professional
                if (config.professionals.length > 0 && selectedProfId !== a.professionalId) return false;
                return true;
            })
            // Enrich appointments with patient data (name, phone) from patient records
            .map(a => {
                if (a.patientId) {
                    const linkedPatient = patients.find(p => p.id === a.patientId);
                    if (linkedPatient) {
                        return {
                            ...a,
                            clientName: linkedPatient.name, // Use updated patient name
                            phone: linkedPatient.phone || a.phone, // Use patient phone if available
                            whatsappName: linkedPatient.whatsappName || linkedPatient.name // Use WhatsApp name or fallback to name
                        };
                    }
                }
                return a;
            });
    }, [appointments, clientId, selectedProfId, config.professionals, patients]);

    // --- DATA SYNC (MULTI-TENANT FILTERING) ---
    useEffect(() => {
        if (!user || !clientId) return;

        console.log("Setting up Snapshots for Client:", clientId);

        // 1. CONFIG SYNC
        const unsubConfig = onSnapshot(doc(db, 'configs', clientId), (docSnap) => {
            if (docSnap.exists()) {
                const remoteConfig = docSnap.data() as AppConfig;
                setConfig({ ...DEFAULT_CONFIG, ...remoteConfig, clientId });
                if (remoteConfig.professionals && !remoteConfig.professionals.find(p => p.id === selectedProfId)) {
                    setSelectedProfId(remoteConfig.professionals[0]?.id || '1');
                }
            } else {
                console.log("No config found, creating default...");
                const initialConfig = { ...DEFAULT_CONFIG, clientId, organizationName: clientId.toUpperCase() };
                setDoc(doc(db, 'configs', clientId), initialConfig);
                setConfig(initialConfig);
            }
        });

        // 2. APPOINTMENTS SYNC - SECURED QUERY
        const qAppts = query(collection(db, 'appointments'), where('clientId', '==', clientId));
        const unsubAppts = onSnapshot(qAppts, (snapshot) => {
            const allAppts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
            setAppointments(allAppts);
        });

        // 3. PATIENTS SYNC - SECURED QUERY
        const qPatients = query(collection(db, 'patients'), where('clientId', '==', clientId));
        const unsubPatients = onSnapshot(qPatients, (snapshot) => {
            const allPatients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Patient[];
            setPatients(allPatients);
        });

        // 4. NOTES SYNC - SECURED QUERY
        const qNotes = query(collection(db, 'notes'), where('clientId', '==', clientId));
        const unsubNotes = onSnapshot(qNotes, (snapshot) => {
            const allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
            setNotes(allNotes);
        });

        return () => { unsubConfig(); unsubAppts(); unsubPatients(); unsubNotes(); };
    }, [user, clientId]);

    // --- DB ACTIONS WRAPPERS ---
    const dbSaveAppointment = async (appt: Appointment) => {
        if (!user || !clientId) return;
        const securedAppt = { ...appt, clientId };
        console.log("Saving Appointment:", securedAppt);
        try {
            await setDoc(doc(db, 'appointments', appt.id), securedAppt);
        } catch (e) { console.error("Save Appt Error:", e); }
    };

    const dbDeleteAppointment = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'appointments', id));
        } catch (e) { console.error("Delete Appt Error:", e); }
    };

    const dbSavePatient = async (patient: Patient) => {
        if (!user || !clientId) return;
        const securedPatient = { ...patient, clientId };
        console.log("Saving Patient:", securedPatient);
        try {
            await setDoc(doc(db, 'patients', patient.id), securedPatient);
        } catch (e) { console.error("Save Patient Error:", e); }
    };

    const dbDeletePatient = async (patientId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este paciente?')) return;

        const patientAppts = appointments.filter(a => a.patientId === patientId);
        const pendingAppts = patientAppts.filter(a => new Date(a.date + 'T' + a.time) >= new Date());

        if (pendingAppts.length > 0) {
            const confirmMsg = `El paciente tiene ${pendingAppts.length} turnos pendientes. \n\nSi eliminas al paciente, SE ELIMINARÁN TAMBIÉN SUS TURNOS PENDIENTES. \n\n¿Deseas continuar?`;
            if (!confirm(confirmMsg)) return;
        }

        try {
            // Delete patient
            await deleteDoc(doc(db, 'patients', patientId));

            // Delete associated appointments
            // Note: In a real app we might want batching, but loop is fine for MVP volume
            for (const appt of patientAppts) {
                await deleteDoc(doc(db, 'appointments', appt.id));
            }

            setToastMessage({ title: 'Eliminado', msg: 'Paciente y sus turnos eliminados', type: 'success' });
            setTimeout(() => setToastMessage(null), 3000);

        } catch (e) {
            console.error("Delete Patient Error:", e);
            setToastMessage({ title: 'Error', msg: 'No se pudo eliminar el paciente', type: 'error' });
        }
    };

    // @ts-ignore
    const dbSaveConfig = async (newConfig: AppConfig) => {
        if (!user || !clientId) return;

        // VALIDATION: Check for appointments outside new time range
        if (newConfig.startHour !== config.startHour || newConfig.endHour !== config.endHour) {
            const appointmentsOutOfRange = appointments.filter(apt => {
                const hour = parseInt(apt.time.split(':')[0]);
                return hour < (newConfig.startHour || 8) || hour >= (newConfig.endHour || 20);
            });

            if (appointmentsOutOfRange.length > 0) {
                const exampleCount = Math.min(5, appointmentsOutOfRange.length);
                const dateList = appointmentsOutOfRange
                    .slice(0, exampleCount)
                    .map(apt => `${apt.date} ${apt.time}`)
                    .join(', ');

                setToastMessage({
                    title: 'Error: Turnos fuera de rango',
                    msg: `Hay ${appointmentsOutOfRange.length} turno(s) agendado(s) fuera del nuevo rango horario. Ejemplos: ${dateList}${appointmentsOutOfRange.length > exampleCount ? '...' : ''}. No se puede cambiar el rango hasta que se modifiquen o eliminen estos turnos.`,
                    type: 'error'
                });
                setTimeout(() => setToastMessage(null), 10000);
                return;
            }
        }

        // Validation passed, save
        try {
            await setDoc(doc(db, 'configs', clientId), newConfig);
        } catch (e) { console.error("Save Config Error:", e); }
    };

    // --- NOTE CRUD OPERATIONS ---
    const dbSaveNote = async (note: Note) => {
        if (!user || !clientId) return;
        const securedNote = { ...note, clientId, professionalId: selectedProfId };
        console.log("Saving Note:", securedNote);
        try {
            await setDoc(doc(db, 'notes', note.id), securedNote);
            setToastMessage({ title: 'Guardado', msg: 'Nota guardada correctamente', type: 'success' });
            setTimeout(() => setToastMessage(null), 2000);
            setIsNoteModalOpen(false);
        } catch (e) {
            console.error("Save Note Error:", e);
            setToastMessage({ title: 'Error', msg: 'No se pudo guardar la nota', type: 'error' });
        }
    };

    const dbDeleteNote = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'notes', id));
            setToastMessage({ title: 'Eliminado', msg: 'Nota eliminada', type: 'success' });
            setTimeout(() => setToastMessage(null), 2000);
            setIsNoteModalOpen(false);
        } catch (e) {
            console.error("Delete Note Error:", e);
            setToastMessage({ title: 'Error', msg: 'No se pudo eliminar la nota', type: 'error' });
        }
    };

    // --- LOGIN HANDLER ---
    const handleLogin = (orgId: string) => {
        setClientId(orgId);
        localStorage.setItem('agenda_client_id', orgId); // SAVE
        setToastMessage({ title: 'Bienvenido', msg: `Sesión iniciada en: ${orgId}`, type: 'success' });
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleLogout = () => {
        if (confirm('¿Cerrar sesión de la organización?')) {
            setClientId(null);
            localStorage.removeItem('agenda_client_id'); // CLEAR
            setAppointments([]);
            setPatients([]);
            setConfig(DEFAULT_CONFIG);
        }
    };

    // --- RENDERERS ---

    // Derived state

    const currentProfessional = config.professionals.find(p => p.id === selectedProfId) || config.professionals[0] || { name: 'Cargando...', id: '0', title: '' };
    const currentTheme = APP_THEMES[config.theme];

    // --- SUB-COMPONENT: TOP BAR ---
    const renderTopBar = () => (
        <div className="bg-white shadow-md z-20 px-4 py-3 flex flex-col gap-3 shrink-0">
            {/* Row 1: Professional */}
            <div className="flex justify-between items-center">
                <div className="relative group flex-1">
                    <button className="flex items-center gap-2 font-bold text-slate-700 bg-slate-100 px-2 py-2 rounded-lg pr-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {currentProfessional.avatar && currentProfessional.avatar.trim() !== '' ? (
                                <img
                                    src={currentProfessional.avatar}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-xs text-slate-500 font-bold">{getInitials(currentProfessional.name)}</span>
                            )}
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-slate-400 uppercase font-bold leading-none">{config.organizationName}</span>
                            <span className="truncate max-w-[150px] text-sm">{currentProfessional.name}</span>
                        </div>
                    </button>
                    {/* Prof Switcher */}
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-50 overflow-hidden">
                        <div className="p-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase">Seleccionar Profesional</div>
                        {config.professionals.map(p => (
                            <button key={p.id} onClick={() => setSelectedProfId(p.id)} className={`w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 ${selectedProfId === p.id ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    {p.avatar && p.avatar.trim() !== '' ? (
                                        <img
                                            src={p.avatar}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-slate-500 font-bold">{getInitials(p.name)}</span>
                                    )}
                                </div>
                                <span className="flex-1 truncate">{p.name}</span>
                                {selectedProfId === p.id && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Logout on right side of Row 1 */}
                <button onClick={handleLogout} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-red-50 hover:text-red-500 shrink-0"><LogOut size={18} /></button>
            </div>

            {/* Row 2: Action Buttons */}
            <div className="flex items-center justify-center gap-3">
                {/* NOTIFICATIONS BELL */}
                <div className="relative shrink-0">
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 relative"
                    >
                        <Bell size={20} />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>

                    {/* DROPDOWN - FIXED POSITION FOR MOBILE */}
                    {isNotificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsNotificationsOpen(false)} />
                            <div className="fixed left-4 right-4 top-32 md:absolute md:top-full md:left-auto md:right-0 md:w-80 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in-up">
                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <span className="font-bold text-sm text-slate-700">Notificaciones</span>
                                    {notifications.length > 0 && (
                                        <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:underline">
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-xs italic">
                                            No hay notificaciones nuevas
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                                                    <span className="text-[10px] text-slate-400">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 mb-2">{n.msg}</p>
                                                {n.actionLabel && (
                                                    <button
                                                        onClick={() => {
                                                            if (n.onAction) n.onAction();
                                                            setIsNotificationsOpen(false);
                                                        }}
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                                    >
                                                        {n.actionLabel} →
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button onClick={() => setCurrentDate(new Date())} className={`${currentTheme.primary} text-white px-4 py-2 rounded-lg text-sm font-bold shadow shrink-0`}>Hoy</button>

                {/* HELP BUTTON */}
                <button
                    onClick={() => setIsHelpModalOpen(true)}
                    className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0"
                    title="Ayuda / Guía de Uso"
                >
                    <HelpCircle size={20} />
                </button>


            </div>


            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <button onClick={() => {
                    const d = new Date(currentDate);
                    if (view === 'month') d.setMonth(d.getMonth() - 1);
                    else if (view === 'week') d.setDate(d.getDate() - 7);
                    else d.setDate(d.getDate() - 1);
                    setCurrentDate(d);
                }}><ChevronLeft size={20} /></button>
                <div className="relative group cursor-pointer">
                    <span className="text-sm font-bold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">
                        {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <input
                        type="date"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        value={formatDateKey(currentDate)}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            setCurrentDate(new Date(y, m - 1, d));
                        }}
                    />
                </div>
                <button onClick={() => {
                    const d = new Date(currentDate);
                    if (view === 'month') d.setMonth(d.getMonth() + 1);
                    else if (view === 'week') d.setDate(d.getDate() + 7);
                    else d.setDate(d.getDate() + 1);
                    setCurrentDate(d);
                }}><ChevronRight size={20} /></button>
            </div>
        </div>
    );







    // --- SUB-COMPONENT: PATIENTS VIEW (RECONSTRUCTED) ---
    const renderPatientsView = () => {
        const filteredPatients = patients
            .filter(p => p.name.toLowerCase().includes(patientFilter.toLowerCase()) || p.phone.includes(patientFilter))
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className="h-full flex flex-col bg-slate-50">
                <div className="bg-white p-4 shadow-sm z-10 flex gap-4 items-center">
                    <div className="flex-1 flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                        <Search size={20} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar paciente por nombre o teléfono..."
                            className="bg-transparent outline-none w-full"
                            value={patientFilter}
                            onChange={(e) => setPatientFilter(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingPatient(null); setIsPatientModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Nuevo Paciente</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPatients.map(p => (
                            <div key={p.id} onClick={() => { setEditingPatient(p); setIsPatientModalOpen(true); }} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-slate-100 group relative overflow-hidden">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div className="flex gap-2">
                                        {/* WhatsApp Button */}
                                        {p.phone && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = createWhatsAppLink(p.phone);
                                                }}
                                                className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                                title="Chat WhatsApp"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                                </svg>
                                            </button>
                                        )}
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                dbDeletePatient(p.id);
                                            }}
                                            className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            title="Eliminar Paciente"
                                        >
                                            <Trash size={16} />
                                        </button>
                                        {/* Schedule Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
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
                                                    date: new Date().toISOString().split('T')[0],
                                                    time: '09:00',
                                                    duration: config.slotDuration || 30,
                                                    typeId: config.types[0]?.id || '',
                                                    isNewPatient: false,
                                                    notes: ''
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            title="Agendar Turno"
                                        >
                                            <CalendarPlus size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 truncate text-lg">{p.name}</h3>
                                <p className="text-sm text-slate-500 mb-2 font-mono flex items-center gap-1">
                                    <Phone size={12} /> {p.phone}
                                </p>
                                <div className="text-xs bg-slate-50 rounded px-2 py-1 inline-block text-slate-400">
                                    Ultima visita: <span className="font-medium text-slate-600">{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // --- STARTUP CHECK ---
    useEffect(() => {
        // Run once on mount (or when appointments load initially)
        if (appointments.length > 0) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowKey = formatDateKey(tomorrow);

            const pendingTomorrow = appointments.filter(a => a.date === tomorrowKey && !a.reminderSent && a.clientId === clientId).length;

            if (pendingTomorrow > 0) {
                const notif: Notification = {
                    id: 'pending-reminders-' + formatDateKey(tomorrow),
                    title: 'Recordatorios Pendientes',
                    msg: `Tenés ${pendingTomorrow} mensajes para mañana`,
                    timestamp: new Date(),
                    read: false,
                    type: 'warning',
                    actionLabel: 'Ir a Mensajes',
                    onAction: () => setView('messages')
                };

                // Add to notifications if not exists
                setNotifications(prev => {
                    if (prev.some(n => n.id === notif.id)) return prev;
                    return [notif, ...prev];
                });

                // Show toast ONLY if not dismissed in session
                if (!sessionStorage.getItem('startupCheckDismissed')) {
                    setToastMessage({
                        title: notif.title,
                        msg: notif.msg,
                        type: 'warning',
                        actionLabel: 'Ocultar', // Changed to "Hide"
                        onAction: () => { } // Just dismiss
                    });
                    sessionStorage.setItem('startupCheckDismissed', 'true');
                }
            }
        }
    }, [appointments.length]); // Simple dependency to trigger once loaded

    // --- MAIN RENDER ---
    if (!clientId) {
        return (
            <>
                <LoginScreen onLogin={handleLogin} onHelp={() => setIsHelpModalOpen(true)} />
                {isHelpModalOpen && (
                    <HelpModal onClose={() => setIsHelpModalOpen(false)} />
                )}
            </>
        );
    }

    return (
        <div className={`flex h-screen w-full bg-slate-50 ${currentTheme.text} overflow-hidden`}>
            {/* Sidebar - hidden when AI assistant is active */}
            {!isDrivingMode && <div className={`w-20 ${currentTheme.primary} flex flex-col items-center py-6 gap-6 shrink-0 overflow-y-auto`}>
                {/* AI Assistant Toggle (Sidebar) */}
                <button
                    onClick={() => setDrivingMode(!isDrivingMode)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all ${isDrivingMode ? 'ring-4 ring-indigo-400 shadow-lg scale-110' : 'hover:scale-105 hover:shadow-lg'}`}
                    title="Asistente IA"
                >
                    <img src="/ai-avatar.jpg" alt="IA" className="w-full h-full rounded-full object-cover border-2 border-white/30" />
                </button>

                <button onClick={() => setView('day')} title="Día" className={`p-3 rounded-xl transition-all ${view === 'day' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}>
                    <Clock size={24} />
                </button>
                <button onClick={() => setView('week')} title="Semana" className={`p-3 rounded-xl transition-all ${view === 'week' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}>
                    <Grid size={24} />
                </button>
                <button onClick={() => setView('month')} title="Mes" className={`p-3 rounded-xl transition-all ${view === 'month' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}>
                    <CalendarIcon size={24} />
                </button>
                <button onClick={() => setView('patients')} title="Pacientes" className={`p-3 rounded-xl transition-all ${view === 'patients' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}>
                    <Users size={24} />
                </button>
                <button
                    onClick={() => setView('messages')}
                    className={`p-3 rounded-xl transition-all ${view === 'messages' ? 'bg-white text-green-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                    title="Mensajes"
                >
                    <MessageSquare size={24} />
                </button>
                <button
                    onClick={() => setView('notes')}
                    className={`p-3 rounded-xl transition-all ${view === 'notes' ? 'bg-white text-orange-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                    title="Notas y Recordatorios"
                >
                    <StickyNote size={24} />
                </button>

                <div className="mt-auto flex flex-col gap-4">
                    <button
                        onClick={() => setView('config')}
                        className={`p-3 rounded-xl transition-all ${view === 'config' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/70 hover:bg-white/10'}`}
                        title="Configuración"
                    >
                        <Settings size={24} />
                    </button>
                </div>
            </div>}

            {/* Main Content - hidden when AI assistant is active */}
            {!isDrivingMode && <div className="flex-1 flex flex-col overflow-hidden relative">
                {renderTopBar()}

                <div className="flex-1 overflow-hidden relative">
                    {view === 'config' && (
                        <ConfigScreen
                            config={config}
                            onSave={(newConfig) => {
                                setConfig(newConfig);
                                dbSaveConfig(newConfig);
                                setView('day');
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
                            onDayClick={(dateKey) => {
                                setSelectedNoteDate(dateKey);
                                setEditingNote(null);
                                setIsNoteModalOpen(true);
                            }}
                            onNoteClick={(note) => {
                                setEditingNote(note);
                                setIsNoteModalOpen(true);
                            }}
                            country={config.country}
                        />
                    )}

                    {view === 'day' && (
                        <DayView
                            currentDate={currentDate}
                            appointments={filteredAppointments}
                            config={config}
                            onSlotClick={(time) => {
                                setSelectedSlot({ date: formatDateKey(currentDate), time });
                                setEditingAppointment(null);
                                setIsModalOpen(true);
                            }}
                            onAppointmentClick={(appt) => {
                                setEditingAppointment(appt);
                                setIsModalOpen(true);
                            }}
                        />
                    )}
                    {view === 'week' && (
                        <WeekView
                            currentDate={currentDate}
                            appointments={filteredAppointments}
                            config={config}
                            onSlotClick={(date, time) => {
                                setSelectedSlot({ date, time });
                                setEditingAppointment(null);
                                setIsModalOpen(true);
                            }}
                            onAppointmentClick={(appt) => {
                                setEditingAppointment(appt);
                                setIsModalOpen(true);
                            }}
                        />
                    )}
                    {view === 'month' && (
                        <MonthView
                            currentDate={currentDate}
                            appointments={filteredAppointments}
                            config={config}
                            onDayClick={(date) => setSelectedDayDetail(date)}
                            onAppointmentClick={(appt) => {
                                setEditingAppointment(appt);
                                setIsModalOpen(true);
                            }}
                        />
                    )}
                    {view === 'patients' && renderPatientsView()}

                    {/* Floating Add Button */}
                    {view !== 'patients' && (
                        <button
                            onClick={() => {
                                setEditingAppointment(null);
                                setIsModalOpen(true);
                            }}
                            className={`absolute bottom-8 right-8 w-14 h-14 ${currentTheme.primary} text-white rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20`}
                        >
                            <Plus size={32} />
                        </button>
                    )}
                </div>
            </div>}

            {/* AI ASSISTANT OVERLAY - at root level for proper z-index coverage */}
            {isDrivingMode && (
                <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 transition-all duration-300">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`rounded-full p-1 ${agentState === 'IDLE' ? 'bg-slate-800' : 'bg-indigo-500 animate-pulse'}`}>
                            <img src="/ai-avatar.jpg" alt="IA" className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-3xl font-bold text-white">Asistente IA</h2>
                            <p className="text-gray-400 text-lg">
                                {agentState === 'IDLE' ? 'Escuchando... (Haz silencio para enviar)' :
                                    agentState === 'LISTENING_COMMAND' ? 'Escuchando orden...' :
                                        'Confirmando...'}
                            </p>
                        </div>
                    </div>

                    {/* Chat History */}
                    <div className="w-full max-w-lg h-64 overflow-y-auto bg-gray-900 rounded-xl p-4 mb-8 border border-gray-800 space-y-4 shadow-inner">
                        {messages.length === 0 && <p className="text-gray-600 text-center italic mt-10">Historial vacío...</p>}
                        {messages.filter(m => m.role !== 'system').map((m, i) => (
                            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <span className="text-xs text-gray-500 mb-1 uppercase">{m.role}</span>
                                <div className={`p-3 rounded-lg max-w-[90%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' :
                                    m.role === 'system' ? 'bg-red-900/50 text-red-200 border border-red-800' :
                                        m.role === 'tool' ? 'bg-slate-800 text-slate-300 font-mono text-xs' :
                                            'bg-gray-700 text-white'
                                    }`}>
                                    {m.content?.toString() || (m.tool_calls ? "🛠️ (Herramienta)" : "")}
                                </div>
                            </div>
                        ))}
                        {/* Live Transcript (Ghost Text) */}
                        {isListening && transcript && agentState !== 'IDLE' && (
                            <div className="flex flex-col items-end opacity-50">
                                <span className="text-xs text-gray-500 mb-1">Escuchando...</span>
                                <div className="p-3 rounded-lg bg-gray-800 text-gray-300 italic border border-dashed border-gray-600">
                                    {transcript}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Exit */}
                    <button
                        onClick={() => setDrivingMode(false)}
                        className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xl flex items-center gap-3 transition-colors shadow-lg"
                    >
                        <X className="w-6 h-6" />
                        Salir
                    </button>
                </div>
            )}

            {/* Day Details Modal (Month View Interaction) */}
            {selectedDayDetail && (
                <DayDetailsModal
                    date={selectedDayDetail}
                    appointments={filteredAppointments.filter(a => a.date === selectedDayDetail)}
                    config={config}
                    onClose={() => setSelectedDayDetail(null)}
                    onEdit={(appt) => {
                        setEditingAppointment(appt);
                        setIsModalOpen(true);
                    }}
                    onAdd={() => {
                        setSelectedSlot({ date: selectedDayDetail, time: '09:00' });
                        setIsModalOpen(true);
                    }}
                />
            )}

            {/* Modals */}
            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(appt: Appointment) => {
                    dbSaveAppointment(appt);
                    setIsModalOpen(false);
                    // Minimal feedback
                    setToastMessage({ title: 'Guardado', msg: 'Turno agendado correctamente', type: 'success' });
                    setTimeout(() => setToastMessage(null), 3000);
                }}
                onDelete={(id: string) => {
                    dbDeleteAppointment(id);
                    setIsModalOpen(false);
                }}
                initialData={editingAppointment}
                selectedSlot={selectedSlot || { date: formatDateKey(currentDate), time: '09:00' }}
                types={config.types}
                professionalId={selectedProfId}
                clientId={clientId}
                patients={patients}
                dbSavePatient={dbSavePatient}
                confirmTemplate={config.whatsappConfirmTemplate}
                professionalName={config.professionals.find(p => p.id === selectedProfId)?.name || ''}
            />

            <PatientModal
                isOpen={isPatientModalOpen}
                onClose={() => setIsPatientModalOpen(false)}
                onSave={(p: Patient) => {
                    dbSavePatient(p);
                    setIsPatientModalOpen(false);
                }}
                initialData={editingPatient}
                clientId={clientId}
            />

            <NoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSave={(note: Note) => {
                    dbSaveNote(note);
                }}
                onDelete={(id: string) => {
                    dbDeleteNote(id);
                }}
                initialData={editingNote}
                selectedDate={selectedNoteDate}
                professionalId={selectedProfId}
                clientId={clientId}
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce ${toastMessage.type === 'error' ? 'bg-red-600 text-white' : toastMessage.type === 'warning' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-white'}`}>
                    {toastMessage.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <div>
                        <div className="font-bold text-sm">{toastMessage.title}</div>
                        <div className="text-xs opacity-90">{toastMessage.msg}</div>
                    </div>
                    {toastMessage.actionLabel && (
                        <button
                            onClick={() => {
                                if (toastMessage.onAction) toastMessage.onAction();
                                setToastMessage(null);
                            }}
                            className="bg-white text-slate-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-100"
                        >
                            {toastMessage.actionLabel}
                        </button>
                    )}
                </div>
            )}
            {isHelpModalOpen && (
                <HelpModal onClose={() => setIsHelpModalOpen(false)} />
            )}
        </div>
    );
}
