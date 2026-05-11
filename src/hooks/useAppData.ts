import { useState, useEffect } from 'react';
import {
    collection, setDoc, deleteDoc, onSnapshot, doc, query, where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CONFIG } from '../constants';
import type { Appointment, Patient, AppConfig, Note, ToastMessage } from '../types';

interface UseAppDataParams {
    user: any;
    clientId: string | null;
    selectedProfId: string;
    setSelectedProfId: (id: string) => void;
    onToast: (msg: ToastMessage | null) => void;
}

export const useAppData = ({
    user,
    clientId,
    selectedProfId,
    setSelectedProfId,
    onToast,
}: UseAppDataParams) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
    const [notes, setNotes] = useState<Note[]>([]);

    // --- FIRESTORE LISTENERS ---
    useEffect(() => {
        if (!user || !clientId) return;

        const unsubConfig = onSnapshot(doc(db, 'configs', clientId), (snap) => {
            if (snap.exists()) {
                const remote = snap.data() as AppConfig;
                setConfig({ ...DEFAULT_CONFIG, ...remote, clientId });
                if (remote.professionals && !remote.professionals.find(p => p.id === selectedProfId)) {
                    setSelectedProfId(remote.professionals[0]?.id || '1');
                }
            } else {
                const initial = { ...DEFAULT_CONFIG, clientId, organizationName: clientId.toUpperCase() };
                setDoc(doc(db, 'configs', clientId), initial);
                setConfig(initial);
            }
        });

        const unsubAppts = onSnapshot(
            query(collection(db, 'appointments'), where('clientId', '==', clientId)),
            (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[])
        );

        const unsubPatients = onSnapshot(
            query(collection(db, 'patients'), where('clientId', '==', clientId)),
            (snap) => setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[])
        );

        const unsubNotes = onSnapshot(
            query(collection(db, 'notes'), where('clientId', '==', clientId)),
            (snap) => setNotes(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Note[])
        );

        return () => { unsubConfig(); unsubAppts(); unsubPatients(); unsubNotes(); };
    }, [user, clientId]);

    // --- DB ACTIONS ---
    const dbSaveAppointment = async (appt: Appointment) => {
        if (!user || !clientId) return;
        try {
            await setDoc(doc(db, 'appointments', appt.id), { ...appt, clientId });
        } catch (e) {
            console.error('[dbSaveAppointment]', e);
        }
    };

    const dbDeleteAppointment = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'appointments', id));
        } catch (e) {
            console.error('[dbDeleteAppointment]', e);
        }
    };

    const dbSavePatient = async (patient: Patient) => {
        if (!user || !clientId) return;
        try {
            await setDoc(doc(db, 'patients', patient.id), { ...patient, clientId });
        } catch (e) {
            console.error('[dbSavePatient]', e);
        }
    };

    const dbDeletePatient = async (patientId: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este paciente?')) return;

        const patientAppts = appointments.filter(a => a.patientId === patientId);
        const pending = patientAppts.filter(a => new Date(a.date + 'T' + a.time) >= new Date());

        if (pending.length > 0) {
            const msg = `El paciente tiene ${pending.length} turno(s) pendiente(s).\n\nSE ELIMINARÁN TAMBIÉN. ¿Deseas continuar?`;
            if (!confirm(msg)) return;
        }

        try {
            await deleteDoc(doc(db, 'patients', patientId));
            for (const appt of patientAppts) {
                await deleteDoc(doc(db, 'appointments', appt.id));
            }
            onToast({ title: 'Eliminado', msg: 'Paciente y sus turnos eliminados', type: 'success' });
        } catch (e) {
            console.error('[dbDeletePatient]', e);
            onToast({ title: 'Error', msg: 'No se pudo eliminar el paciente', type: 'error' });
        }
    };

    const dbSaveConfig = async (newConfig: AppConfig) => {
        if (!user || !clientId) return;

        if (newConfig.startHour !== config.startHour || newConfig.endHour !== config.endHour) {
            const outOfRange = appointments.filter(apt => {
                const hour = parseInt(apt.time.split(':')[0]);
                return hour < (newConfig.startHour || 8) || hour >= (newConfig.endHour || 20);
            });

            if (outOfRange.length > 0) {
                const examples = outOfRange.slice(0, 5).map(a => `${a.date} ${a.time}`).join(', ');
                onToast({
                    title: 'Error: Turnos fuera de rango',
                    msg: `Hay ${outOfRange.length} turno(s) fuera del nuevo rango. Ej: ${examples}. Modificalos antes de cambiar el horario.`,
                    type: 'error',
                });
                return false;
            }
        }

        try {
            await setDoc(doc(db, 'configs', clientId), newConfig);
            return true;
        } catch (e) {
            console.error('[dbSaveConfig]', e);
            return false;
        }
    };

    const dbSaveNote = async (note: Note): Promise<boolean> => {
        if (!user || !clientId) return false;
        try {
            await setDoc(doc(db, 'notes', note.id), { ...note, clientId });
            onToast({ title: 'Guardado', msg: 'Nota guardada correctamente', type: 'success' });
            return true;
        } catch (e) {
            console.error('[dbSaveNote]', e);
            onToast({ title: 'Error', msg: 'No se pudo guardar la nota', type: 'error' });
            return false;
        }
    };

    const dbDeleteNote = async (id: string): Promise<boolean> => {
        try {
            await deleteDoc(doc(db, 'notes', id));
            onToast({ title: 'Eliminado', msg: 'Nota eliminada', type: 'success' });
            return true;
        } catch (e) {
            console.error('[dbDeleteNote]', e);
            onToast({ title: 'Error', msg: 'No se pudo eliminar la nota', type: 'error' });
            return false;
        }
    };

    return {
        appointments,
        setAppointments,
        patients,
        config,
        setConfig,
        notes,
        dbSaveAppointment,
        dbDeleteAppointment,
        dbSavePatient,
        dbDeletePatient,
        dbSaveConfig,
        dbSaveNote,
        dbDeleteNote,
    };
};
