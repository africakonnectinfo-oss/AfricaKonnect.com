import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import {
    CheckCircle, Clock, XCircle, FileText, Video, Star,
    Briefcase, DollarSign, Calendar, AlertCircle, UserCheck,
    Shield, Award, TrendingUp, Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import ProfileCompletenessBar from '../components/ProfileCompletenessBar';
import SkillSelector from '../components/SkillSelector';
import PortfolioManager from '../components/PortfolioManager';
import RateRangeSelector from '../components/RateRangeSelector';
import SessionManagement from '../components/SessionManagement';
import { useSocket } from '../hooks/useSocket';

const ExpertDashboard = () => {
    const navigate = useNavigate();
    const { profile, user, loading: authLoading } = useAuth();
    const [isAvailable, setIsAvailable] = useState(true);

    const [stats, setStats] = useState({
        totalEarnings: '$0',
        activeProjects: 0,
        completedProjects: 0,
        rating: 5.0
    });
    const [invitations, setInvitations] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const [vettingStatus, setVettingStatus] = useState({
        status: 'pending',
        completedSteps: [],
        pendingSteps: ['identity', 'skills', 'interview']
    });

    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        const fetchDashboardData = async () => {
            // Wait for auth to initialize
            if (authLoading) return;

            // If no user, let protected route handle redirect, or do nothing
            if (!user) return;

            // If no profile (and auth loaded), it means expert hasn't created profile yet
            if (!profile) {
                setHasProfile(false);
                setLoading(false);
                return;
            }

            // Profile exists, load dashboard data
            setHasProfile(true);

            try {
                // Set initial status from profile context
                setVettingStatus({
                    status: profile.vetting_status || 'pending',
                    completedSteps: [],
                    pendingSteps: []
                });
                setStats(prev => ({ ...prev, rating: profile.rating || 5.0 }));
                setIsAvailable(profile.availability_calendar ? true : false); // Simplified check

                // Fetch contracts (active projects & earnings)
                const contractsData = await api.contracts.getUserContracts();
                if (contractsData && contractsData.contracts) {
                    const contracts = contractsData.contracts;
                    const active = contracts.filter(c => c.status === 'active');
                    const completed = contracts.filter(c => c.status === 'completed');

                    setActiveProjects(active.map(c => ({
                        id: c.id,
                        title: c.project_title,
                        client: c.client_name,
                        progress: c.progress || 0,
                        nextMilestone: 'TBD',
                        dueDate: c.end_date ? new Date(c.end_date).toLocaleDateString() : 'N/A',
                        earnings: `$${c.total_amount}`
                    })));

                    setStats(prev => ({
                        ...prev,
                        activeProjects: active.length,
                        completedProjects: completed.length,
                        totalEarnings: `$${completed.reduce((acc, c) => acc + Number(c.total_amount), 0)}`
                    }));
                }

                // Get pending invitations 
                const invitesData = await api.projects.getInvitedProjects();
                if (invitesData && invitesData.projects) {
                    const invites = invitesData.projects.filter(p => p.expert_status === 'pending');
                    setInvitations(invites.map(p => ({
                        id: p.id,
                        projectTitle: p.title,
                        client: p.client_name,
                        budget: `$${p.budget}`,
                        duration: 'TBD',
                        skills: p.tech_stack || [],
                        receivedDate: new Date(p.created_at).toLocaleDateString(),
                        status: 'pending'
                    })));
                }

            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [profile, user, authLoading]);

    // Real-time invites
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !user) return;

        // Join private user room
        socket.emit('join_user', user.id);

        const handleInvite = (project) => {
            // Add new invite to state
            const newInvite = {
                id: project.id,
                projectTitle: project.title,
                client: project.client_name || 'New Client', // client_name might be missing in update object if not joined
                budget: `$${project.budget}`,
                duration: project.duration || 'TBD',
                skills: project.tech_stack || [],
                receivedDate: new Date().toLocaleDateString(),
                status: 'pending'
            };
            setInvitations(prev => [newInvite, ...prev]);
        };

        socket.on('project_invite', handleInvite);

        return () => {
            socket.off('project_invite', handleInvite);
        };
    }, [socket, user]);

    const getVettingStatusBadge = () => {
        switch (vettingStatus.status) {
            case 'verified':
                return <span className="px-3 py-1 bg-success/10 text-success text-sm font-semibold rounded-full flex items-center gap-1"><Shield size={14} /> Verified</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-warning/10 text-warning text-sm font-semibold rounded-full flex items-center gap-1"><Clock size={14} /> In Progress</span>;
            case 'rejected':
                return <span className="px-3 py-1 bg-error/10 text-error text-sm font-semibold rounded-full flex items-center gap-1"><XCircle size={14} /> Rejected</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-semibold rounded-full">Unknown</span>;
        }
    };


    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!hasProfile) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="p-8 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="text-primary w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Expert Profile</h1>
                        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                            To start receiving project invitations and appearing in our expert directory, you need to complete your profile details.
                        </p>
                        <Button onClick={() => navigate('/profile')} size="lg">
                            Create Profile
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO
                title="Expert Dashboard"
                description="Manage your expert profile, view project invitations, and track your earnings."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Expert Dashboard</h1>
                    <p className="text-gray-600">Manage your projects and opportunities</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                <DollarSign className="text-success" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalEarnings}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Briefcase className="text-primary" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Projects</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-highlight/10 flex items-center justify-center">
                                <Award className="text-highlight" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                                <Star className="text-warning" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rating</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Vetting Status */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Verification Status</h2>
                                {getVettingStatusBadge()}
                            </div>

                            {vettingStatus.status === 'verified' ? (
                                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="text-success mt-1" size={20} />
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1">You're a verified expert!</p>
                                            <p className="text-sm text-gray-600">
                                                Your identity and skills have been verified. You can now receive project invitations from clients.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <CheckCircle className="text-success" size={20} />
                                        <span className="text-sm text-gray-700">Identity Verification</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Clock className="text-warning" size={20} />
                                        <span className="text-sm text-gray-700">Skills Assessment</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Clock className="text-gray-400" size={20} />
                                        <span className="text-sm text-gray-700">Video Interview</span>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Project Invitations */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Project Invitations</h2>
                                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                                    {invitations.length} New
                                </span>
                            </div>

                            <div className="space-y-4">
                                {invitations.map((invitation) => (
                                    <motion.div
                                        key={invitation.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="border border-gray-200 rounded-lg p-4 hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{invitation.projectTitle}</h3>
                                                <p className="text-sm text-gray-600">{invitation.client}</p>
                                            </div>
                                            <span className="text-sm text-gray-500">{invitation.receivedDate}</span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {invitation.skills.map((skill, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={16} />
                                                    {invitation.budget}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={16} />
                                                    {invitation.duration}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            await api.projects.respond(invitation.id, 'rejected');
                                                            // Refresh list
                                                            setInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Failed to decline');
                                                        }
                                                    }}
                                                >
                                                    Decline
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            await api.projects.respond(invitation.id, 'accepted');
                                                            // Refresh list and navigate to Collaboration (which might redirect to Contract if needed)
                                                            setInvitations(prev => prev.filter(i => i.id !== invitation.id));
                                                            navigate('/collaboration');
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Failed to accept');
                                                        }
                                                    }}
                                                >
                                                    Accept
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>

                        {/* Active Projects */}
                        <Card className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Active Projects</h2>

                            <div className="space-y-4">
                                {activeProjects.map((project) => (
                                    <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                                                <p className="text-sm text-gray-600">{project.client}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    // Set active project via context if needed, then navigate
                                                    // Ideally setActiveProject(project.id) but we can just nav
                                                    navigate('/collaboration');
                                                }}
                                            >
                                                View Details
                                            </Button>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="font-semibold text-gray-900">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full transition-all"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4 text-gray-600">
                                                <span>Next: {project.nextMilestone}</span>
                                                <span>Due: {project.dueDate}</span>
                                            </div>
                                            <span className="font-semibold text-success">{project.earnings}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Availability Toggle */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Availability</h3>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-600">Open to new projects</span>
                                <button
                                    onClick={() => setIsAvailable(!isAvailable)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAvailable ? 'bg-success' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                {isAvailable
                                    ? 'You are visible to clients and can receive invitations'
                                    : 'You are not receiving new project invitations'}
                            </p>
                        </Card>

                        {/* Performance Score */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Performance Score</h3>
                            <div className="flex items-center justify-center mb-4">
                                <div className="relative w-32 h-32">
                                    <svg className="transform -rotate-90 w-32 h-32">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            className="text-gray-200"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="transparent"
                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - 0.92)}`}
                                            className="text-success"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-gray-900">92</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">On-time Delivery</span>
                                    <span className="font-semibold text-gray-900">95%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Client Satisfaction</span>
                                    <span className="font-semibold text-gray-900">4.9/5</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Response Time</span>
                                    <span className="font-semibold text-gray-900">2.3 hrs</span>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/profile')}>
                                    <UserCheck size={16} className="mr-2" />
                                    Update Profile
                                </Button>
                                <Button variant="secondary" className="w-full justify-start" onClick={() => navigate('/profile')}>
                                    <FileText size={16} className="mr-2" />
                                    View Portfolio
                                </Button>
                                <Button variant="secondary" className="w-full justify-start" onClick={() => alert('Analytics feature coming soon!')}>
                                    <TrendingUp size={16} className="mr-2" />
                                    View Analytics
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpertDashboard;
