import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            authAPI.getCurrentUser()
                .then(data => {
                    setUser(data.user);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const data = await authAPI.login(email, password);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const register = async (email, password, name) => {
        try {
            setError(null);
            const data = await authAPI.register(email, password, name);
            localStorage.setItem('token', data.token);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
