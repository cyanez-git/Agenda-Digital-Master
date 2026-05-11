import type { AppConfig } from './types';

export const APP_THEMES = {
    blue:   { primary: 'bg-blue-600',   secondary: 'bg-blue-50',   text: 'text-slate-800',  border: 'border-blue-200'   },
    teal:   { primary: 'bg-teal-600',   secondary: 'bg-teal-50',   text: 'text-teal-900',   border: 'border-teal-200'   },
    violet: { primary: 'bg-violet-600', secondary: 'bg-violet-50', text: 'text-violet-900', border: 'border-violet-200' },
    slate:  { primary: 'bg-slate-700',  secondary: 'bg-slate-100', text: 'text-slate-900',  border: 'border-slate-200'  },
    indigo: { primary: 'bg-indigo-600', secondary: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
    rose:   { primary: 'bg-rose-600',   secondary: 'bg-rose-50',   text: 'text-rose-900',   border: 'border-rose-200'   },
} as const;

export type ViewMode = 'day' | 'week' | 'month' | 'patients' | 'config' | 'messages' | 'notes';

export const DEFAULT_CONFIG: AppConfig = {
    clientId: '',
    organizationName: 'Mi Consultorio',
    theme: 'blue',
    country: 'AR',
    types: [
        { id: '1', label: 'Consulta General', duration: 30, colorKey: 'blue' },
        { id: '2', label: 'Primera Vez',       duration: 60, colorKey: 'green' },
    ],
    professionals: [
        { id: '1', name: 'Dr. Principal', title: 'Especialista' },
    ],
    slotDuration: 30,
    gridStep: 30,
    whatsappConfirmTemplate: 'Hola {paciente}, confirmamos tu turno para el {fecha} a las {hora} con {profesional}.',
    whatsappReminderTemplate: 'Hola {paciente}, recordá tu turno para {fecha} a las {hora} con {profesional}.',
    startHour: 8,
    endHour: 20,
};
