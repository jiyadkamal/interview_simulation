import { Link } from 'react-router-dom';
import { Sparkles, AudioLines, Zap, Activity, ArrowRight, CheckCircle, BadgeCheck, Stars, Code2 } from 'lucide-react';
import './Landing.css';

const features = [
    {
        icon: AudioLines,
        title: 'Voice-Based Practice',
        description: 'Refine your verbal communication with advanced speech recognition'
    },
    {
        icon: Zap,
        title: 'AI-Powered Insights',
        description: 'Receive instantaneous, technical feedback from our advanced Gemini model'
    },
    {
        icon: Activity,
        title: 'Performance Analytics',
        description: 'Track your growth trajectory through granular data and score trends'
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
                <div className="landing__container landing__nav-wrap">
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
                </div>
            </nav>

            {/* Hero Section */}
            <section className="landing__hero">
                <div className="landing__container">
                    <div className="landing__hero-main">
                        <div className="landing__hero-content">
                            <span className="landing__hero-badge">
                                <Stars size={14} className="landing__badge-icon" />
                                AI-Powered Interview Excellence
                            </span>
                            <h1 className="landing__hero-title">
                                Master Your Interviews with
                                <span className="landing__hero-highlight"> AI Coaching</span>
                            </h1>
                            <p className="landing__hero-subtitle">
                                Practice HR, Technical, and Aptitude interviews with real-time AI feedback.
                                Build confidence and land your dream job with precision.
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
                        <div className="landing__hero-visual-wrap">
                            <div className="landing__hero-visual">
                                <img
                                    src="/hero-ai.png"
                                    alt="AI Interview Coaching"
                                    className="landing__hero-image"
                                />
                                <div className="landing__hero-card glass-card">
                                    <div className="landing__hero-card-header">
                                        <span className="landing__hero-card-badge">HR Interview</span>
                                        <span className="landing__hero-card-score">Score: 88%</span>
                                    </div>
                                    <p className="landing__hero-card-question">
                                        "How do you handle conflict in the workplace?"
                                    </p>
                                    <div className="landing__hero-card-feedback">
                                        <CheckCircle size={16} />
                                        <span>Concise and professional. Explain your resolutions.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing__features">
                <div className="landing__container">
                    <div className="landing__section-header">
                        <h2 className="landing__section-title">Elevate Your Presence</h2>
                        <p className="landing__section-subtitle">
                            Three intelligent steps to refine your professional communication
                        </p>
                    </div>
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
                </div>
            </section>

            {/* Benefits Section */}
            <section className="landing__benefits">
                <div className="landing__container">
                    <div className="landing__benefits-grid">
                        <div className="landing__benefits-content">
                            <h2 className="landing__section-title">Complete Preparation</h2>
                            <p className="landing__section-subtitle">
                                Everything you need to succeed in the modern job market
                            </p>
                            <ul className="landing__benefits-list">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="landing__benefit-item">
                                        <div className="landing__benefit-check">
                                            <BadgeCheck size={20} />
                                        </div>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link to="/register" className="landing__btn landing__btn--primary">
                                Get Started Now
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                        <div className="landing__benefits-visual">
                            {/* Optional: Add a small secondary visual or just keep layout balanced */}
                            <div className="landing__stats-card glass-card">
                                <div className="landing__stat">
                                    <span className="landing__stat-value">5k+</span>
                                    <span className="landing__stat-label">Interviews Practiced</span>
                                </div>
                                <div className="landing__stat">
                                    <span className="landing__stat-value">92%</span>
                                    <span className="landing__stat-label">Success Rate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing__cta-wrap">
                <div className="landing__container">
                    <div className="landing__cta glass-card">
                        <h2 className="landing__cta-title">Ready to Ace Your Next Move?</h2>
                        <p className="landing__cta-subtitle">
                            Join the next generation of professionals advancing their careers with AI
                        </p>
                        <Link to="/register" className="landing__btn landing__btn--primary">
                            Start Your Free Trial
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing__footer">
                <div className="landing__footer-logo">
                    <Sparkles size={20} />
                    <span>InterviewAI</span>
                </div>
                <p className="landing__footer-text">
                    © 2024 InterviewAI. Crafted with <Code2 size={14} /> for future leaders.
                </p>
            </footer>
        </div>
    );
}
