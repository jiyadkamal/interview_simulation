import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout';
import { Mic, MicOff, ArrowRight, Check, Volume2, VolumeX, ChevronLeft, Search } from 'lucide-react';
import { useSpeechToText } from '../hooks';
import { interviewAPI } from '../services/api';
import './Practice.css';

const presetTypes = [
    { label: 'School Entry', value: 'Interview for school entry' },
    { label: 'College Admission', value: 'Interview for college admission' },
    { label: 'Job Interview (HR)', value: 'HR/Behavioral job interview' },
    { label: 'Technical Interview', value: 'Technical software engineering interview' },
    { label: 'MBA Admission', value: 'MBA admission interview' },
    { label: 'Internship', value: 'Internship interview' },
    { label: 'Scholarship', value: 'Scholarship interview' },
    { label: 'Government Job', value: 'Government job interview' },
];

// Text-to-Speech function
const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to get a good voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        window.speechSynthesis.speak(utterance);
        return true;
    }
    return false;
};

export default function Practice() {
    const [stage, setStage] = useState('select'); // select, count, interview, results
    const [interviewType, setInterviewType] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [interview, setInterview] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [evaluations, setEvaluations] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [autoSpeak, setAutoSpeak] = useState(true);

    const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechToText();

    // Speak question when it changes
    const currentQuestion = interview?.questions?.[currentQuestionIndex]?.question;

    useEffect(() => {
        if (currentQuestion && stage === 'interview' && autoSpeak) {
            setIsSpeaking(true);
            speakQuestion(currentQuestion);

            // Set speaking to false after estimated duration
            const wordCount = currentQuestion.split(' ').length;
            const duration = Math.max(2000, wordCount * 400); // ~400ms per word
            setTimeout(() => setIsSpeaking(false), duration);
        }
    }, [currentQuestion, stage, autoSpeak]);

    const handleTypeSelect = (value) => {
        setInterviewType(value);
    };

    const handleContinue = () => {
        if (interviewType.trim().length >= 2) {
            setStage('count');
        }
    };

    const handleStartWithCount = () => {
        const count = Math.min(20, Math.max(1, numQuestions));
        setNumQuestions(count);
        startInterview(interviewType.trim(), count);
    };

    const startInterview = async (type, count) => {
        setIsLoading(true);
        try {
            const data = await interviewAPI.startInterview(type, count);
            setInterview(data);
            setStage('interview');
            setCurrentQuestionIndex(0);
            setEvaluations([]);
        } catch (error) {
            console.error('Failed to start interview:', error);
            alert('Failed to connect to server. Please try again.');
            setStage('select');
        } finally {
            setIsLoading(false);
        }
    };

    const speakCurrentQuestion = () => {
        if (currentQuestion) {
            setIsSpeaking(true);
            speakQuestion(currentQuestion);
            const wordCount = currentQuestion.split(' ').length;
            setTimeout(() => setIsSpeaking(false), Math.max(2000, wordCount * 400));
        }
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    const submitAnswer = async () => {
        if (!transcript.trim()) return;

        // Stop recording and speech
        stopListening();
        stopSpeaking();

        const currentTranscript = transcript;

        setIsLoading(true);
        try {
            const question = interview.questions[currentQuestionIndex];
            const data = await interviewAPI.submitAnswer(
                interview.interviewId,
                question.id,
                currentTranscript,
                currentTranscript
            );
            setEvaluations([...evaluations, data.evaluation]);

            if (currentQuestionIndex < interview.questions.length - 1) {
                resetTranscript();
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // Complete interview
                const results = await interviewAPI.completeInterview(interview.interviewId);
                setResults(results.results);
                setStage('results');
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
            alert('Failed to submit answer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetPractice = () => {
        stopSpeaking();
        setStage('select');
        setInterviewType('');
        setNumQuestions(5);
        setInterview(null);
        setResults(null);
        setCurrentQuestionIndex(0);
        setEvaluations([]);
        resetTranscript();
    };

    const goBack = () => {
        if (stage === 'count') {
            setStage('select');
        }
    };

    return (
        <DashboardLayout>
            <div className="practice">
                {/* Interview Type Selection */}
                {stage === 'select' && (
                    <div className="practice__select animate-fade-in">
                        <h2 className="practice__title">What type of interview?</h2>
                        <p className="practice__subtitle">Type your interview type or pick one from below</p>

                        <div className="practice__type-input-wrap glass-card">
                            <Search size={20} className="practice__type-input-icon" />
                            <input
                                type="text"
                                className="practice__type-input"
                                value={interviewType}
                                onChange={(e) => setInterviewType(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                                placeholder="e.g. Interview for school entry, MBA admission..."
                                autoFocus
                            />
                        </div>

                        <div className="practice__presets">
                            {presetTypes.map((preset) => (
                                <button
                                    key={preset.value}
                                    className={`practice__preset-btn ${interviewType === preset.value ? 'practice__preset-btn--active' : ''}`}
                                    onClick={() => handleTypeSelect(preset.value)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <button
                            className="practice__continue-btn"
                            onClick={handleContinue}
                            disabled={interviewType.trim().length < 2}
                        >
                            Continue
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}

                {/* Question Count Selection */}
                {stage === 'count' && (
                    <div className="practice__count animate-fade-in">
                        <button className="practice__back-btn" onClick={goBack}>
                            <ChevronLeft size={20} />
                            Back
                        </button>

                        <h2 className="practice__title">How Many Questions?</h2>
                        <p className="practice__subtitle">
                            Choose the number of questions for your <strong>{interviewType}</strong> session
                        </p>

                        <div className="practice__count-input-wrap">
                            <div className="practice__count-field glass-card">
                                <label className="practice__count-field-label" htmlFor="numQuestions">Number of Questions</label>
                                <input
                                    id="numQuestions"
                                    type="number"
                                    className="practice__count-input"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                                    min={1}
                                    max={20}
                                    disabled={isLoading}
                                />
                                <span className="practice__count-hint">Enter 1 to 20 questions</span>
                            </div>
                            <button
                                className="practice__start-btn"
                                onClick={handleStartWithCount}
                                disabled={isLoading || numQuestions < 1}
                            >
                                {isLoading ? 'Generating...' : 'Start Interview'}
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        {isLoading && (
                            <div className="practice__loading">
                                <div className="practice__loading-spinner"></div>
                                <p>Generating {numQuestions} questions with AI...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Interview */}
                {stage === 'interview' && interview && (
                    <div className="practice__interview animate-fade-in">
                        <div className="practice__progress">
                            <span>Question {currentQuestionIndex + 1} of {interview.questions.length}</span>
                            <div className="practice__progress-bar">
                                <div
                                    className="practice__progress-fill"
                                    style={{ width: `${((currentQuestionIndex + 1) / interview.questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="practice__question glass-card">
                            <div className="practice__question-header">
                                <span className="practice__question-badge">
                                    {interviewType}
                                </span>
                                <button
                                    className={`practice__speak-btn ${isSpeaking ? 'practice__speak-btn--active' : ''}`}
                                    onClick={isSpeaking ? stopSpeaking : speakCurrentQuestion}
                                    title={isSpeaking ? 'Stop speaking' : 'Read question aloud'}
                                >
                                    {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>
                            <h3 className="practice__question-text">
                                {interview.questions[currentQuestionIndex]?.question}
                            </h3>
                            {interview.questions[currentQuestionIndex]?.tips && (
                                <p className="practice__question-tip">
                                    💡 Tip: {interview.questions[currentQuestionIndex].tips}
                                </p>
                            )}
                        </div>

                        <div className="practice__answer glass-card">
                            <div className="practice__answer-header">
                                <h4>Your Answer (Speech-to-Text)</h4>
                                <label className="practice__auto-speak">
                                    <input
                                        type="checkbox"
                                        checked={autoSpeak}
                                        onChange={(e) => setAutoSpeak(e.target.checked)}
                                    />
                                    Auto-speak questions
                                </label>
                            </div>

                            <div className="practice__transcript">
                                {transcript || 'Click the microphone to start speaking...'}
                            </div>

                            <div className="practice__controls">
                                <button
                                    className={`practice__mic-btn ${isListening ? 'practice__mic-btn--active animate-recording' : ''}`}
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={!isSupported}
                                >
                                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                                    <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
                                </button>

                                <button
                                    className="practice__submit-btn"
                                    onClick={submitAnswer}
                                    disabled={!transcript.trim() || isLoading}
                                >
                                    {isLoading ? 'Evaluating...' : currentQuestionIndex === interview.questions.length - 1 ? 'Submit & Finish' : 'Next Question'}
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {stage === 'results' && results && (
                    <div className="practice__results animate-fade-in">
                        <div className="practice__results-header glass-card">
                            <div className="practice__results-icon">
                                <Check size={40} />
                            </div>
                            <h2>Interview Complete!</h2>
                            <p>You've completed the <strong>{interviewType}</strong> practice session</p>
                        </div>

                        <div className="practice__results-stats">
                            <div className="practice__stat glass-card">
                                <span className="practice__stat-value">{results.totalQuestions || results.answeredQuestions || 5}</span>
                                <span className="practice__stat-label">Questions</span>
                            </div>
                            <div className="practice__stat glass-card">
                                <span className="practice__stat-value">{results.averageScore || 0}%</span>
                                <span className="practice__stat-label">Avg. Score</span>
                            </div>
                            <div className="practice__stat glass-card">
                                <span className="practice__stat-value">{evaluations.length}</span>
                                <span className="practice__stat-label">Answered</span>
                            </div>
                        </div>

                        {/* Show individual evaluations */}
                        {evaluations.length > 0 && (
                            <div className="practice__evaluations">
                                <h3>Question Feedback</h3>
                                {evaluations.map((evaluation, idx) => (
                                    <div key={idx} className="practice__evaluation glass-card">
                                        <div className="practice__evaluation-header">
                                            <span>Question {idx + 1}</span>
                                            <span className="practice__evaluation-score">{evaluation.score * 10}%</span>
                                        </div>
                                        <p className="practice__evaluation-feedback">{evaluation.feedback}</p>
                                        {evaluation.strengths && (
                                            <p className="practice__evaluation-strengths">
                                                <strong>Strengths:</strong> {evaluation.strengths.join(', ')}
                                            </p>
                                        )}
                                        {evaluation.improvements && (
                                            <p className="practice__evaluation-improvements">
                                                <strong>Improve:</strong> {evaluation.improvements.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <button className="practice__restart-btn" onClick={resetPractice}>
                            Practice Another Interview
                        </button>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (stage === 'select') && (
                    <div className="practice__loading-overlay">
                        <div className="practice__loading-spinner"></div>
                        <p>Generating questions with AI...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
