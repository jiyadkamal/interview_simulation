import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateDashboardInsights } from '../services/gemini.js';
import { db, isFirebaseInitialized, memoryStore } from '../config/firebase.js';

const router = express.Router();

// Get dashboard data
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        let user = null;
        let interviews = [];

        if (isFirebaseInitialized && db) {
            // Get user from Realtime Database
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            if (userSnapshot.exists()) {
                user = userSnapshot.val();
            }

            // Get interviews
            const interviewsSnapshot = await db.ref('interviews')
                .orderByChild('userId')
                .equalTo(userId)
                .once('value');

            if (interviewsSnapshot.exists()) {
                const data = interviewsSnapshot.val();
                interviews = Object.values(data)
                    .filter(i => i.status === 'completed')
                    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                    .slice(0, 20);
            }
        } else {
            user = memoryStore.users.get(userId);
            interviews = [...memoryStore.interviews.values()]
                .filter(i => i.userId === userId && i.status === 'completed')
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                .slice(0, 20);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate category-wise stats
        const categoryStats = {
            hr: { total: 0, avgScore: 0 },
            technical: { total: 0, avgScore: 0 },
            aptitude: { total: 0, avgScore: 0 },
        };

        interviews.forEach(interview => {
            if (categoryStats[interview.category]) {
                categoryStats[interview.category].total++;
                categoryStats[interview.category].avgScore += interview.totalScore || 0;
            }
        });

        Object.keys(categoryStats).forEach(cat => {
            if (categoryStats[cat].total > 0) {
                categoryStats[cat].avgScore = Math.round(categoryStats[cat].avgScore / categoryStats[cat].total);
            }
        });

        // Calculate weekly progress (last 4 weeks, oldest first)
        const weeklyProgress = [];
        const now = new Date();

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            weekEnd.setHours(23, 59, 59, 999);

            const weekInterviews = interviews.filter(interview => {
                const date = new Date(interview.completedAt);
                return date >= weekStart && date <= weekEnd;
            });

            const avgScore = weekInterviews.length > 0
                ? Math.round(weekInterviews.reduce((sum, interview) => sum + (interview.totalScore || 0), 0) / weekInterviews.length)
                : 0;

            // Friendly labels
            let weekLabel;
            if (i === 0) weekLabel = 'This Week';
            else if (i === 1) weekLabel = 'Last Week';
            else weekLabel = `${i}w ago`;

            weeklyProgress.push({
                week: weekLabel,
                score: avgScore,
                interviews: weekInterviews.length,
            });
        }

        res.json({
            user: {
                name: user.name,
                email: user.email,
                credits: user.credits || 50,
                totalInterviews: user.totalInterviews || 0,
                avgScore: user.avgScore || 0,
            },
            stats: {
                readinessScore: user.avgScore || 0,
                totalInterviews: user.totalInterviews || 0,
                categoryStats,
                weeklyProgress,
                recentInterviews: interviews.slice(0, 5).map(i => ({
                    id: i.id,
                    category: i.category,
                    score: i.totalScore,
                    date: i.completedAt,
                })),
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
});

// Get AI-powered insights
router.get('/insights', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        let user = null;
        let interviews = [];

        if (isFirebaseInitialized && db) {
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            if (userSnapshot.exists()) {
                user = userSnapshot.val();
            }

            const interviewsSnapshot = await db.ref('interviews')
                .orderByChild('userId')
                .equalTo(userId)
                .once('value');

            if (interviewsSnapshot.exists()) {
                const data = interviewsSnapshot.val();
                interviews = Object.values(data)
                    .filter(i => i.status === 'completed')
                    .slice(0, 10);
            }
        } else {
            user = memoryStore.users.get(userId);
            interviews = [...memoryStore.interviews.values()]
                .filter(i => i.userId === userId && i.status === 'completed')
                .slice(0, 10);
        }

        const performanceData = {
            totalInterviews: user?.totalInterviews || 0,
            avgScore: user?.avgScore || 0,
            recentScores: interviews.map(i => ({ category: i.category, score: i.totalScore })),
        };

        const insights = await generateDashboardInsights(performanceData);

        res.json({ insights });
    } catch (error) {
        console.error('Dashboard insights error:', error);
        res.status(500).json({ error: 'Failed to get insights' });
    }
});

// Get scheduled interviews (mock data for now)
router.get('/schedule', authenticateToken, async (req, res) => {
    try {
        // Return mock scheduled interviews for calendar
        const scheduledDates = [8, 11, 23, 24].map(day => {
            const date = new Date();
            date.setDate(day);
            return {
                date: date.toISOString().split('T')[0],
                category: ['hr', 'technical', 'aptitude'][Math.floor(Math.random() * 3)],
                time: '10:00 AM',
            };
        });

        res.json({ scheduledInterviews: scheduledDates });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'Failed to get schedule' });
    }
});

export default router;
