const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// Auth API
export const authAPI = {
    register: (email, password, name) =>
        apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        }),

    login: (email, password) =>
        apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getCurrentUser: () => apiCall('/auth/me'),
};

// Interview API
export const interviewAPI = {
    startInterview: (interviewType, numQuestions = 5) =>
        apiCall('/interview/start', {
            method: 'POST',
            body: JSON.stringify({ interviewType, numQuestions }),
        }),

    submitAnswer: (interviewId, questionId, answer, speechText) =>
        apiCall('/interview/submit-answer', {
            method: 'POST',
            body: JSON.stringify({ interviewId, questionId, answer, speechText }),
        }),

    completeInterview: (interviewId) =>
        apiCall('/interview/complete', {
            method: 'POST',
            body: JSON.stringify({ interviewId }),
        }),

    getHistory: () => apiCall('/interview/history'),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => apiCall('/dashboard/stats'),
    getInsights: () => apiCall('/dashboard/insights'),
    getSchedule: () => apiCall('/dashboard/schedule'),
};

// Admin API
export const adminAPI = {
    getStats: () => apiCall('/admin/stats'),
};

export default { authAPI, interviewAPI, dashboardAPI, adminAPI };
