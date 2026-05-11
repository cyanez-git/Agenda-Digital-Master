import * as admin from 'firebase-admin';
import { db } from '../db';
import { checkOverlap, generateTimeSlots, isWithinWorkingHours } from '../utils/dateUtils';

export const getAppointments = async (clientId: string, date: string, professionalId?: string) => {
    console.log(`[DB] Querying Appts: Client=${clientId} Date=${date} Prof=${professionalId} (Type: ${typeof professionalId})`);

    let q = db.collection("appointments")
        .where("clientId", "==", clientId)
        .where("date", "==", date);

    // Filter by Professional: Handle String/Number mismatch by checking types logic if needed, 
    // but for now relying on exact match.
    if (professionalId) q = q.where("professionalId", "==", professionalId);

    const snapshot = await q.get();
    console.log(`[DB] Found ${snapshot.size} docs.`);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // DEEP DEBUG: If we expected results but got none, let's see what IS in the DB for this client.
    if (results.length === 0) {
        console.log(`[DB] No appts for ${date}. Checking if client ${clientId} has ANY appts...`);
        const anyAppts = await db.collection("appointments")
            .where("clientId", "==", clientId)
            .limit(3)
            .get();

        if (anyAppts.empty) {
            console.log(`[DB] Client ${clientId} has ZERO appointments in total.`);
        } else {
            console.log(`[DB] Client has some appts. Examples:`, anyAppts.docs.map(d => ({ date: d.data().date, id: d.id, profId: d.data().professionalId })));
        }
    }

    return results;
};

export const getAvailableSlots = async (clientId: string, date: string, professionalId?: string) => {
    const configSnap = await db.collection("configs").doc(clientId).get();
    const config = configSnap.data() || {};
    const step = config.gridStep || 30;
    const defaultDuration = config.slotDuration || 30;

    const existingAppts = await getAppointments(clientId, date, professionalId);

    // Simple slot generation
    const allSlots = generateTimeSlots(step);

    // Filter by working hours and overlaps
    const available = allSlots.filter(time => {
        // 1. Working Hours
        if (!isWithinWorkingHours(time, defaultDuration)) return false;

        // 2. Overlap
        const isBlocked = checkOverlap(existingAppts, date, time, defaultDuration);
        return !isBlocked;
    });

    return available;
};

export const createAppointment = async (clientId: string, data: any) => {
    // Basic validation
    if (!data.professionalId || !data.date || !data.time || !data.clientName) {
        throw new Error("Faltan datos requeridos (profesional, fecha, hora, nombre)");
    }

    const configSnap = await db.collection("configs").doc(clientId).get();
    const config = configSnap.data() || {};
    const duration = data.duration || config.slotDuration || 30;

    // Check Availability Code Duplication (Improve later)
    const q = db.collection("appointments")
        .where("clientId", "==", clientId)
        .where("professionalId", "==", data.professionalId)
        .where("date", "==", data.date);

    const snap = await q.get();
    const existing = snap.docs.map(d => d.data());

    if (checkOverlap(existing, data.date, data.time, duration)) {
        throw new Error("El horario seleccionado ya no está disponible.");
    }

    // Create
    const newAppt = {
        id: db.collection("appointments").doc().id,
        clientId,
        ...data,
        duration,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("appointments").doc(newAppt.id).set(newAppt);
    return newAppt;
};

export const moveAppointment = async (clientId: string, appointmentId: string, newDate: string, newTime: string) => {
    // 1. Get Old
    const apptRef = db.collection("appointments").doc(appointmentId);
    const apptSnap = await apptRef.get();
    if (!apptSnap.exists) throw new Error("Turno no encontrado");

    const appt = apptSnap.data();

    // Check Availability for NEW slot
    const configSnap = await db.collection("configs").doc(clientId).get();
    const config = configSnap.data() || {};
    const duration = appt?.duration || config.slotDuration || 30;

    const existingAppts = await getAppointments(clientId, newDate, appt?.professionalId);
    if (checkOverlap(existingAppts, newDate, newTime, duration)) {
        throw new Error("El nuevo horario no está disponible.");
    }

    // Update
    await apptRef.update({
        date: newDate,
        time: newTime,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { ...appt, date: newDate, time: newTime };
};

export const deleteAppointment = async (clientId: string, appointmentId: string) => {
    const apptRef = db.collection("appointments").doc(appointmentId);
    const apptSnap = await apptRef.get();

    if (!apptSnap.exists) throw new Error("Turno no encontrado");

    const appt = apptSnap.data();

    // Verify it belongs to this client
    if (appt?.clientId !== clientId) {
        throw new Error("Turno no encontrado para este cliente");
    }

    await apptRef.delete();

    return { deleted: true, clientName: appt?.clientName, date: appt?.date, time: appt?.time };
};

export const getDebugAppointments = async (clientId: string) => {
    // 2. Intelligent Debug: Find NEAREST future appointment for this Client
    // This helps clarify if the DB is empty or just the specific date is empty.
    const futureSnap = await db.collection("appointments")
        .where("clientId", "==", clientId)
        .where("date", ">=", new Date().toISOString().split('T')[0])
        .orderBy("date", "asc")
        .limit(3)
        .get();

    if (!futureSnap.empty) {
        return futureSnap.docs.map(d => `FOUND (Future): ${d.data().date} ${d.data().time} (${d.data().title || 'Turno'})`);
    }

    // 3. Fallback: Dump random docs to see if DB is wrong
    const globalSnap = await db.collection("appointments").limit(3).get();
    if (globalSnap.empty) {
        return [`DB COMPLETELY EMPTY. (Queried for: ${clientId})`];
    }

    return globalSnap.docs.map(d => `OTHER CLIENT DATA: ${d.data().date} (Client: ${d.data().clientId}) [Queried: ${clientId}]`);
};
