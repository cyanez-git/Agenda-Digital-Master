export interface AppointmentType {
    id: string;
    label: string;
    duration: number; // in minutes
    colorKey: string;
    price?: number;
}

export interface Professional {
    id: string;
    name: string;
    title?: string;
    avatar?: string;
}

// Minimal theme type since APP_THEMES is in App.tsx (or move it?)
// For now, let's keep it simple string or specific keys if we move APP_THEMES
export type AppThemeKey = 'blue' | 'teal' | 'violet' | 'slate';

export interface AppConfig {
    clientId: string;
    organizationName: string;
    theme: AppThemeKey;
    types: AppointmentType[];
    professionals: Professional[];
    slotDuration: number;
    gridStep: number;
    whatsappConfirmTemplate: string;
    whatsappReminderTemplate: string;
    country: string; // 'AR', 'MX', etc.
    startHour: number; // Schedule start hour (0-23), default: 8
    endHour: number;   // Schedule end hour (0-23), default: 20
}

export interface Patient {
    id: string;
    clientId: string;
    name: string;
    dni?: string;
    email?: string;
    phone: string;
    whatsappName?: string; // Custom name for WhatsApp messages, defaults to name if not set
    birthDate?: string;
    firstVisit: string;
    lastVisit: string;
    notes?: string;
}

export interface Appointment {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    clientName: string;
    patientId?: string;
    dni?: string;
    email?: string;
    phone?: string;
    whatsappName?: string; // Custom name for WhatsApp messages
    date: string;
    time: string;
    duration: number;
    typeId: string;
    isNewPatient: boolean;
    notes?: string;
    reminderSent?: boolean;
}

export interface Note {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    content: string;
    date: string; // YYYY-MM-DD format
    createdAt: string;
    updatedAt: string;
}
