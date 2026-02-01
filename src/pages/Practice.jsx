import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout';
import { Mic, MicOff, ArrowRight, Check, Brain, MessageSquare, Calculator, Volume2, VolumeX, ChevronLeft } from 'lucide-react';
import { useSpeechToText } from '../hooks';
import { interviewAPI } from '../services/api';
import './Practice.css';

const categories = [
    {
        id: 'hr',
        name: 'HR Interview',
        icon: MessageSquare,
        color: '#52c6c9',
        description: 'Behavioral & situational questions',
        topics: null // No topic selection for HR
    },
    {
        id: 'technical',
        name: 'Technical',
        icon: Brain,
        color: '#a78bfa',
        description: 'Programming & problem-solving',
        topics: [
            { id: 'dsa', name: 'Data Structures & Algorithms' },
            { id: 'webdev', name: 'Web Development' },
            { id: 'python', name: 'Python Programming' },
            { id: 'java', name: 'Java Programming' },
            { id: 'database', name: 'Database & SQL' },
            { id: 'os', name: 'Operating Systems' },
            { id: 'networking', name: 'Computer Networks' },
        ]
    },
    {
        id: 'aptitude',
        name: 'Aptitude',
        icon: Calculator,
        color: '#4ade80',
        description: 'Logical reasoning & math',
        topics: null // No topic selection for Aptitude
    },
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
    const [stage, setStage] = useState('select'); // select, topic, interview, results
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
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

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        const cat = categories.find(c => c.id === category);

        if (cat.topics) {
            // Go to topic selection for technical
            setStage('topic');
        } else {
            // Start interview directly
            startInterview(category, null);
        }
    };

    const handleTopicSelect = (topicId) => {
        setSelectedTopic(topicId);
        startInterview(selectedCategory, topicId);
    };

    const startInterview = async (category, topic) => {
        setIsLoading(true);
        try {
            const data = await interviewAPI.startInterview(category, topic);
            setInterview(data);
            setStage('interview');
            setCurrentQuestionIndex(0);
            setEvaluations([]);
        } catch (error) {
            console.error('Failed to start interview:', error);
            // Fallback - still start with API, but show error
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

        // Stop any ongoing speech
        stopSpeaking();

        setIsLoading(true);
        try {
            const question = interview.questions[currentQuestionIndex];
            const data = await interviewAPI.submitAnswer(
                interview.interviewId,
                question.id,
                transcript,
                transcript
            );
            setEvaluations([...evaluations, data.evaluation]);

            if (currentQuestionIndex < interview.questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                resetTranscript();
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
        setSelectedCategory(null);
        setSelectedTopic(null);
        setInterview(null);
        setResults(null);
        setCurrentQuestionIndex(0);
        setEvaluations([]);
        resetTranscript();
    };

    const goBack = () => {
        if (stage === 'topic') {
            setStage('select');
            setSelectedCategory(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="practice">
                {/* Category Selection */}
                {stage === 'select' && (
                    <div className="practice__select animate-fade-in">
                        <h2 className="practice__title">Choose Interview Type</h2>
                        <p className="practice__subtitle">Select a category to start your practice session (5 questions)</p>

                        <div className="practice__categories">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    className="practice__category glass-card"
                                    onClick={() => handleCategorySelect(cat.id)}
                                    disabled={isLoading}
                                    style={{ '--cat-color': cat.color }}
                                >
                                    <div className="practice__category-icon">
                                        <cat.icon size={32} />
                                    </div>
                                    <h3 className="practice__category-name">{cat.name}</h3>
                                    <p className="practice__category-desc">{cat.description}</p>
                                    {cat.topics && <span className="practice__category-badge">Select Topic</span>}
                                    <ArrowRight size={20} className="practice__category-arrow" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Topic Selection for Technical */}
                {stage === 'topic' && (
                    <div className="practice__topic animate-fade-in">
                        <button className="practice__back-btn" onClick={goBack}>
                            <ChevronLeft size={20} />
                            Back
                        </button>

                        <h2 className="practice__title">Select Technical Topic</h2>
                        <p className="practice__subtitle">Choose a topic for your technical interview</p>

                        <div className="practice__topics">
                            {categories.find(c => c.id === selectedCategory)?.topics?.map((topic) => (
                                <button
                                    key={topic.id}
                                    className="practice__topic-btn glass-card"
                                    onClick={() => handleTopicSelect(topic.id)}
                                    disabled={isLoading}
                                >
                                    <span>{topic.name}</span>
                                    <ArrowRight size={18} />
                                </button>
                            ))}
                        </div>

                        {isLoading && (
                            <div className="practice__loading">
                                <div className="practice__loading-spinner"></div>
                                <p>Preparing your interview questions...</p>
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
                                    {categories.find(c => c.id === selectedCategory)?.name}
                                    {selectedTopic && ` - ${categories.find(c => c.id === selectedCategory)?.topics?.find(t => t.id === selectedTopic)?.name}`}
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
                            <p>You've completed the {categories.find(c => c.id === selectedCategory)?.name} practice session</p>
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
                            Practice Another Category
                        </button>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && stage === 'select' && (
                    <div className="practice__loading-overlay">
                        <div className="practice__loading-spinner"></div>
                        <p>Generating questions with AI...</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
