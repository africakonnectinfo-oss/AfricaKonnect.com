import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../common/NotificationCenter';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, signOut, isExpert, isClient } = useAuth();

    const handleLogout = async () => {
        await signOut();
        setShowUserMenu(false);
        navigate('/');
    };

    // Define navigation links based on user role
    const getNavLinks = () => {
        const baseLinks = [
            { name: 'Home', path: '/' },
            { name: 'How It Works', path: '/how-it-works' },
            { name: 'Experts', path: '/experts' },
        ];

        if (user) {
            if (isExpert) {
                return [
                    ...baseLinks,
                    { name: 'Dashboard', path: '/expert-dashboard' },
                    { name: 'Pricing', path: '/pricing' },
                ];
            } else {
                // Client
                return [
                    ...baseLinks,
                    { name: 'Project Hub', path: '/project-hub' },
                    { name: 'Collaboration', path: '/collaboration' },
                    { name: 'Pricing', path: '/pricing' },
                ];
            }
        }

        // Not logged in
        return [
            ...baseLinks,
            { name: 'Project Hub', path: '/project-hub' },
            { name: 'Collaboration', path: '/collaboration' },
            { name: 'Pricing', path: '/pricing' },
        ];
    };

    const navLinks = getNavLinks();
    const isActive = (path) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="Africa Konnect Logo" className="h-16 w-auto" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        isActive(link.path) ? "text-primary font-semibold" : "text-gray-600"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* CTA & Mobile Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3">
                                {user ? (
                                    <>
                                        {/* Notifications */}
                                        <div className="mr-2">
                                            <NotificationCenter />
                                        </div>

                                        <div className="relative group">
                                            <button
                                                onClick={() => setShowUserMenu(!showUserMenu)}
                                                className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white border border-gray-200 rounded-full hover:shadow-md transition-all duration-200 group-hover:border-primary/30"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-2 ring-gray-50">
                                                    {(profile?.profile_image_url || user?.profile_image_url) ? (
                                                        <img
                                                            src={profile?.profile_image_url || user?.profile_image_url}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User size={18} className="text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="text-left hidden lg:block">
                                                    <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                                                        {profile?.name?.split(' ')[0] || user.name?.split(' ')[0] || user.email?.split('@')[0]}
                                                    </p>
                                                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                                        {isExpert ? 'Expert' : 'Client'}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
                                            </button>

                                            {/* User Dropdown Menu */}
                                            <AnimatePresence>
                                                {showUserMenu && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden z-50 origin-top-right"
                                                    >
                                                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                                {profile?.title || (isExpert ? 'Expert Account' : 'Client Account')}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                        </div>
                                                        <div className="p-1">
                                                            <Link
                                                                to="/profile"
                                                                onClick={() => setShowUserMenu(false)}
                                                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors"
                                                            >
                                                                <Settings size={16} />
                                                                Profile Settings
                                                            </Link>
                                                            {isExpert && (
                                                                <Link
                                                                    to="/expert-dashboard"
                                                                    onClick={() => setShowUserMenu(false)}
                                                                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors"
                                                                >
                                                                    <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                    </div>
                                                                    Dashboard
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={handleLogout}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-1"
                                                            >
                                                                <LogOut size={16} />
                                                                Sign Out
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                ) : (
                                    <Link to="/signup">
                                        <Button size="sm">Get Started</Button>
                                    </Link>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "block text-base font-medium py-2 border-b border-gray-50 last:border-0",
                                            isActive(link.path) ? "text-primary" : "text-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            {link.name}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </Link>
                                ))}
                                <div className="pt-4 space-y-2">
                                    {user ? (
                                        <>
                                            <div className="p-3 bg-gray-50 rounded-lg mb-2">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {profile?.name || user.email?.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {isExpert ? 'Expert Account' : 'Client Account'}
                                                </p>
                                            </div>
                                            <Link to="/profile" onClick={() => setIsOpen(false)}>
                                                <Button variant="secondary" className="w-full" size="lg">
                                                    <Settings size={16} className="mr-2" />
                                                    Edit Profile
                                                </Button>
                                            </Link>
                                            <Button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsOpen(false);
                                                }}
                                                variant="secondary"
                                                className="w-full"
                                                size="lg"
                                            >
                                                <LogOut size={16} className="mr-2" />
                                                Logout
                                            </Button>
                                        </>
                                    ) : (
                                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                                            <Button className="w-full" size="lg">Get Started</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

export { Navbar };
