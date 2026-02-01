import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';
import { db, isFirebaseInitialized, memoryStore } from '../config/firebase.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = `user_${Date.now()}`;

        const userData = {
            id: userId,
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            totalInterviews: 0,
            avgScore: 0,
            credits: 50, // Starting credits
        };

        if (isFirebaseInitialized && db) {
            // Check if user exists (Realtime Database)
            const usersRef = db.ref('users');
            const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');

            if (snapshot.exists()) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Save to Realtime Database
            await db.ref(`users/${userId}`).set(userData);
        } else {
            // Use in-memory store
            if ([...memoryStore.users.values()].find(u => u.email === email)) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            memoryStore.users.set(userId, userData);
        }

        // Generate token
        const token = generateToken(userId, email);

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: userId,
                email,
                name,
                credits: userData.credits,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        let user = null;

        if (isFirebaseInitialized && db) {
            // Query Realtime Database
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');

            if (snapshot.exists()) {
                const users = snapshot.val();
                const userId = Object.keys(users)[0];
                user = { id: userId, ...users[userId] };
            }
        } else {
            user = [...memoryStore.users.values()].find(u => u.email === email);
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, email);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                totalInterviews: user.totalInterviews,
                avgScore: user.avgScore,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);

        let user = null;

        if (isFirebaseInitialized && db) {
            // Get from Realtime Database
            const snapshot = await db.ref(`users/${decoded.userId}`).once('value');
            if (snapshot.exists()) {
                user = { id: decoded.userId, ...snapshot.val() };
            }
        } else {
            user = memoryStore.users.get(decoded.userId);
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                credits: user.credits,
                totalInterviews: user.totalInterviews,
                avgScore: user.avgScore,
            },
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
