import * as functions from "firebase-functions";
import OpenAI from "openai";

// Initialize OpenAI
// Note: Requires OPENAI_API_KEY in .env file in functions/ directory
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeIntent = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "Authentication required for voice commands."
        );
    }

    const { text, timeContext } = data; // timeContext = "Wednesday, Dec 20, 2023 10:30 AM"

    if (!text) {
        throw new functions.https.HttpsError("invalid-argument", "Text is required.");
    }

    console.log(`[AnalyzeIntent] Processing: "${text}" | Context: ${timeContext}`);

    const systemPrompt = `
🔵 1. ROL DEL AGENTE
Sos un Asistente Interno de Agenda para Aganda Digital.
Tu función es ayudar al profesional a gestionar agendas mediante APIs simuladas.

Contexto Actual: ${timeContext}

🔵 2. INTENCIONES PERMITIDAS Y PARÁMETROS (JSON Output)
Debes extraer la intención y devolver un JSON estructurado.

1. CREATE_APPOINTMENT
   - Params: clientName (string), date (YYYY-MM-DD), time (HH:mm), phone (string, optional)
   - Lógica: Si falta hora, NO inventar, marcar como "UNKNOWN" con mensaje pidiendo datos.

2. MOVE_APPOINTMENT
   - Params: targetName (string), sourceDate (YYYY-MM-DD, optional), newDate (YYYY-MM-DD), newTime (HH:mm)
   - Lógica: "Mueve turno de Juan a mañana a las 10".

3. CANCEL_APPOINTMENT
   - Params: targetName (string), date (YYYY-MM-DD, optional)

4. VIEW_CALENDAR
   - Params: viewMode ('day'|'week'|'month'), date (YYYY-MM-DD)

5. UNKNOWN
   - Si la solicitud es ambigua o faltan datos críticos.

🔵 3. REGLAS DE RESPUESTA (Natural Language)
Genera un texto natural para el campo "confirmationText" siguiendo estas reglas:
- CONFIRMACIÓN: "Confirmo: [Acción] el [Fecha] a las [Hora]. ¿Correcto?"
- AMBIGÜEDAD: "Encontré varios turnos. ¿Podrías especificar la hora?"
- FALTA DATOS: "¿Para qué fecha querés agendar?"

🔵 4. JSON RESPONSE FORMAT (Strict)
{
  "intent": "CREATE_APPOINTMENT" | "MOVE_APPOINTMENT" | "CANCEL_APPOINTMENT" | "VIEW_CALENDAR" | "UNKNOWN",
  "params": { ... },
  "confidence": 0.0 - 1.0,
  "confirmationText": "Texto natural que el asistente dirá en voz alta."
}

🔵 5. IMPORTANTE
- NUNCA inventes nombres ni fechas.
- Si el usuario dice "mañana", calcula la fecha exacta en base al Contexto Actual.
- Idioma: Español Argentino (voseo).
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost effective and fast
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        const result = JSON.parse(content);
        console.log("[AnalyzeIntent] Result:", result);

        return result;

    } catch (error: any) {
        console.error("[AnalyzeIntent] Error:", error);
        throw new functions.https.HttpsError("internal", "AI Processing Failed: " + error.message);
    }
});
