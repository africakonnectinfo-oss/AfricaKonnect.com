import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
    const navigate = useNavigate();
    const { signUp, signOut } = useAuth();
    const [role, setRole] = useState('client'); // 'client' or 'expert'
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { user, error } = await signUp(
                formData.email,
                formData.password,
                formData.name,
                role
            );

            if (error) throw error;

            if (user) {
                // Sign out immediately to force manual login and verification
                await signOut();
                navigate('/signin', {
                    state: {
                        message: "Account created successfully! Please sign in to access your dashboard.",
                        type: "success"
                    }
                });
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <SEO
                title="Sign Up"
                description="Create your Africa Konnect account today. Hire top African talent or find your next global opportunity."
            />
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <Link to="/">
                    {/* <img
                        className="mx-auto h-12 w-auto"
                        src="/logo.svg"
                        alt="Workflow"
                    /> */}
                </Link >
                <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                <p className="mt-2 text-gray-600">Join the platform bridging African excellence</p>
            </div >

            <Card className="sm:mx-auto sm:w-full sm:max-w-md p-8">
                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => setRole('client')}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${role === 'client'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                    >
                        {role === 'client' && (
                            <div className="absolute top-2 right-2 text-primary">
                                <Check size={16} />
                            </div>
                        )}
                        <User size={24} className="mb-2" />
                        <span className="font-medium text-sm">I'm a Client</span>
                        <span className="text-xs text-gray-500 mt-1">We deliver the right African expert safely</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setRole('expert')}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all ${role === 'expert'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                    >
                        {role === 'expert' && (
                            <div className="absolute top-2 right-2 text-primary">
                                <Check size={16} />
                            </div>
                        )}
                        <Briefcase size={24} className="mb-2" />
                        <span className="font-medium text-sm">I'm an Expert</span>
                        <span className="text-xs text-gray-500 mt-1">Serious work without the noise</span>
                    </button>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="ml-2" size={20} />
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/signin" className="font-medium text-primary hover:text-primary/80">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div >
    );
};

export default SignUp;
