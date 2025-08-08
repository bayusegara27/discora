import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, user, authError, setAuthError } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // If user is already logged in, redirect them
        if (user) {
            navigate('/dashboard', { replace: true });
        }
        // Clear any previous errors when the component mounts
        setAuthError(null);
    }, [user, navigate, setAuthError]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAuthError(null); // Clear previous errors
        try {
            await register(name, email, password);
            // On success, the `useEffect` will navigate.
        } catch (error) {
            // Error is set in the context.
        } finally {
            // This ensures the button is re-enabled if registration fails.
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">Create Your Account</h1>
                    <p className="text-text-secondary">Get started with Discora Dashboard.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-background border border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-background border border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-background border border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"
                            required
                            minLength={8}
                        />
                    </div>
                    {authError && (
                        <p className="text-red-400 text-sm text-center">{authError}</p>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>
                </form>
                <div className="text-center mt-6">
                    <p className="text-text-secondary">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-accent hover:underline">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;