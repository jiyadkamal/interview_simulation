import { useState, useCallback, useRef, useEffect } from 'react';

export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const transcriptRef = useRef('');

    // Keep refs in sync with state
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        const createRecognition = () => {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = 0; i < event.results.length; i++) {
                    const result = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += result + ' ';
                    } else {
                        interimTranscript += result;
                    }
                }

                // Build full transcript from all final results + current interim
                setTranscript(finalTranscript + interimTranscript);
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);

                // Don't stop on "no-speech" or "aborted" — these are recoverable
                if (event.error === 'no-speech' || event.error === 'aborted') {
                    // Auto-restart if still supposed to be listening
                    if (isListeningRef.current) {
                        try {
                            setTimeout(() => {
                                if (isListeningRef.current && recognitionRef.current) {
                                    recognitionRef.current.start();
                                }
                            }, 100);
                        } catch (e) {
                            console.warn('Failed to restart after error:', e);
                        }
                    }
                    return;
                }

                // For other errors (not-allowed, network, etc.), actually stop
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => {
                // Auto-restart if we're still supposed to be listening
                // (recognition can end unexpectedly due to silence timeout)
                if (isListeningRef.current) {
                    try {
                        setTimeout(() => {
                            if (isListeningRef.current && recognitionRef.current) {
                                recognitionRef.current.start();
                            }
                        }, 100);
                    } catch (e) {
                        console.warn('Failed to restart recognition:', e);
                        setIsListening(false);
                    }
                }
            };

            return recognition;
        };

        recognitionRef.current = createRecognition();

        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // ignore
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;

        // Stop any existing session first
        try {
            recognitionRef.current.stop();
        } catch (e) {
            // ignore - might not be running
        }

        setError(null);

        // Small delay to let previous session fully close
        setTimeout(() => {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                console.warn('Failed to start recognition:', e);
                // Retry once more after a brief wait
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                        setIsListening(true);
                    } catch (e2) {
                        console.error('Failed to start recognition on retry:', e2);
                        setError('Could not start recording. Please try again.');
                    }
                }, 200);
            }
        }, 150);
    }, []);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isListeningRef.current = false;
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // ignore
            }
        }
    }, []);

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
        isSupported: !!recognitionRef.current,
    };
}

export default useSpeechToText;
