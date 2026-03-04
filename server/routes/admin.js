import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { db, isFirebaseInitialized, memoryStore } from '../config/firebase.js';

const router = express.Router();

// Admin middleware - check if user is admin
function requireAdmin(req, res, next) {
    if (req.user.email !== 'admin@gmail.com') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Get platform-wide analytics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        let users = [];
        let interviews = [];

        if (isFirebaseInitialized && db) {
            // Get all users
            const usersSnapshot = await db.ref('users').once('value');
            if (usersSnapshot.exists()) {
                users = Object.values(usersSnapshot.val());
            }

            // Get all interviews
            const interviewsSnapshot = await db.ref('interviews').once('value');
            if (interviewsSnapshot.exists()) {
                interviews = Object.values(interviewsSnapshot.val());
            }
        } else {
            users = [...memoryStore.users.values()];
            interviews = [...memoryStore.interviews.values()];
        }

        const completedInterviews = interviews.filter(i => i.status === 'completed');

        // Basic stats
        const totalUsers = users.length;
        const totalInterviews = completedInterviews.length;
        const avgPlatformScore = completedInterviews.length > 0
            ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.totalScore || 0), 0) / completedInterviews.length)
            : 0;

        // Category breakdown
        const categoryBreakdown = { hr: 0, technical: 0, aptitude: 0 };
        const categoryScores = { hr: [], technical: [], aptitude: [] };
        completedInterviews.forEach(i => {
            if (categoryBreakdown[i.category] !== undefined) {
                categoryBreakdown[i.category]++;
                categoryScores[i.category].push(i.totalScore || 0);
            }
        });

        const categoryStats = Object.keys(categoryBreakdown).map(cat => ({
            category: cat,
            count: categoryBreakdown[cat],
            avgScore: categoryScores[cat].length > 0
                ? Math.round(categoryScores[cat].reduce((a, b) => a + b, 0) / categoryScores[cat].length)
                : 0,
        }));

        // Score distribution (0-20, 21-40, 41-60, 61-80, 81-100)
        const scoreRanges = [
            { label: '0-20', min: 0, max: 20, count: 0 },
            { label: '21-40', min: 21, max: 40, count: 0 },
            { label: '41-60', min: 41, max: 60, count: 0 },
            { label: '61-80', min: 61, max: 80, count: 0 },
            { label: '81-100', min: 81, max: 100, count: 0 },
        ];
        completedInterviews.forEach(i => {
            const score = i.totalScore || 0;
            const range = scoreRanges.find(r => score >= r.min && score <= r.max);
            if (range) range.count++;
        });

        // Daily activity (last 7 days)
        const dailyActivity = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayStr = date.toISOString().split('T')[0];
            const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' });

            const dayInterviews = completedInterviews.filter(interview => {
                const completedDate = interview.completedAt ? interview.completedAt.split('T')[0] : '';
                return completedDate === dayStr;
            });

            dailyActivity.push({
                day: dayLabel,
                date: dayStr,
                count: dayInterviews.length,
                avgScore: dayInterviews.length > 0
                    ? Math.round(dayInterviews.reduce((sum, interview) => sum + (interview.totalScore || 0), 0) / dayInterviews.length)
                    : 0,
            });
        }

        // Active today
        const todayStr = now.toISOString().split('T')[0];
        const activeToday = new Set(
            interviews
                .filter(i => (i.startedAt || '').split('T')[0] === todayStr)
                .map(i => i.userId)
        ).size;

        // Recent interviews (last 10)
        const recentInterviews = completedInterviews
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 10)
            .map(i => {
                const user = users.find(u => u.id === i.userId);
                return {
                    id: i.id,
                    userName: user?.name || 'Unknown',
                    userEmail: user?.email || '',
                    category: i.category,
                    topic: i.topic || null,
                    score: i.totalScore || 0,
                    questionsCount: i.questions?.length || 0,
                    completedAt: i.completedAt,
                };
            });

        // Top performers
        const topPerformers = users
            .filter(u => (u.totalInterviews || 0) > 0)
            .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
            .slice(0, 5)
            .map(u => ({
                name: u.name,
                email: u.email,
                avgScore: u.avgScore || 0,
                totalInterviews: u.totalInterviews || 0,
            }));

        res.json({
            totalUsers,
            totalInterviews,
            avgPlatformScore,
            activeToday,
            categoryStats,
            scoreDistribution: scoreRanges,
            dailyActivity,
            recentInterviews,
            topPerformers,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to get admin stats' });
    }
});

export default router;
