import { getFunctions, httpsCallable } from 'firebase/functions';
import { VOICE_PROMPTS } from './prompts';

export type AgentState = 'IDLE' | 'LISTENING_COMMAND' | 'CONFIRMING' | 'PROCESSING';

export interface AgentDirective {
    type: 'SPEAK' | 'EXECUTE' | 'NONE';
    text?: string;        // Text to speak
    actionData?: any;     // Data to execute (Appointment object etc)
}

export class Agente {
    public state: AgentState = 'IDLE';
    public history: any[] = []; // Chat History
    public lastResponse: string = ""; // To detect Echo
    public clientId: string | undefined;

    constructor() { }

    public setClientId(id: string | undefined) {
        this.clientId = id;
    }

    public reset() {
        this.state = 'IDLE';
        this.history = [];
        this.lastResponse = "";
    }

    public checkWakeWord(text: string): boolean {
        return VOICE_PROMPTS.WAKE_WORD.test(text.toLowerCase());
    }

    // Echo Detection: Check if input is similar to last AI response
    private isEcho(text: string): boolean {
        if (!this.lastResponse || this.lastResponse.length < 5) return false;

        const normalize = (s: string) => s.toLowerCase().replace(/[^\w\sáéíóúñü]/g, '').trim();
        const inputNorm = normalize(text);
        const responseNorm = normalize(this.lastResponse);

        // If input is too short, not likely an echo
        if (inputNorm.length < 10) return false;

        // Check if input words overlap significantly with last response
        const inputWords = inputNorm.split(/\s+/).filter(w => w.length > 2);
        const responseWords = responseNorm.split(/\s+/).filter(w => w.length > 2);

        if (inputWords.length === 0) return false;

        const matches = inputWords.filter(w => responseWords.includes(w)).length;
        const matchRatio = matches / inputWords.length;

        console.log(`[Agente] Echo Check: ${matches}/${inputWords.length} words match (${(matchRatio * 100).toFixed(0)}%)`);

        // If more than 50% of words match, likely an echo
        return matchRatio > 0.5;
    }

    public async processInput(text: string, context?: { professionalId: string, professionalName: string }, clientIdArg?: string): Promise<AgentDirective> {
        // 0. ECHO DETECTION: Skip if input is likely an echo of AI's last response
        if (this.isEcho(text)) {
            console.log("[Agente] ECHO DETECTED - Ignoring input:", text);
            return { type: 'NONE' };
        }

        // 1. Log User Input
        console.log("[Agente] INPUT:", text);
        this.history.push({ role: "user", content: text });

        // 1. LOGIC UPDATE: We are in Hands-Free Mode (VAD).
        // Any input received here is a deliberate command (filtered by VAD).
        // So we skip the "Wake Word" check and process immediately.

        if (this.state === 'IDLE') {
            this.state = 'LISTENING_COMMAND';
            // If text contains "agenda", we might want to ACK, but let's just process the full text.
        }

        // 2. STATE: LISTENING_COMMAND (Conversation Loop)
        if (this.state === 'LISTENING_COMMAND' || this.state === 'CONFIRMING') {
            try {
                const functions = getFunctions();
                // Call the new Smart Assistant
                const smartAssistant = httpsCallable(functions, 'smartAssistant');

                this.state = 'PROCESSING';

                console.log("[Agente] Sending to Backend:", text, context, clientIdArg);

                // Use robust ID resolution: Argument > Internal State > Undefined (Backend handles auth fallback)
                console.log(`[Agente] Resolving ID. Arg: '${clientIdArg}', Internal: '${this.clientId}'`);
                const finalClientId = clientIdArg || this.clientId;

                if (!finalClientId) {
                    console.error("[Agente] CRITICAL: No ClientID resolved. Aborting backend call.");
                    return { type: 'SPEAK', text: 'Lo siento, hubo un error de identidad. Por favor recarga la página.' };
                }

                // Call Cloud Function with history + new text, AND CONTEXT
                const result: any = await smartAssistant({
                    messages: this.history, // Send full history so backend has context
                    context: context,
                    clientId: finalClientId // Legacy/Hybrid ID Override
                });

                // Response contains updated { messages, finalResponse }
                const data = result.data;

                // AI Response
                const reply = data.finalResponse || "No entendí.";
                this.lastResponse = reply; // Store for Echo Detection

                console.log("[Agente] AI Responded:", reply);

                // Update Local History
                if (data.messages) {
                    this.history = data.messages;
                } else {
                    // Fallback: If backend didn't return full history, append reply manually
                    this.history.push({ role: "assistant", content: reply });
                }

                // Check last message to ensure consistency (Debug)
                const lastMsg = this.history[this.history.length - 1];
                if (lastMsg.role !== 'assistant') {
                    console.warn("[Agente] Warning: Last message is not assistant reply but we have a reply.");
                }

                // If response asks a question, we stay in LISTENING/CONFIRMING
                // If response is final ("Listo"), we might go to IDLE?
                // For now, let's keep listening if it asks something (endswith "?")
                if (reply.endsWith("?")) {
                    this.state = 'CONFIRMING'; // or keep LISTENING
                    return { type: 'SPEAK', text: reply };
                } else {
                    // Start fresh next time? or keep context?
                    // Let's reset to IDLE after a "Done" action to save token usage
                    if (reply.toLowerCase().includes("listo") || reply.toLowerCase().includes("cancelado")) {
                        // Action Completed / Cancelled
                        this.state = 'IDLE';
                        return { type: 'EXECUTE', text: reply, actionData: { type: 'REFRESH' } };
                    }

                    // Default: Just Speak and Reset to IDLE (Ready for next command)
                    this.state = 'IDLE';
                    return { type: 'SPEAK', text: reply };
                }

            } catch (e: any) {
                console.error("Agent Error:", e);
                const errorMsg = e.message || "Error desconocido";

                // Inject error into history so the NEXT interaction knows about it
                this.history.push({
                    role: "system",
                    content: `The previous request failed: ${errorMsg}`
                });

                return {
                    type: 'SPEAK',
                    text: `Hubo un error: ${errorMsg}. ¿Querés intentar de nuevo?`
                };
            }
        }

        return { type: 'NONE' };
    }
}
