import { Target } from 'lucide-react';
import './SkillProgressCard.css';

export default function SkillProgressCard({
    hrScore = 0,
    technicalScore = 0,
    aptitudeScore = 0,
    totalSessions = 0
}) {
    const skills = [
        { name: 'HR Interview', progress: hrScore, color: 'var(--accent-teal)' },
        { name: 'Technical', progress: technicalScore, color: 'var(--accent-purple)' },
        { name: 'Aptitude', progress: aptitudeScore, color: 'var(--accent-green)' },
    ];

    return (
        <div className="skill-progress glass-card glass-card--elevated">
            <div className="skill-progress__header">
                <div className="skill-progress__header-icon">
                    <Target size={20} />
                </div>
                <h3 className="skill-progress__title">Practice Progress</h3>
            </div>

            <div className="skill-progress__sessions">
                <div className="skill-progress__sessions-value">
                    <span className="skill-progress__sessions-current">{totalSessions}</span>
                    <span className="skill-progress__sessions-label"> interviews completed</span>
                </div>
            </div>

            <div className="skill-progress__divider">
                <span>🎯 Skill Scores</span>
            </div>

            <div className="skill-progress__skills">
                {skills.map((skill, index) => (
                    <div key={index} className="skill-progress__skill-item">
                        <div className="skill-progress__skill-icon" style={{ background: skill.color }}>
                            {skill.name.charAt(0)}
                        </div>
                        <div className="skill-progress__skill-info">
                            <div className="skill-progress__skill-header">
                                <span className="skill-progress__skill-name">{skill.name}</span>
                                <span className="skill-progress__skill-score">{skill.progress}%</span>
                            </div>
                            <div className="skill-progress__skill-bar">
                                <div
                                    className="skill-progress__skill-bar-fill"
                                    style={{ width: `${skill.progress}%`, background: skill.color }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
