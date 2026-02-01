import { Link } from 'react-router-dom';
import { Sparkles, Mic, Brain, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';
import './Landing.css';

const features = [
    {
        icon: Mic,
        title: 'Voice-Based Practice',
        description: 'Practice answering questions using speech recognition technology'
    },
    {
        icon: Brain,
        title: 'AI-Powered Feedback',
        description: 'Get instant, personalized feedback powered by Google Gemini AI'
    },
    {
        icon: BarChart3,
        title: 'Track Progress',
        description: 'Monitor your improvement with detailed analytics and insights'
    }
];

const benefits = [
    'HR, Technical & Aptitude interviews',
    'Real-time speech-to-text',
    'AI evaluation of your answers',
    'Personalized improvement tips',
    'Performance tracking dashboard',
    'Practice anytime, anywhere'
];

export default function Landing() {
    return (
        <div className="landing">
            {/* Navigation */}
            <nav className="landing__nav">
                <div className="landing__nav-logo">
                    <div className="landing__logo-icon">
                        <Sparkles size={24} />
                    </div>
                    <span className="landing__logo-text">InterviewAI</span>
                </div>
                <div className="landing__nav-actions">
                    <Link to="/login" className="landing__nav-link">Sign In</Link>
                    <Link to="/register" className="landing__nav-btn">
                        Get Started
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing__hero">
                <div className="landing__hero-content">
                    <span className="landing__hero-badge">
                        🚀 AI-Powered Interview Practice
                    </span>
                    <h1 className="landing__hero-title">
                        Ace Your Next Interview with
                        <span className="landing__hero-highlight"> AI Coaching</span>
                    </h1>
                    <p className="landing__hero-subtitle">
                        Practice HR, Technical, and Aptitude interviews with real-time AI feedback.
                        Improve your confidence and land your dream job.
                    </p>
                    <div className="landing__hero-actions">
                        <Link to="/register" className="landing__btn landing__btn--primary">
                            Start Practicing Free
                            <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="landing__btn landing__btn--ghost">
                            I have an account
                        </Link>
                    </div>
                </div>
                <div className="landing__hero-visual">
                    <div className="landing__hero-card glass-card">
                        <div className="landing__hero-card-header">
                            <span className="landing__hero-card-badge">HR Interview</span>
                            <span className="landing__hero-card-score">Score: 85%</span>
                        </div>
                        <p className="landing__hero-card-question">
                            "Tell me about yourself and your background."
                        </p>
                        <div className="landing__hero-card-feedback">
                            <CheckCircle size={16} />
                            <span>Great structure! Consider adding specific achievements.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing__features">
                <h2 className="landing__section-title">How It Works</h2>
                <p className="landing__section-subtitle">
                    Three simple steps to improve your interview skills
                </p>
                <div className="landing__features-grid">
                    {features.map((feature, index) => (
                        <div key={index} className="landing__feature glass-card">
                            <div className="landing__feature-icon">
                                <feature.icon size={28} />
                            </div>
                            <h3 className="landing__feature-title">{feature.title}</h3>
                            <p className="landing__feature-desc">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits Section */}
            <section className="landing__benefits">
                <div className="landing__benefits-content">
                    <h2 className="landing__section-title">Everything You Need</h2>
                    <p className="landing__section-subtitle">
                        Comprehensive interview preparation platform
                    </p>
                    <ul className="landing__benefits-list">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="landing__benefit-item">
                                <CheckCircle size={20} />
                                <span>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="landing__btn landing__btn--primary">
                        Get Started Now
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing__cta glass-card">
                <h2 className="landing__cta-title">Ready to Ace Your Interview?</h2>
                <p className="landing__cta-subtitle">
                    Join thousands of candidates who improved their interview skills with InterviewAI
                </p>
                <Link to="/register" className="landing__btn landing__btn--primary">
                    Start Free Practice
                    <ArrowRight size={20} />
                </Link>
            </section>

            {/* Footer */}
            <footer className="landing__footer">
                <div className="landing__footer-logo">
                    <Sparkles size={20} />
                    <span>InterviewAI</span>
                </div>
                <p className="landing__footer-text">
                    © 2024 InterviewAI. Built with ❤️ for job seekers.
                </p>
            </footer>
        </div>
    );
}
