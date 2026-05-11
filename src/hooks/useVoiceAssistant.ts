import { useRef, useEffect, useState } from 'react';
import { Agente } from '../agent/Agente';
import { useAudioRecorder } from './useAudioRecorder';
import { useSpeak } from './useSpeak';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface UseVoiceAssistantProps {
    isEnabled: boolean;
    onExecute: (action: any) => void;
    context?: { professionalId: string, professionalName: string };
    clientId?: string;
}

export const useVoiceAssistant = ({ isEnabled, onExecute, context, clientId }: UseVoiceAssistantProps) => {
    const { speak, isSpeaking } = useSpeak();

    // We instantiate the Agent once
    const agentRef = useRef(new Agente());
    const clientIdRef = useRef(clientId);

    // Agent State
    const [agentState, setAgentState] = useState<'IDLE' | 'LISTENING_COMMAND' | 'PROCESSING' | 'CONFIRMING'>('IDLE');
    const [messages, setMessages] = useState<any[]>([]);
    const [lastLog, setLastLog] = useState("");
    const [isProcessingInfo, setIsProcessingInfo] = useState(false);

    // --- HELPER: Blob to Base64 ---
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // --- SYNC CLIENT ID ---
    useEffect(() => {
        clientIdRef.current = clientId;
        console.log("[VoiceAssistant] Syncing ClientID to Agent:", clientId);
        if (agentRef.current) {
            agentRef.current.setClientId(clientId);
        }
    }, [clientId]);

    // --- WELCOME MESSAGE when enabled ---
    useEffect(() => {
        if (isEnabled) {
            console.log("[VoiceAssistant] Enabled - saying welcome");
            speak("Decime");
        } else {
            // Reset agent when disabled
            if (agentRef.current) {
                agentRef.current.reset();
            }
        }
    }, [isEnabled, speak]);

    // --- WARM-UP PING ---
    useEffect(() => {
        const warmUp = async () => {
            try {
                const functions = getFunctions();
                const pingTranscribe = httpsCallable(functions, 'transcribeAudio');
                const pingAssistant = httpsCallable(functions, 'smartAssistant');

                console.log("[Voice] Warming up functions...");
                // Fire and forget - don't await blocking
                pingTranscribe({ ping: true }).catch(() => { });
                pingAssistant({ ping: true }).catch(() => { });
            } catch (e) {
                // Ignore errors
            }
        };

        warmUp();
    }, []); // Run once on mount

    // --- TRANSCRIPTION & PROCESSING ---
    const handleRecordingComplete = async (audioBlob: Blob) => {
        if (!isEnabled) return;

        setIsProcessingInfo(true);
        console.log("[Voice] Recording Complete. Transcribing...");
        try {
            const base64Audio = await blobToBase64(audioBlob);

            const functions = getFunctions();
            const transcribeAudio = httpsCallable(functions, 'transcribeAudio');

            const result: any = await transcribeAudio({ audio: base64Audio });
            const text = result.data.text;

            console.log("[Voice] Transcribed Text:", text);

            if (text && text.trim().length > 0) {
                await handleAgentProcessing(text);
            } else {
                console.log("[Voice] Empty transcription.");
                setIsProcessingInfo(false);
            }

        } catch (e) {
            console.error("[Voice] Transcription Error:", e);
            setIsProcessingInfo(false);
        }
    };

    const handleAgentProcessing = async (text: string) => {
        console.log("[Assistant] Processing with context:", text, context);
        setLastLog(text);

        const currentId = clientIdRef.current;
        console.log("[VoiceAssistant] handleAgentProcessing. clientIdRef:", currentId);

        if (!currentId) {
            console.warn("[VoiceAssistant] CRITICAL: ClientID is missing in Ref!");
        }

        const directive = await agentRef.current.processInput(text, context, currentId);
        setAgentState(agentRef.current.state);
        setMessages([...agentRef.current.history]);

        // Release processing BEFORE speaking
        // The isSpeaking state from useSpeak will now be reliable (polling-based)
        setIsProcessingInfo(false);

        // Speak the response
        if (directive.type === 'SPEAK' && directive.text) {
            speak(directive.text);
        } else if (directive.type === 'EXECUTE') {
            if (directive.text) speak(directive.text);
            if (directive.actionData) onExecute(directive.actionData);
        }
    };

    // --- RECORDER HOOK ---
    const { startRecording, stopRecording, isRecording } = useAudioRecorder({
        onRecordingComplete: handleRecordingComplete,
        silenceTimeoutMs: 2500,  // Reduced from 3500 for faster response
        noiseThreshold: 0.01
    });

    // --- MIC CONTROL ---
    // Simple logic: record when NOT processing AND NOT speaking
    const pendingStartRef = useRef<NodeJS.Timeout | null>(null);
    const isBusy = isProcessingInfo || isSpeaking;

    useEffect(() => {
        const clearPendingStart = () => {
            if (pendingStartRef.current) {
                clearTimeout(pendingStartRef.current);
                pendingStartRef.current = null;
            }
        };

        if (!isEnabled) {
            clearPendingStart();
            if (isRecording) stopRecording();
            return;
        }

        // If BUSY -> stop recording
        if (isBusy) {
            clearPendingStart();
            if (isRecording) {
                console.log("[Voice] Busy (processing/speaking) -> Stop Rec");
                stopRecording();
            }
            return;
        }

        // If NOT busy and NOT recording -> start with small delay (anti-echo)
        if (!isRecording && !pendingStartRef.current) {
            console.log("[Voice] Ready -> Scheduling recording...");
            pendingStartRef.current = setTimeout(() => {
                // Double-check we're still not busy
                if (isEnabled && !isBusy) {
                    console.log("[Voice] Starting recording");
                    startRecording();
                }
                pendingStartRef.current = null;
            }, 200); // Reduced from 300ms for faster response
        }

        return () => clearPendingStart();
    }, [isEnabled, isBusy, isRecording, startRecording, stopRecording]);

    return {
        isListening: isRecording || isProcessingInfo,
        transcript: lastLog,
        agentState,
        messages
    };
};
