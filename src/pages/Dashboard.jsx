import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout';
import {
    InterviewReadinessCard,
    PerformanceGraph,
    SkillProgressCard,
    CalendarWidget
} from '../components/dashboard';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context';
import './Dashboard.css';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);
                const data = await dashboardAPI.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
                setError(err.message);
                // Use default values if API fails
                setStats({
                    user: { name: user?.name || 'User', totalInterviews: 0, avgScore: 0 },
                    stats: {
                        readinessScore: 0,
                        totalInterviews: 0,
                        categoryStats: {
                            hr: { total: 0, avgScore: 0 },
                            technical: { total: 0, avgScore: 0 },
                            aptitude: { total: 0, avgScore: 0 }
                        },
                        weeklyProgress: []
                    }
                });
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="dashboard dashboard--loading">
                    <div className="dashboard__skeleton glass-card skeleton" style={{ height: '320px' }}></div>
                    <div className="dashboard__skeleton glass-card skeleton" style={{ height: '320px' }}></div>
                    <div className="dashboard__skeleton glass-card skeleton" style={{ height: '200px' }}></div>
                    <div className="dashboard__skeleton glass-card skeleton" style={{ height: '200px' }}></div>
                </div>
            </DashboardLayout>
        );
    }

    const { user: userData, stats: dashStats } = stats || {};
    const categoryStats = dashStats?.categoryStats || {};

    return (
        <DashboardLayout>
            {/* SVG Gradients for charts */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#52c6c9" />
                        <stop offset="50%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="dashboard">
                {/* Row 1: Readiness + Performance Graph */}
                <div className="dashboard__row dashboard__row--top">
                    <div className="dashboard__col dashboard__col--readiness">
                        <InterviewReadinessCard
                            score={dashStats?.readinessScore || 0}
                            totalInterviews={dashStats?.totalInterviews || 0}
                            avgScore={userData?.avgScore || dashStats?.readinessScore || 0}
                            label="Interview Readiness"
                            subtitle="Overall performance score"
                        />
                    </div>
                    <div className="dashboard__col dashboard__col--graph">
                        <PerformanceGraph
                            currentScore={dashStats?.readinessScore || 0}
                            improvement={dashStats?.totalInterviews > 0 ?
                                Math.round((dashStats.readinessScore / 100) * 30) : 0}
                            weeklyData={dashStats?.weeklyProgress}
                        />
                    </div>
                </div>

                {/* Row 2: Skills + Calendar */}
                <div className="dashboard__row dashboard__row--bottom">
                    <div className="dashboard__col dashboard__col--skills">
                        <SkillProgressCard
                            hrScore={categoryStats.hr?.avgScore || 0}
                            technicalScore={categoryStats.technical?.avgScore || 0}
                            aptitudeScore={categoryStats.aptitude?.avgScore || 0}
                            totalSessions={dashStats?.totalInterviews || 0}
                        />
                    </div>
                    <div className="dashboard__col dashboard__col--calendar">
                        <CalendarWidget />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
