import { useCallback, useState, useEffect, useRef } from 'react';

export const useSpeak = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        if ('speechSynthesis' in window) {
            setSupported(true);

            // Find a female Spanish voice
            const findFemaleVoice = () => {
                const voices = window.speechSynthesis.getVoices();

                // Log all available voices for debugging
                const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
                console.log("[useSpeak] Available Spanish voices:", spanishVoices.map(v => `${v.name} (${v.lang})`));

                // Priority: Look for Spanish female voices by common names
                const femaleNames = ['sabina', 'helena', 'laura', 'mónica', 'monica', 'paulina',
                    'conchita', 'lucia', 'lucía', 'elena', 'female', 'mujer',
                    'marta', 'carmen', 'rosa', 'isabel'];

                const spanishFemale = voices.find(v =>
                    v.lang.startsWith('es') &&
                    femaleNames.some(name => v.name.toLowerCase().includes(name))
                );

                // Fallback: Any Spanish voice
                const anySpanish = voices.find(v => v.lang.startsWith('es'));

                femaleVoiceRef.current = spanishFemale || anySpanish || null;

                if (femaleVoiceRef.current) {
                    console.log("[useSpeak] ✓ Selected voice:", femaleVoiceRef.current.name, femaleVoiceRef.current.lang);
                } else {
                    console.log("[useSpeak] ✗ No Spanish voice found, using default");
                }
            };

            // Voices may load async - try immediately and on change
            findFemaleVoice();
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = findFemaleVoice;
            }
        }

        // Cleanup polling on unmount
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // Clean text for natural speech (remove markdown formatting)
    const cleanTextForSpeech = (input: string): string => {
        let cleaned = input;

        // Remove markdown bold/italic markers: **text** or *text* -> text
        cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
        cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');

        // Remove markdown headers: ### Header -> Header
        cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');

        // Convert bullet points to natural pauses: - item -> item
        cleaned = cleaned.replace(/^[-•]\s*/gm, '');

        // Replace multiple newlines with a single pause
        cleaned = cleaned.replace(/\n+/g, '. ');

        // Clean up multiple spaces
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Remove any remaining special characters that sound weird
        cleaned = cleaned.replace(/[_`~]/g, '');

        return cleaned.trim();
    };

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;

        const cleanedText = cleanTextForSpeech(text);
        console.log("[useSpeak] speak() called, cleaned text:", cleanedText.substring(0, 60) + "...");

        // Cancel any previous speech and polling
        window.speechSynthesis.cancel();
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }

        const utterance = new SpeechSynthesisUtterance(cleanedText);
        utterance.lang = 'es-AR';
        utterance.rate = 1.0;

        // Use female voice if available
        if (femaleVoiceRef.current) {
            utterance.voice = femaleVoiceRef.current;
        }

        // Chrome GC fix
        // @ts-ignore
        window.utteranceRef = utterance;

        // Set speaking immediately
        setIsSpeaking(true);
        console.log("[useSpeak] Starting TTS, isSpeaking=true");

        window.speechSynthesis.speak(utterance);

        // POLLING: Check every 100ms if TTS is still speaking
        let wasEverSpeaking = false;

        pollingRef.current = setInterval(() => {
            const currentlySpeaking = window.speechSynthesis.speaking;

            if (currentlySpeaking) {
                wasEverSpeaking = true;
            }

            // Detect transition: was speaking -> now stopped
            if (wasEverSpeaking && !currentlySpeaking) {
                console.log("[useSpeak] Polling detected TTS finished, isSpeaking=false");
                setIsSpeaking(false);
                // @ts-ignore
                if (window.utteranceRef) delete window.utteranceRef;

                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
            }
        }, 100);

    }, []);

    const cancel = useCallback(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setIsSpeaking(false);
        // @ts-ignore
        if (window.utteranceRef) delete window.utteranceRef;
    }, []);

    return { speak, cancel, isSpeaking, supported };
};
