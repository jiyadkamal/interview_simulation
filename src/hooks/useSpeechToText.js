import { useState, useCallback, useRef } from 'react';

export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);

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
    }, []);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser.');
            return;
        }

        // Always kill any existing session first
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        }

        setError(null);
        shouldListenRef.current = true;

        // Create a fresh instance every time
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        let finalText = '';

        recognition.onresult = (event) => {
            let interim = '';
            finalText = '';
            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += text + ' ';
                } else {
                    interim += text;
                }
            }
            setTranscript(finalText + interim);
        };

        recognition.onerror = (event) => {
            // "aborted" happens when we intentionally stop — ignore it
            if (event.error === 'aborted') return;

            // "no-speech" is recoverable — the mic is on but user hasn't spoken
            if (event.error === 'no-speech') {
                // onend will fire after this; the restart logic there handles it
                return;
            }

            console.error('Speech error:', event.error);
            setError(`Mic error: ${event.error}`);
            shouldListenRef.current = false;
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            // If we still want to listen, auto-restart with a fresh instance
            if (shouldListenRef.current) {
                try {
                    const newRecognition = new SpeechRecognition();
                    newRecognition.continuous = true;
                    newRecognition.interimResults = true;
                    newRecognition.lang = 'en-US';

                    // Carry over the accumulated final text
                    const savedFinal = finalText;

                    newRecognition.onresult = (event) => {
                        let newFinal = '';
                        let interim = '';
                        for (let i = 0; i < event.results.length; i++) {
                            const text = event.results[i][0].transcript;
                            if (event.results[i].isFinal) {
                                newFinal += text + ' ';
                            } else {
                                interim += text;
                            }
                        }
                        finalText = savedFinal + newFinal;
                        setTranscript(finalText + interim);
                    };

                    newRecognition.onerror = recognition.onerror;
                    newRecognition.onend = recognition.onend;

                    recognitionRef.current = newRecognition;
                    newRecognition.start();
                } catch (e) {
                    console.error('Auto-restart failed:', e);
                    shouldListenRef.current = false;
                    setIsListening(false);
                    recognitionRef.current = null;
                }
                return;
            }

            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error('Failed to start speech recognition:', e);
            setError('Could not start recording. Please try again.');
            shouldListenRef.current = false;
            recognitionRef.current = null;
        }
    }, [SpeechRecognition]);

    const resetTranscript = useCallback(() => {
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
