import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    silenceTimeoutMs?: number; // Default 2500ms
    noiseThreshold?: number; // Default 0.005 (Sensitive)
}

export const useAudioRecorder = ({
    onRecordingComplete,
    silenceTimeoutMs = 2500,
    noiseThreshold = 0.02
}: UseAudioRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Audio Graph Refs (For Persistence)
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const silenceStartRef = useRef<number | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const hasSpokenRef = useRef(false);
    const recordingStartRef = useRef<number>(0); // Track when recording started for grace period

    // Fix Stale Closure: Keep ref to latest callback
    const onRecordingCompleteRef = useRef(onRecordingComplete);
    useEffect(() => { onRecordingCompleteRef.current = onRecordingComplete; }, [onRecordingComplete]);

    // Helper: Stop Mic Stream and Disconnect Nodes (Prevents Echo & Release Mic)
    const stopStreamAndNodes = useCallback(() => {
        // 1. Stop Mic Stream (Release HW)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // 2. Disconnect Source Node (Clean Graph)
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        // Note: Context, Gain, and Analyser remain alive for reuse.
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            console.log("[Audio] Starting Recording Sequence...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            hasSpokenRef.current = false;
            recordingStartRef.current = Date.now(); // Track start time for grace period

            // 1. Setup MediaRecorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // Only trigger complete IF user spoke, otherwise just silent restart
                if (hasSpokenRef.current) {
                    onRecordingCompleteRef.current(audioBlob);
                } else {
                    console.log("[VAD] Ignored empty/silent recording.");
                }
                stopStreamAndNodes();
            };

            mediaRecorder.start();
            setIsRecording(true);

            // 2. Setup Audio Graph (Reuse Context & Nodes)
            let audioContext = audioContextRef.current;
            // Re-initialize if missing or closed (failsafe)
            if (!audioContext || audioContext.state === 'closed') {
                audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioContext;

                // Initialize Persistent Nodes ONCE
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyserRef.current = analyser;

                const gainNode = audioContext.createGain();
                gainNode.gain.value = 5.0; // Boost
                gainNodeRef.current = gainNode;

                // Wire Static Part: Gain -> Analyser
                gainNode.connect(analyser);
            }

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // 3. Connect Stream to Graph
            // Create new Source for the new Stream
            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;

            // Connect Source -> Gain
            if (gainNodeRef.current) {
                source.connect(gainNodeRef.current);
            }

            console.log("[Audio] Graph Connected. Context State:", audioContext.state);

            // 4. Start VAD Loop
            checkSilence();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsRecording(false);
        }
    }, [stopStreamAndNodes]); // Added dependency

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    }, []);

    const checkSilence = useCallback(() => {
        // Require analyser AND active stream to check silence
        if (!analyserRef.current || !streamRef.current || !streamRef.current.active) return;

        const dataArray = new Uint8Array(analyserRef.current.fftSize);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (Volume)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const x = (dataArray[i] - 128) / 128.0; // Normalize
            sum += x * x;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        // GRACE PERIOD: Don't count silence for first 1.5 seconds
        // This gives the user time to start speaking after mic activates
        const GRACE_PERIOD_MS = 1500;  // Reduced from 2000 for faster response
        const timeSinceStart = Date.now() - recordingStartRef.current;
        const inGracePeriod = timeSinceStart < GRACE_PERIOD_MS;

        // Logic
        if (rms > noiseThreshold) {
            // User is speaking
            silenceStartRef.current = null;
            hasSpokenRef.current = true; // Mark as spoken
        } else {
            // Silence - but only count if NOT in grace period
            if (!inGracePeriod) {
                if (silenceStartRef.current === null) {
                    silenceStartRef.current = Date.now();
                } else {
                    const silenceDuration = Date.now() - silenceStartRef.current;

                    if (silenceDuration > silenceTimeoutMs) {
                        console.log("[VAD] Silence Timeout. Stopping.");
                        stopRecording();
                        return; // Stop loop
                    }
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(checkSilence);
    }, [noiseThreshold, silenceTimeoutMs, stopRecording]);

    // Cleanup on unmount ONLY
    useEffect(() => {
        return () => {
            if (isRecording) stopRecording();
            stopStreamAndNodes();
            // REAL Cleanup: Kill the Context
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    return { isRecording, startRecording, stopRecording };
};
