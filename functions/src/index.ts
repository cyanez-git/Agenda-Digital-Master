import 'dotenv/config'; // Load .env
import { transcribeAudioBuffer } from "./ai/transcription";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { generateTimeSlots, checkOverlap, isWithinWorkingHours } from "./utils/dateUtils";
import { db } from "./db"; // Ensures init runs

// admin.initializeApp(); // Handled in db.ts

const app = express();
app.use(cors({ origin: true }));

// --- TYPES ---
interface AppointmentRequest {
    professionalId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    clientName: string;
    phone: string;
    typeId: string;
    duration?: number;
}

// --- MIDDLEWARE: API KEY AUTH ---
// For now, we use a simple hardcoded check or environment variable.
// In production, use "api_keys" collection.
const validateApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.headers['x-api-key'];
    // TODO: Move to Firestore or Secrets Manager. 
    // Hardcoded for MVP as per plan. 
    const VALID_KEY = "agenda-digital-secret-key-123";

    if (!key || key !== VALID_KEY) {
        res.status(401).json({ error: "Unauthorized: Invalid API Key" });
        return;
    }
    next();
};

app.use(validateApiKey);

// --- ENDPOINTS ---

// 1. GET APPOINTMENTS
app.get("/v1/:clientId/appointments", async (req: express.Request, res: express.Response) => {
    const { clientId } = req.params;
    const { date, phone, professionalId } = req.query;

    try {
        let q = db.collection("appointments").where("clientId", "==", clientId);

        if (date) q = q.where("date", "==", date);
        if (phone) q = q.where("phone", "==", phone);
        if (professionalId) q = q.where("professionalId", "==", professionalId);

        const snapshot = await q.get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ data });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 1.5 GET PROFESSIONALS
app.get("/v1/:clientId/professionals", async (req: express.Request, res: express.Response) => {
    const { clientId } = req.params;
    try {
        const configSnap = await db.collection("configs").doc(clientId).get();
        if (!configSnap.exists) {
            res.status(404).json({ error: "Client Config not found" });
            return;
        }
        const config = configSnap.data() || {};
        const professionals = config.professionals || [];

        // Return public info only
        const publicProfs = professionals.map((p: any) => ({
            id: p.id,
            name: p.name,
            specialty: p.specialty,
            avatar: p.avatar
        }));

        res.json({ data: publicProfs });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 2. GET AVAILABLE SLOTS (Logic Heavy)
app.get("/v1/:clientId/slots", async (req: express.Request, res: express.Response) => {
    const { clientId } = req.params;
    const { date, professionalId } = req.query; // Required

    if (!date || typeof date !== 'string') {
        res.status(400).json({ error: "Missing 'date' parameter (YYYY-MM-DD)" });
        return;
    }

    try {
        // A. Get Config for gridStep/Duration
        const configSnap = await db.collection("configs").doc(clientId).get();
        if (!configSnap.exists) {
            res.status(404).json({ error: "Client Config not found" });
            return;
        }
        const config = configSnap.data() || {};
        const step = config.gridStep || 30;
        const defaultDuration = config.slotDuration || 30;

        // B. Get Existing Appointments
        let q = db.collection("appointments")
            .where("clientId", "==", clientId)
            .where("date", "==", date);

        if (professionalId) q = q.where("professionalId", "==", professionalId);

        const apptSnap = await q.get();
        const existingAppts = apptSnap.docs.map(d => d.data());

        // C. Calculate Slots
        const allSlots = generateTimeSlots(step);
        const availableSlots = allSlots.filter(time => {
            // Check Overlap
            const isBlocked = checkOverlap(existingAppts, date, time, defaultDuration);
            return !isBlocked;
        });

        res.json({ date, availableSlots });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 3. CREATE APPOINTMENT
app.post("/v1/:clientId/appointments", async (req: express.Request, res: express.Response) => {
    const { clientId } = req.params;
    const body = req.body as AppointmentRequest;

    // Basic Validation
    if (!body.professionalId || !body.date || !body.time || !body.clientName) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    try {
        // A. Get Config
        const configSnap = await db.collection("configs").doc(clientId).get();
        const config = configSnap.data() || {};
        const duration = body.duration || config.slotDuration || 30;

        // B. Check Working Hours
        if (!isWithinWorkingHours(body.time, duration)) {
            res.status(400).json({ error: "Time is outside working hours (08:00 - 20:00)" });
            return;
        }

        // C. Check Overlaps
        // Query specific professional logic
        const q = db.collection("appointments")
            .where("clientId", "==", clientId)
            .where("professionalId", "==", body.professionalId)
            .where("date", "==", body.date);

        const snap = await q.get();
        const existing = snap.docs.map(d => d.data());

        if (checkOverlap(existing, body.date, body.time, duration)) {
            res.status(409).json({ error: "Slot is not available" });
            return;
        }

        // D. Create
        const newAppt = {
            id: admin.firestore().collection("appointments").doc().id, // Generate ID
            clientId,
            ...body,
            duration,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("appointments").doc(newAppt.id).set(newAppt);

        res.status(201).json({
            message: "Appointment created",
            data: newAppt
        });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 4. UPDATE APPOINTMENT (PUT)
app.put("/v1/:clientId/appointments/:id", async (req: express.Request, res: express.Response) => {
    const { clientId, id } = req.params;
    const body = req.body as AppointmentRequest;

    try {
        const apptRef = db.collection("appointments").doc(id);
        const apptSnap = await apptRef.get();

        if (!apptSnap.exists) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }

        const currentData = apptSnap.data() as AppointmentRequest;

        // Verify ownership (Client check)
        // In a real scenario we might check if this ID belongs to the clientId path param
        // but since we query by ID globally, we should just check the data matches.
        if (currentData.professionalId && body.professionalId && currentData.professionalId !== body.professionalId) {
            // Changing professional might require more checks, allowing for now if validation passes
        }

        // If Date/Time/Duration changes, we MUST re-validate
        const isTimeChange = (body.date && body.date !== currentData.date) ||
            (body.time && body.time !== currentData.time) ||
            (body.duration && body.duration !== currentData.duration);

        if (isTimeChange) {
            const newDate = body.date || currentData.date;
            const newTime = body.time || currentData.time;
            const newDuration = body.duration || currentData.duration || 30;

            // 1. Check Working Hours
            if (!isWithinWorkingHours(newTime, newDuration)) {
                res.status(400).json({ error: "New time is outside working hours" });
                return;
            }

            // 2. Check Overlaps (Excluding self)
            const profId = body.professionalId || currentData.professionalId;

            let q = db.collection("appointments")
                .where("clientId", "==", clientId)
                .where("professionalId", "==", profId)
                .where("date", "==", newDate);

            const snap = await q.get();
            const existing = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                // Exclude current appointment from overlap check
                .filter((d: any) => d.id !== id);

            if (checkOverlap(existing, newDate, newTime, newDuration)) {
                res.status(409).json({ error: "New slot is not available" });
                return;
            }
        }

        // Update
        await apptRef.update({
            ...body,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: "Appointment updated", id });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// 5. CANCEL APPOINTMENT (DELETE)
app.delete("/v1/:clientId/appointments/:id", async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
        await db.collection("appointments").doc(id).delete();
        res.json({ message: "Appointment deleted" });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Expose Express App as a Cloud Function
export const api = functions.https.onRequest(app);

import { runAgentLoop } from "./ai/agent";

// Expose Voice Intent Analyzer (Legacy)
export * from './analyzeIntent';

// NEW: Smart Assistant Logic
export const smartAssistant = functions.https.onCall(async (data, context) => {
    // 0. WARM-UP PING
    if (data.ping) return { pong: true };

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }

    // data.history: Array of messages
    // data.text: New user message (optional, can be just history)

    // Use the authenticated UID as the ClientID (Tenant)
    // OR use the Explicit ClientID sent by Frontend (Legacy/Hybrid mode)
    const clientId = data.clientId || context.auth.uid;

    console.log(`[SmartAssistant] INCOMING REQUEST. AuthUID=${context.auth.uid}, PayloadClientId=${data.clientId}, RESOLVED=${clientId}`);

    const history = data.messages || data.history || []; // Support both
    const contextData = data.context || {}; // { professionalId, professionalName }

    // If there is new text, append it
    if (data.text) {
        history.push({ role: "user", content: data.text });
    }

    try {
        const result = await runAgentLoop(clientId, history, contextData);
        return result; // { messages, finalResponse }
    } catch (e: any) {
        throw new functions.https.HttpsError("internal", e.message);
    }
});

// NEW: Whisper Transcription
export const transcribeAudio = functions.https.onCall(async (data, context) => {
    // 0. WARM-UP PING
    if (data.ping) return { pong: true };

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    }

    // data.audio: Base64 string
    const audioBase64 = data.audio;
    if (!audioBase64) {
        throw new functions.https.HttpsError("invalid-argument", "Missing 'audio' (base64)");
    }

    try {
        const text = await transcribeAudioBuffer(audioBase64);
        return { text };
    } catch (e: any) {
        throw new functions.https.HttpsError("internal", e.message);
    }
});
