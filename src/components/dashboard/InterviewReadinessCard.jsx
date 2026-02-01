import './InterviewReadinessCard.css';

export default function InterviewReadinessCard({
    score = 0,
    totalInterviews = 0,
    avgScore = 0,
    label = 'Interview Readiness',
    subtitle = 'Overall performance score'
}) {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="readiness-card glass-card">
            <div className="readiness-card__header">
                <div>
                    <h3 className="readiness-card__title">{label}</h3>
                    <p className="readiness-card__subtitle">{subtitle}</p>
                </div>
            </div>

            <div className="readiness-card__progress">
                <svg className="readiness-card__ring" viewBox="0 0 100 100">
                    <circle
                        className="readiness-card__ring-bg"
                        cx="50" cy="50" r="45"
                    />
                    <circle
                        className="readiness-card__ring-fill"
                        cx="50" cy="50" r="45"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                <div className="readiness-card__score">
                    <span className="readiness-card__score-value">{score}</span>
                    <span className="readiness-card__score-percent">%</span>
                </div>
            </div>

            <div className="readiness-card__stats">
                <div className="readiness-card__stat">
                    <span className="readiness-card__stat-label">Interviews Done</span>
                    <span className="readiness-card__stat-value">{totalInterviews}</span>
                </div>
                <div className="readiness-card__stat">
                    <span className="readiness-card__stat-label">Avg. Score</span>
                    <span className="readiness-card__stat-value">{avgScore}%</span>
                </div>
            </div>
        </div>
    );
}
