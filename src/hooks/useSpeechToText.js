import { useState, useCallback, useRef } from 'react';

export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);
    const finalTranscriptRef = useRef('');

    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null;

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        setIsListening(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        }
        // Lock in whatever we have as final
        setTranscript(finalTranscriptRef.current.trim());
    }, []);

    const createRecognition = useCallback(() => {
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            // Only process NEW results from this session
            let sessionFinal = '';
            let interim = '';

            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    sessionFinal += text + ' ';
                } else {
                    interim += text;
                }
            }

            // Combine: text from previous sessions + this session's final + interim
            const baseFinal = finalTranscriptRef.current;
            // Update ref with accumulated finals (base + this session)
            // But only store session finals when they're actually final
            const fullFinal = baseFinal + sessionFinal;
            setTranscript((fullFinal + interim).trim());

            // Store the session finals so we don't lose them
            // We update the ref only with truly final text
            if (sessionFinal) {
                finalTranscriptRef.current = fullFinal;
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'aborted') return;
            if (event.error === 'no-speech') return;

            console.error('Speech error:', event.error);
            setError(`Mic error: ${event.error}`);
            shouldListenRef.current = false;
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            if (shouldListenRef.current) {
                // Auto-restart with fresh instance, keeping accumulated text
                try {
                    const newRec = createRecognition();
                    if (newRec) {
                        recognitionRef.current = newRec;
                        newRec.start();
                    }
                } catch (e) {
                    console.error('Auto-restart failed:', e);
                    shouldListenRef.current = false;
                    setIsListening(false);
                }
                return;
            }
            setIsListening(false);
            recognitionRef.current = null;
        };

        return recognition;
    }, [SpeechRecognition]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition not supported.');
            return;
        }

        // Kill existing session
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        }

        setError(null);
        shouldListenRef.current = true;
        // Don't reset finalTranscriptRef here — keep accumulated text across start/stop

        const recognition = createRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;

        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error('Failed to start:', e);
            setError('Could not start recording.');
            shouldListenRef.current = false;
        }
    }, [SpeechRecognition, createRecognition]);

    const resetTranscript = useCallback(() => {
        finalTranscriptRef.current = '';
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript,
        isSupported: !!SpeechRecognition,
    };
}

export default useSpeechToText;
