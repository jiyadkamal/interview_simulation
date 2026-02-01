import { Bell, Filter, Calendar } from 'lucide-react';
import './Header.css';

export default function Header({ userName = 'Student' }) {
    const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <header className="header">
            <div className="header__left">
                <div className="header__avatar">
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="header__greeting">
                    <span className="header__greeting-text">Hello, {userName}</span>
                </div>
            </div>

            <h1 className="header__title">Dashboard</h1>

            <div className="header__actions">
                <button className="header__action-btn">
                    <span>Report</span>
                </button>
                <button className="header__action-btn header__action-btn--icon">
                    <Filter size={18} />
                </button>
                <button className="header__action-btn header__action-btn--date">
                    <Calendar size={16} />
                    <span>{today}</span>
                </button>
                <button className="header__action-btn header__action-btn--icon header__action-btn--notification">
                    <Bell size={18} />
                </button>
                <button className="header__action-btn header__action-btn--icon header__action-btn--grid">
                    <div className="header__grid-icon">
                        <span></span><span></span><span></span><span></span>
                    </div>
                </button>
            </div>
        </header>
    );
}
