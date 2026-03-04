import { useState, useCallback, useRef } from 'react';

export function useSpeechToText() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    // Accumulated text from previous start/stop cycles
    const savedTextRef = useRef('');

    const SpeechRecognition = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null;

    const stopListening = useCallback(() => {
        setIsListening(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        }
        // Save current transcript for next start
        savedTextRef.current = transcript;
    }, [transcript]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) {
            setError('Speech recognition not supported.');
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
            recognitionRef.current = null;
        }

        setError(null);
        const prefix = savedTextRef.current;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let final = '';
            let interim = '';

            for (let i = 0; i < event.results.length; i++) {
                const text = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += text + ' ';
                } else {
                    interim += text;
                }
            }

            setTranscript(prefix + final + interim);
        };

        recognition.onerror = (event) => {
            if (event.error === 'aborted' || event.error === 'no-speech') return;
            console.error('Speech error:', event.error);
            setError(`Mic error: ${event.error}`);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error('Failed to start:', e);
            setError('Could not start recording. Try again.');
        }
    }, [SpeechRecognition]);

    const resetTranscript = useCallback(() => {
        savedTextRef.current = '';
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
