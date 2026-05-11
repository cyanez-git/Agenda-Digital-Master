import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceCommandAction =
    | 'NEW_APPOINTMENT'
    | 'CANCEL'
    | 'SAVE'
    | 'VIEW_DAY'
    | 'VIEW_WEEK'
    | 'VIEW_MONTH'
    | 'VIEW_PATIENTS'
    | 'VIEW_CONFIG'
    | 'TODAY'
    | 'NEXT'
    | 'PREVIOUS'
    | 'UNKNOWN';

interface UseVoiceProps {
    onCommand: (action: VoiceCommandAction, text: string) => void;
}

export const useVoice = ({ onCommand }: UseVoiceProps) => {
    const [isListening, setIsListening] = useState(false);
    const [support, setSupport] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Stable reference to onCommand to avoid restarting effect
    const onCommandRef = useRef(onCommand);
    // Track if we SHOULD be listening (auto-restart logic)
    const isListeningRef = useRef(false);
    // Track transcript for access in stopListening closure
    const transcriptRef = useRef('');

    useEffect(() => {
        onCommandRef.current = onCommand;
    }, [onCommand]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setSupport(true);
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'es-AR';

            rec.onstart = () => {
                setIsListening(true);
                setTranscript('');
                transcriptRef.current = '';
                setError(null);
            };

            rec.onend = () => {
                setIsListening(false);
                // AUTO-RESTART if we still want to be listening
                if (isListeningRef.current) {
                    try {
                        console.log("Auto-restarting voice...");
                        rec.start();
                    } catch (e) {
                        // ignore if already started
                    }
                }
            };

            rec.onerror = (event: any) => {
                console.error("Voice Error", event.error);
                let msg = 'Error de voz desconocido';

                if (event.error === 'no-speech') return; // Ignore no-speech

                if (event.error === 'not-allowed') msg = 'Permiso de micrófono denegado';
                if (event.error === 'service-not-allowed') msg = 'Servicio de voz no disponible';
                if (event.error === 'network') msg = 'Error de red en reconocimiento de voz';

                // Allow non-fatal errors to be retried by restarting? 
                // Mostly "no-speech" is the one we restart on.
                // "network" might need a backoff.
                // "not-allowed" is fatal.

                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    isListeningRef.current = false;
                    setIsListening(false);
                    setError(msg);
                } else {
                    // For network/no-speech, we let auto-restart handle it via onEnd 
                    // OR we might need to trigger it. 
                    // Actually onEnd usually fires after onError in Speech API.
                    setError(msg); // Show error but might restart
                }
            };

            rec.onresult = (event: any) => {
                const results = Array.from(event.results);
                const finalTranscript = results
                    .map((r: any) => r[0].transcript)
                    .join('');

                setTranscript(finalTranscript);
                transcriptRef.current = finalTranscript;
            };

            setRecognition(rec);

            return () => {
                isListeningRef.current = false;
                rec.abort();
            };
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition && !isListening) {
            try {
                isListeningRef.current = true;
                recognition.start();
                setError(null);
            } catch (e) {
                console.error("Voice start error", e);
            }
        }
    }, [recognition, isListening]);

    const stopListening = useCallback(() => {
        if (recognition && isListening) {
            isListeningRef.current = false;
            recognition.stop();

            // PROCESS COMMAND ON STOP
            if (onCommandRef.current && transcriptRef.current.trim()) {
                // Send 'UNKNOWN' so App.tsx uses its regex parser
                onCommandRef.current('UNKNOWN', transcriptRef.current);
            }
        }
    }, [recognition, isListening]);

    return { isListening, startListening, stopListening, support, transcript, error };
};
