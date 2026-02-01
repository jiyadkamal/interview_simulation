import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generateInterviewQuestions, evaluateResponse } from '../services/gemini.js';
import { db, isFirebaseInitialized, memoryStore } from '../config/firebase.js';

const router = express.Router();

// Start a new interview session
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { category, topic } = req.body;
        const userId = req.user.userId;

        if (!['hr', 'technical', 'aptitude'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category. Use: hr, technical, or aptitude' });
        }

        // Generate questions using Gemini (with topic for technical)
        const questions = await generateInterviewQuestions(category, topic);

        const interviewId = `interview_${Date.now()}`;
        const interviewData = {
            id: interviewId,
            userId,
            category,
            topic: topic || null,
            questions,
            responses: [],
            status: 'in_progress',
            startedAt: new Date().toISOString(),
            completedAt: null,
            totalScore: 0,
        };

        if (isFirebaseInitialized && db) {
            await db.ref(`interviews/${interviewId}`).set(interviewData);
        } else {
            memoryStore.interviews.set(interviewId, interviewData);
        }

        res.json({
            interviewId,
            category,
            topic: topic || null,
            questions: questions.map(q => ({ id: q.id, question: q.question, tips: q.tips })),
            totalQuestions: questions.length,
        });
    } catch (error) {
        console.error('Start interview error:', error);
        res.status(500).json({ error: 'Failed to start interview' });
    }
});

// Submit answer for a question
router.post('/submit-answer', authenticateToken, async (req, res) => {
    try {
        const { interviewId, questionId, answer, speechText } = req.body;
        const userId = req.user.userId;

        // Get interview
        let interview = null;
        if (isFirebaseInitialized && db) {
            const snapshot = await db.ref(`interviews/${interviewId}`).once('value');
            if (snapshot.exists()) {
                interview = snapshot.val();
            }
        } else {
            interview = memoryStore.interviews.get(interviewId);
        }

        if (!interview || interview.userId !== userId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Find the question
        const question = interview.questions.find(q => q.id === questionId);
        if (!question) {
            return res.status(400).json({ error: 'Question not found' });
        }

        // Evaluate the answer using Gemini
        const evaluation = await evaluateResponse(interview.category, question.question, speechText || answer);

        const responseData = {
            questionId,
            question: question.question,
            answer: speechText || answer,
            evaluation,
            submittedAt: new Date().toISOString(),
        };

        // Update interview with response
        const responses = interview.responses || [];
        responses.push(responseData);

        if (isFirebaseInitialized && db) {
            await db.ref(`interviews/${interviewId}/responses`).set(responses);
        } else {
            interview.responses = responses;
            memoryStore.interviews.set(interviewId, interview);
        }

        res.json({
            success: true,
            evaluation,
            questionsRemaining: interview.questions.length - responses.length,
        });
    } catch (error) {
        console.error('Submit answer error:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});

// Complete interview and get final results
router.post('/complete', authenticateToken, async (req, res) => {
    try {
        const { interviewId } = req.body;
        const userId = req.user.userId;

        // Get interview
        let interview = null;
        if (isFirebaseInitialized && db) {
            const snapshot = await db.ref(`interviews/${interviewId}`).once('value');
            if (snapshot.exists()) {
                interview = snapshot.val();
            }
        } else {
            interview = memoryStore.interviews.get(interviewId);
        }

        if (!interview || interview.userId !== userId) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        // Calculate total score
        const responses = interview.responses || [];
        const totalScore = responses.reduce((sum, r) => sum + (r.evaluation?.score || 0), 0);
        const avgScore = responses.length > 0 ? totalScore / responses.length : 0;

        // Update interview status
        const completedAt = new Date().toISOString();
        const finalScore = Math.round(avgScore * 10);

        if (isFirebaseInitialized && db) {
            await db.ref(`interviews/${interviewId}`).update({
                status: 'completed',
                completedAt,
                totalScore: finalScore,
            });

            // Update user stats
            const userSnapshot = await db.ref(`users/${userId}`).once('value');
            if (userSnapshot.exists()) {
                const user = userSnapshot.val();
                const newTotal = (user.totalInterviews || 0) + 1;
                const newAvg = ((user.avgScore || 0) * (user.totalInterviews || 0) + avgScore * 10) / newTotal;
                await db.ref(`users/${userId}`).update({
                    totalInterviews: newTotal,
                    avgScore: Math.round(newAvg),
                    credits: (user.credits || 50) - 1,
                });
            }
        } else {
            interview.status = 'completed';
            interview.completedAt = completedAt;
            interview.totalScore = finalScore;
            memoryStore.interviews.set(interviewId, interview);

            const user = memoryStore.users.get(userId);
            if (user) {
                user.totalInterviews = (user.totalInterviews || 0) + 1;
                user.avgScore = Math.round(((user.avgScore || 0) * (user.totalInterviews - 1) + avgScore * 10) / user.totalInterviews);
                user.credits = (user.credits || 50) - 1;
                memoryStore.users.set(userId, user);
            }
        }

        res.json({
            success: true,
            results: {
                category: interview.category,
                totalQuestions: interview.questions.length,
                answeredQuestions: responses.length,
                averageScore: finalScore,
                responses,
                completedAt,
            },
        });
    } catch (error) {
        console.error('Complete interview error:', error);
        res.status(500).json({ error: 'Failed to complete interview' });
    }
});

// Get interview history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        let interviews = [];

        if (isFirebaseInitialized && db) {
            const snapshot = await db.ref('interviews').orderByChild('userId').equalTo(userId).limitToLast(10).once('value');
            if (snapshot.exists()) {
                const data = snapshot.val();
                interviews = Object.values(data).sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
            }
        } else {
            interviews = [...memoryStore.interviews.values()]
                .filter(i => i.userId === userId)
                .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
                .slice(0, 10);
        }

        res.json({
            interviews: interviews.map(i => ({
                id: i.id,
                category: i.category,
                status: i.status,
                totalScore: i.totalScore,
                startedAt: i.startedAt,
                completedAt: i.completedAt,
            })),
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ error: 'Failed to get interview history' });
    }
});

export default router;
