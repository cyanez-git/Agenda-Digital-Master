import OpenAI from "openai";
import { TOOLS } from "./tools";
import * as apptService from "../services/appointmentService";
import * as profService from "../services/professionalService";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
Sos un Asistente de Voz para Agenda Digital.
Tu objetivo es ayudar al profesional a gestionar su agenda de forma eficiente.
IMPORTANTE: Tus respuestas serán LEÍDAS EN VOZ ALTA por un sintetizador de voz.

REGLAS GENERALES:
1. Gestiona profesional por nombre. Busca el ID internamente.
2. Si hay múltiples opciones, pregunta.
3. Sé breve y conciso.

FECHA ACTUAL: {CURRENT_TIME}

REGLAS INTERPRETACIÓN INTENCIÓN:
1. Si el usuario menciona DOS fechas ("el del 25 pasalo al 26") o dice "para el día X", ASUME que quiere MOVER/REPROGRAMAR.
2. "Vamos a ver el turno del..." + [Nueva Fecha] -> SIGNIFICA "MOVER".
3. Prioriza la acción de MODIFICACIÓN sobre la de CONSULTA si hay ambigüedad.
4. "A LA MISMA HORA" o "al mismo horario" significa MANTENER EL HORARIO ORIGINAL del turno. Primero consulta el turno actual para saber su hora, y luego usa ESA MISMA HORA como new_time al mover.
5. MANEJO DE AÑOS: Si el usuario menciona un mes que ya pasó este año (ej: estamos en Diciembre y dice "Enero"), ASUME QUE ES DEL AÑO SIGUIENTE. No asumas fecha pasada.

REGLAS DE RESPUESTA PARA VOZ:
1. NUNCA uses markdown: nada de **, *, -, #, bullets ni listas.
2. NUNCA enumeres más de 3 turnos. Si hay más, di "tenés X turnos, los primeros son..." 
3. Respondé como si hablaras por teléfono, en español argentino coloquial.
4. En lugar de listas, usá frases naturales: "Tenés turno a las 10 con Juan, a las 11 con María y a las 12 con Pedro."
5. Para fechas, decí "el 25 de diciembre" no "2024-12-25".
6. Para horarios, decí "a las diez" o "diez de la mañana", no "10:00".
7. Si el input parece ruido o no se entiende, decí: "Perdón, no te entendí, ¿podés repetir?"
8. Si ejecutás una acción, confirmá de forma breve: "Listo, moví el turno de Juan al 26 a las 11."
9. MANEJO DE ERRORES: Si una herramienta falla, COMUNICA ESE ERROR y PREGUNTA, pero NO intentes avanzar.
 `;

export const runAgentLoop = async (
    clientId: string,
    history: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    context?: { professionalId: string, professionalName: string }
) => {
    let messages = [...history];
    let iteration = 0;
    const MAX_ITERATIONS = 5;

    // Inject System Prompt if not present
    const nowStr = new Date().toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
    let promptText = SYSTEM_PROMPT.replace("{CURRENT_TIME}", nowStr);

    // Inject Context
    if (context?.professionalName) {
        promptText += `\nESTÁS GESTIONANDO LA AGENDA DE: ${context.professionalName}. (ID: ${context.professionalId})`;
        promptText += `\nSi el usuario dice "mi agenda" o no especifica profesional, asume que es para ${context.professionalName}.`;
    }

    const systemMsg = { role: "system", content: promptText };

    // Ensure system prompt is first or merged
    if (messages.length === 0 || messages[0].role !== 'system') {
        messages.unshift(systemMsg as any);
    } else {
        // Update existing system prompt with new time
        messages[0] = systemMsg as any;
    }

    // MAIN LOOP
    while (iteration < MAX_ITERATIONS) {
        iteration++;

        console.log(`[Agent] Step ${iteration}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            tools: TOOLS,
            tool_choice: "auto",
        });

        const msg = response.choices[0].message;
        messages.push(msg); // Add assistant response to history

        // 1. If content and NO tool calls, we are done. (Or if it asked a question)
        if (!msg.tool_calls || msg.tool_calls.length === 0) {
            return {
                messages: messages, // Return full history to client
                finalResponse: msg.content
            };
        }

        // 2. Handle Tool Calls
        for (const toolCall of msg.tool_calls) {
            const fnName = (toolCall as any).function.name;
            const args = JSON.parse((toolCall as any).function.arguments);
            let result = "Error: Tool execution failed";

            try {
                console.log(`[Agent] Calling ${fnName}`, args);

                if (fnName === 'get_current_time') {
                    result = new Date().toLocaleString('es-AR');
                }

                else if (fnName === 'get_available_slots') {
                    // Resolve Professional ID
                    let profId = context?.professionalId; // Default to Context
                    if (args.professional_name) {
                        const p = await profService.findProfessionalByName(clientId, args.professional_name);
                        if (p) profId = p.id;
                    }
                    // TODO: If no profId (global view?), usually we need one.

                    const slots = await apptService.getAvailableSlots(clientId, args.date, profId);
                    result = JSON.stringify(slots);
                }

                else if (fnName === 'get_appointments') {
                    // Resolve Professional
                    let profId = context?.professionalId;
                    if (args.professional_name) {
                        const p = await profService.findProfessionalByName(clientId, args.professional_name);
                        if (p) profId = p.id;
                    }

                    // Strict Search
                    let appts = await apptService.getAppointments(clientId, args.date, profId);

                    // Fallback Search
                    if (appts.length === 0 && profId) {
                        const fallback = await apptService.getAppointments(clientId, args.date, undefined);
                        if (fallback.length > 0) appts = fallback;
                    }

                    if (appts.length === 0) {
                        throw new Error(`No encontré turnos ocupados el ${args.date}.`);
                    }

                    result = appts.map((a: any) => `${a.time} - ${a.clientName} (${a.professionalId})`).join("\n");
                }

                else if (fnName === 'create_appointment') {
                    // Resolve Professional
                    let profId = context?.professionalId;

                    if (args.professional_name) {
                        const p = await profService.findProfessionalByName(clientId, args.professional_name);
                        if (p) profId = p.id;
                    }

                    if (!profId) throw new Error("Debes especificar el profesional.");

                    const appt = await apptService.createAppointment(clientId, {
                        professionalId: profId,
                        date: args.date,
                        time: args.time,
                        clientName: args.client_name,
                        phone: args.phone || ""
                    });
                    result = "Success. Appointment Created with ID: " + appt.id;
                }

                else if (fnName === 'move_appointment') {
                    // Logic: Find the appointment first
                    // Filters: Date (current_date), Name (client_name optional)

                    let targetAppt: any = null;

                    const searchDate = args.current_date || new Date().toISOString().split('T')[0];
                    // USE CONTEXT ID to filter appointments!
                    const filterProfId = context?.professionalId;

                    let apptsOnDate: any[] = await apptService.getAppointments(clientId, searchDate, filterProfId);

                    // FALLBACK: If NO appointments found with strict Professional ID, try WITHOUT Professional ID.
                    // This fixes issues where DB might have "1" vs 1, or undefined.
                    if (apptsOnDate.length === 0 && filterProfId) {
                        console.log("[Agent] Strict search failed. Trying Fallback (No ProfID)...");
                        const fallbackAppts = await apptService.getAppointments(clientId, searchDate, undefined);
                        if (fallbackAppts.length > 0) {
                            console.log(`[Agent] Fallback found ${fallbackAppts.length} appointments. Using them.`);
                            apptsOnDate = fallbackAppts;
                        }
                    }

                    if (args.client_name) {
                        // Filter by name fuzzy
                        const normName = args.client_name.toLowerCase().trim();
                        const matches = apptsOnDate.filter((a: any) => a.clientName.toLowerCase().includes(normName));

                        if (matches.length === 0) throw new Error(`No encontré turnos para ${args.client_name} en esa fecha.`);
                        if (matches.length > 1) throw new Error(`Hay ${matches.length} turnos para ${args.client_name}. Por favor sé más específico con la hora.`);
                        targetAppt = matches[0];
                    } else {
                        // NO NAME PROVIDED -> Smart Inference
                        if (apptsOnDate.length === 1) {
                            targetAppt = apptsOnDate[0]; // BINGO!
                        } else if (apptsOnDate.length === 0) {
                            throw new Error(`No encontré turnos el ${searchDate}. ¿Estás seguro de la fecha?`);
                        } else {
                            // appointments exist but logic didn't pick one.
                            // Case 1: Multiple matches
                            const names = apptsOnDate.map((a: any) => `${a.time} ${a.clientName}`).join(", ");
                            throw new Error(`No encontré exactamente ese turno, pero ese día están: ${names}. ¿Cuál de esos es?`);
                        }
                    }

                    if (targetAppt) {
                        // Perform Move
                        await apptService.moveAppointment(clientId, targetAppt.id, args.new_date, args.new_time);
                        result = `Turno de ${targetAppt.clientName} movido exitosamente al ${args.new_date} a las ${args.new_time}.`;
                    } else {
                        // Should actully throw above, but safety net
                        const names = apptsOnDate.map((a: any) => `${a.time} ${a.clientName}`).join(", ");
                        throw new Error(`Error: No pude identificar el turno. En esa fecha veo: ${names}`);
                    }
                }

                else if (fnName === "delete_appointment") {
                    // --- DELETE APPOINTMENT ---
                    const searchName = (args.client_name || "").toLowerCase();
                    const searchDate = args.date || new Date().toISOString().split('T')[0];
                    const profId = context?.professionalId;

                    // Get appointments to find match
                    const allAppts = searchDate
                        ? await apptService.getAppointments(clientId, searchDate, profId)
                        : [];

                    // Find by name match
                    let targetAppt: any = null;
                    if (searchName) {
                        targetAppt = allAppts.find((a: any) =>
                            (a.clientName || "").toLowerCase().includes(searchName)
                        );
                    }

                    // If no date specified, search future appointments
                    if (!targetAppt && !args.date && searchName) {
                        const today = new Date();
                        for (let i = 0; i < 30 && !targetAppt; i++) {
                            const checkDate = new Date(today);
                            checkDate.setDate(checkDate.getDate() + i);
                            const dateStr = checkDate.toISOString().split('T')[0];
                            const dayAppts = await apptService.getAppointments(clientId, dateStr, profId);
                            targetAppt = dayAppts.find((a: any) =>
                                (a.clientName || "").toLowerCase().includes(searchName)
                            );
                        }
                    }

                    if (!targetAppt) {
                        throw new Error(`No encontré turno de "${args.client_name}". ¿Está bien el nombre?`);
                    }

                    // Perform Delete
                    const deleted = await apptService.deleteAppointment(clientId, targetAppt.id);
                    result = `Turno de ${deleted.clientName} del ${deleted.date} a las ${deleted.time} fue cancelado exitosamente.`;
                }

            } catch (e: any) {
                result = "Error: " + e.message;
            }

            // Append Tool Result
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result
            });
        }

        // Loop continues to let AI process the tool result and decide next step
    }

    return { messages, finalResponse: "Error: Too many iterations." };
};
