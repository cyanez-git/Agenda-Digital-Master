export interface AppointmentType {
    id: string;
    label: string;
    duration: number;
    colorKey: string;
    price?: number;
}

export interface Professional {
    id: string;
    name: string;
    title?: string;
    avatar?: string;
}

export type AppThemeKey = 'blue' | 'teal' | 'violet' | 'slate' | 'indigo' | 'rose';

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
    country: string;
    startHour: number;
    endHour: number;
}

export interface Patient {
    id: string;
    clientId: string;
    name: string;
    dni?: string;
    email?: string;
    phone: string;
    whatsappName?: string;
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
    whatsappName?: string;
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
    date: string;
    createdAt: string;
    updatedAt: string;
}

export interface ToastMessage {
    title: string;
    msg: string;
    type?: 'info' | 'error' | 'success' | 'warning';
    actionLabel?: string;
    onAction?: () => void;
}

export interface AppNotification {
    id: string;
    title: string;
    msg: string;
    timestamp: Date;
    read: boolean;
    type: 'info' | 'success' | 'warning' | 'error';
    actionLabel?: string;
    onAction?: () => void;
}
