import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { adminAPI } from '../services/api';
import { Users, BarChart3, Target, Activity, TrendingUp, Award, LogOut, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Admin.css';

const CATEGORY_COLORS = {
    hr: '#52c6c9',
    technical: '#a78bfa',
    aptitude: '#4ade80',
};

const SCORE_COLORS = ['#ef4444', '#f97316', '#fbbf24', '#4ade80', '#22d3ee'];

export default function Admin() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchAdminStats() {
            try {
                setLoading(true);
                const data = await adminAPI.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAdminStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (user?.role !== 'admin') {
        return (
            <div className="admin-page">
                <div className="admin__denied animate-fade-in">
                    <div className="admin__denied-icon">🔒</div>
                    <h2>Access Denied</h2>
                    <p>You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-page__header">
                    <div className="admin-page__logo">
                        <Sparkles size={22} />
                        <span>InterviewAI Admin</span>
                    </div>
                </div>
                <div className="admin admin--loading">
                    <div className="admin__skeleton glass-card skeleton" style={{ height: '120px' }}></div>
                    <div className="admin__skeleton glass-card skeleton" style={{ height: '120px' }}></div>
                    <div className="admin__skeleton glass-card skeleton" style={{ height: '120px' }}></div>
                    <div className="admin__skeleton glass-card skeleton" style={{ height: '120px' }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-page">
                <div className="admin__error animate-fade-in">
                    <h2>Failed to Load Analytics</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const {
        totalUsers = 0,
        totalInterviews = 0,
        avgPlatformScore = 0,
        activeToday = 0,
        categoryStats = [],
        scoreDistribution = [],
        dailyActivity = [],
        recentInterviews = [],
        topPerformers = [],
    } = stats || {};

    const pieData = categoryStats.filter(c => c.count > 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="admin__chart-tooltip">
                    <p>{payload[0].payload.day || payload[0].name}</p>
                    <p className="admin__chart-tooltip-value">{payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="admin-page">
            {/* Admin Top Bar */}
            <div className="admin-page__header">
                <div className="admin-page__logo">
                    <Sparkles size={22} />
                    <span>InterviewAI Admin</span>
                </div>
                <div className="admin-page__actions">
                    <span className="admin-page__user">
                        {user?.name || user?.email}
                    </span>
                    <button className="admin-page__logout" onClick={handleLogout}>
                        <LogOut size={18} />
                        Log Out
                    </button>
                </div>
            </div>

            <div className="admin animate-fade-in">
                <div className="admin__header">
                    <div>
                        <h1 className="admin__title">Platform Analytics</h1>
                        <p className="admin__subtitle">Overview of all users, interviews, and performance data</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="admin__stats-row">
                    <div className="admin__stat-card glass-card">
                        <div className="admin__stat-icon admin__stat-icon--users">
                            <Users size={22} />
                        </div>
                        <div className="admin__stat-info">
                            <span className="admin__stat-value">{totalUsers}</span>
                            <span className="admin__stat-label">Total Users</span>
                        </div>
                    </div>
                    <div className="admin__stat-card glass-card">
                        <div className="admin__stat-icon admin__stat-icon--interviews">
                            <BarChart3 size={22} />
                        </div>
                        <div className="admin__stat-info">
                            <span className="admin__stat-value">{totalInterviews}</span>
                            <span className="admin__stat-label">Total Interviews</span>
                        </div>
                    </div>
                    <div className="admin__stat-card glass-card">
                        <div className="admin__stat-icon admin__stat-icon--score">
                            <Target size={22} />
                        </div>
                        <div className="admin__stat-info">
                            <span className="admin__stat-value">{avgPlatformScore}%</span>
                            <span className="admin__stat-label">Avg. Score</span>
                        </div>
                    </div>
                    <div className="admin__stat-card glass-card">
                        <div className="admin__stat-icon admin__stat-icon--active">
                            <Activity size={22} />
                        </div>
                        <div className="admin__stat-info">
                            <span className="admin__stat-value">{activeToday}</span>
                            <span className="admin__stat-label">Active Today</span>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="admin__charts-row">
                    {/* Category Breakdown */}
                    <div className="admin__chart-card glass-card">
                        <h3 className="admin__chart-title">Category Breakdown</h3>
                        {pieData.length > 0 ? (
                            <div className="admin__pie-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="count"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={75}
                                            innerRadius={45}
                                            paddingAngle={4}
                                            strokeWidth={0}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={index} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="admin__pie-legend">
                                    {categoryStats.map((cat) => (
                                        <div key={cat.category} className="admin__pie-legend-item">
                                            <span
                                                className="admin__pie-legend-dot"
                                                style={{ background: CATEGORY_COLORS[cat.category] }}
                                            ></span>
                                            <span className="admin__pie-legend-label">
                                                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                            </span>
                                            <span className="admin__pie-legend-value">{cat.count}</span>
                                            <span className="admin__pie-legend-score">({cat.avgScore}%)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="admin__chart-empty">No interview data yet</div>
                        )}
                    </div>

                    {/* Daily Activity */}
                    <div className="admin__chart-card glass-card">
                        <h3 className="admin__chart-title">Daily Activity (Last 7 Days)</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={dailyActivity} barSize={28}>
                                <XAxis
                                    dataKey="day"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill="#4fd1d9" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="admin__score-dist glass-card">
                    <h3 className="admin__chart-title">Score Distribution</h3>
                    <div className="admin__score-bars">
                        {scoreDistribution.map((range, idx) => {
                            const maxCount = Math.max(...scoreDistribution.map(r => r.count), 1);
                            const pct = (range.count / maxCount) * 100;
                            return (
                                <div key={range.label} className="admin__score-bar-row">
                                    <span className="admin__score-bar-label">{range.label}</span>
                                    <div className="admin__score-bar-track">
                                        <div
                                            className="admin__score-bar-fill"
                                            style={{ width: `${pct}%`, background: SCORE_COLORS[idx] }}
                                        ></div>
                                    </div>
                                    <span className="admin__score-bar-count">{range.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Row: Recent Interviews + Top Performers */}
                <div className="admin__bottom-row">
                    {/* Recent Interviews */}
                    <div className="admin__table-card glass-card">
                        <h3 className="admin__chart-title">Recent Interviews</h3>
                        {recentInterviews.length > 0 ? (
                            <div className="admin__table-wrapper">
                                <table className="admin__table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Category</th>
                                            <th>Score</th>
                                            <th>Questions</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentInterviews.map((interview) => (
                                            <tr key={interview.id}>
                                                <td>
                                                    <div className="admin__user-cell">
                                                        <div className="admin__user-avatar">
                                                            {interview.userName?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <span>{interview.userName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="admin__category-badge"
                                                        style={{ '--cat-color': CATEGORY_COLORS[interview.category] || '#64748b' }}
                                                    >
                                                        {interview.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`admin__score ${interview.score >= 70 ? 'admin__score--high' : interview.score >= 40 ? 'admin__score--mid' : 'admin__score--low'}`}>
                                                        {interview.score}%
                                                    </span>
                                                </td>
                                                <td>{interview.questionsCount}</td>
                                                <td className="admin__date">
                                                    {new Date(interview.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin__chart-empty">No interviews yet</div>
                        )}
                    </div>

                    {/* Top Performers */}
                    <div className="admin__performers glass-card">
                        <h3 className="admin__chart-title">
                            <Award size={18} /> Top Performers
                        </h3>
                        {topPerformers.length > 0 ? (
                            <div className="admin__performers-list">
                                {topPerformers.map((performer, idx) => (
                                    <div key={performer.email} className="admin__performer-item">
                                        <div className="admin__performer-rank">
                                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                        </div>
                                        <div className="admin__performer-info">
                                            <span className="admin__performer-name">{performer.name}</span>
                                            <span className="admin__performer-meta">
                                                {performer.totalInterviews} interviews
                                            </span>
                                        </div>
                                        <div className="admin__performer-score">
                                            <TrendingUp size={14} />
                                            {performer.avgScore}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="admin__chart-empty">No data yet</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
