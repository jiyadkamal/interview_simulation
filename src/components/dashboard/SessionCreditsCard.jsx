import { CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import './SessionCreditsCard.css';

export default function SessionCreditsCard({
    totalCredits = 50,
    usedCredits = 27,
    recentActivity = [
        { type: 'used', label: 'Technical Interview', amount: 1 },
        { type: 'earned', label: 'Weekly Bonus', amount: 5 },
    ]
}) {
    return (
        <div className="credits-card glass-card">
            <div className="credits-card__header">
                <span className="credits-card__label">Total Balance</span>
                <div className="credits-card__balance">
                    <span className="credits-card__value">{totalCredits - usedCredits}</span>
                    <span className="credits-card__unit">Credits</span>
                </div>
            </div>

            <div className="credits-card__visual">
                <div className="credits-card__chip">
                    <div className="credits-card__chip-lines">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                <div className="credits-card__badge">
                    <CreditCard size={16} />
                    <span>INTERVIEW</span>
                </div>
                <div className="credits-card__number">**** **** **** {String(totalCredits).padStart(4, '0')}</div>
            </div>

            <div className="credits-card__stats">
                <div className="credits-card__stat">
                    <span className="credits-card__stat-label">Used</span>
                    <span className="credits-card__stat-value">{usedCredits}</span>
                </div>
                <div className="credits-card__stat">
                    <span className="credits-card__stat-label">Remaining</span>
                    <span className="credits-card__stat-value">{totalCredits - usedCredits}</span>
                </div>
            </div>

            <div className="credits-card__progress">
                <div
                    className="credits-card__progress-fill"
                    style={{ width: `${((totalCredits - usedCredits) / totalCredits) * 100}%` }}
                ></div>
            </div>

            <div className="credits-card__actions">
                <button className="credits-card__action-btn">
                    <ArrowDownLeft size={16} />
                    <span>Request</span>
                </button>
                <button className="credits-card__action-btn">
                    <ArrowUpRight size={16} />
                    <span>Send</span>
                </button>
            </div>
        </div>
    );
}
