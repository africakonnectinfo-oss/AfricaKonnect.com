import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import SEO from '../components/SEO';
import { AnimatePresence, motion } from 'framer-motion';
import ExpertDetail from '../components/ExpertDetail';
import { Calendar, Briefcase, ChevronRight, Clock, MessageSquare, AlertCircle, Search, MapPin, Filter, CheckCircle, Star } from 'lucide-react';

const Experts = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const expertId = searchParams.get('id');
    const navigate = useNavigate();
    const { user, isClient } = useAuth(); // Assuming useAuth provides verify/role info

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStack, setSelectedStack] = useState('All');

    // ... filters state ...
    const [selectedCountry, setSelectedCountry] = useState('All');
    const [selectedProjectType, setSelectedProjectType] = useState('All');

    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpert, setSelectedExpert] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Hiring Modal State
    const [hireModalOpen, setHireModalOpen] = useState(false);
    const [hiringExpert, setHiringExpert] = useState(null);
    const [hireAction, setHireAction] = useState(null); // 'invite' | 'interview'
    const [clientProjects, setClientProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');

    const [interviewData, setInterviewData] = useState({
        date: '',
        time: '',
        topic: '',
        message: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    // ... useEffects for fetching experts ...

    // Fetch Client Projects when modal opens
    useEffect(() => {
        if (hireModalOpen && isClient && clientProjects.length === 0) {
            const fetchProjects = async () => {
                try {
                    const data = await api.projects.getMine();
                    setClientProjects(data.projects || []);

                    // Pre-select project if passed in URL
                    const paramProjectId = searchParams.get('projectId');
                    if (paramProjectId && data.projects.some(p => p.id === paramProjectId)) {
                        setSelectedProject(paramProjectId);
                        // Optional: Auto-open modal logic could be added here if we want to deep-link straight to invite
                    }
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.error("Failed to load projects", error);
                    }
                }
            };
            fetchProjects();
        }
    }, [hireModalOpen, isClient, clientProjects.length, searchParams]);

    const handleHireClick = (expert) => {
        if (!user) {
            navigate('/signin', { state: { from: `/experts?id=${expert.id}` } });
            return;
        }
        setHiringExpert(expert);
        setHireAction(null); // Reset to selection screen
        setHireModalOpen(true);
    };

    const handleInviteToProject = async () => {
        if (!selectedProject) return;
        setActionLoading(true);
        try {
            await api.projects.invite(selectedProject, hiringExpert.id);
            setHireModalOpen(false);
            alert(`Invitation sent to ${hiringExpert.name}!`);
        } catch (error) {
            alert(`Failed to invite: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleScheduleInterview = async () => {
        if (!interviewData.date || !interviewData.time || !interviewData.topic) return;
        setActionLoading(true);
        try {
            await api.interviews.schedule({
                expertId: hiringExpert.id,
                ...interviewData
            });
            setHireModalOpen(false);
            alert(`Interview request sent to ${hiringExpert.name}!`);
        } catch (error) {
            alert(`Failed to schedule: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // ... existing filtering logic ...

    // ... existing render logic ...

    // Add inside return block, before closing div:

    {/* Hiring Modal */ }
    <Modal
        isOpen={hireModalOpen}
        onClose={() => setHireModalOpen(false)}
        title={hiringExpert ? `Hire ${hiringExpert.name}` : 'Hire Expert'}
    >
        {!hireAction ? (
            <div className="space-y-4">
                <p className="text-gray-600 mb-6">How would you like to proceed with this expert?</p>

                <button
                    onClick={() => setHireAction('invite')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <Briefcase size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Invite to Project</h4>
                            <p className="text-sm text-gray-500">Send an invitation to join one of your existing projects.</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary" />
                </button>

                <button
                    onClick={() => setHireAction('interview')}
                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-200 transition-colors">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Schedule Interview</h4>
                            <p className="text-sm text-gray-500">Book a time to discuss your requirements.</p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-primary" />
                </button>
            </div>
        ) : hireAction === 'invite' ? (
            <div className="space-y-6">
                <div>
                    <button
                        onClick={() => setHireAction(null)}
                        className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1"
                    >
                        ← Back
                    </button>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Select a Project</h4>
                    <p className="text-sm text-gray-600 mb-4">Choose which project you want {hiringExpert?.name} to join.</p>

                    {clientProjects.length > 0 ? (
                        <div className="space-y-3">
                            {clientProjects.map(project => (
                                <label
                                    key={project.id}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedProject === project.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <input
                                        type="radio"
                                        name="project"
                                        value={project.id}
                                        checked={selectedProject === project.id}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="mr-3 text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{project.name}</p>
                                        <p className="text-xs text-gray-500">{project.status}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Briefcase className="mx-auto text-gray-400 mb-2" size={32} />
                            <p className="text-gray-600 font-medium">No projects found</p>
                            <p className="text-sm text-gray-500 mb-4">You need to create a project first.</p>
                            <Button onClick={() => navigate('/project-hub')} variant="outline" size="sm">
                                Go to Project Hub
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                        onClick={handleInviteToProject}
                        disabled={!selectedProject || actionLoading}
                        className="w-full sm:w-auto"
                    >
                        {actionLoading ? 'Sending Invitation...' : 'Send Invitation'}
                    </Button>
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <button
                    onClick={() => setHireAction(null)}
                    className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1"
                >
                    ← Back
                </button>
                <h4 className="text-lg font-bold text-gray-900 mb-4">Interview Details</h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                value={interviewData.date}
                                onChange={e => setInterviewData({ ...interviewData, date: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="time"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                value={interviewData.time}
                                onChange={e => setInterviewData({ ...interviewData, time: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Agenda</label>
                    <input
                        type="text"
                        placeholder="e.g. Initial Project Discussion"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        value={interviewData.topic}
                        onChange={e => setInterviewData({ ...interviewData, topic: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                    <textarea
                        rows="3"
                        placeholder="Any specific questions or context..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        value={interviewData.message}
                        onChange={e => setInterviewData({ ...interviewData, message: e.target.value })}
                    ></textarea>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                        onClick={handleScheduleInterview}
                        disabled={!interviewData.date || !interviewData.time || !interviewData.topic || actionLoading}
                        className="w-full sm:w-auto"
                    >
                        {actionLoading ? 'Scheduling...' : 'Schedule Interview'}
                    </Button>
                </div>
            </div>
        )}
    </Modal>

    // Initial load
    useEffect(() => {
        const fetchExperts = async () => {
            try {
                const data = await api.experts.getAll();
                if (data && data.experts) {
                    setExperts(data.experts);
                } else {
                    setExperts([]);
                }
            } catch (error) {
                if (import.meta.env.DEV) {
                    console.error('Error loading experts:', error);
                }
                setExperts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchExperts();
    }, []);

    // Handle Deep Linking / Selection
    useEffect(() => {
        const loadSelectedExpert = async () => {
            if (!expertId) {
                setSelectedExpert(null);
                return;
            }

            // Check if already in list
            const found = experts.find(e => e.id === expertId);
            if (found) {
                setSelectedExpert(found);
            } else {
                // Fetch individually if not in loaded list
                setDetailLoading(true);
                try {
                    const profile = await api.experts.getProfile(expertId);
                    setSelectedExpert(profile);
                } catch (error) {
                    if (import.meta.env.DEV) {
                        console.error('Error loading expert details:', error);
                    }
                } finally {
                    setDetailLoading(false);
                }
            }
        };

        if (!loading) { // Only try to match after main list loaded (or failed), optimization
            loadSelectedExpert();
        } else if (expertId && experts.length === 0) {
            // If main list is loading but we have an ID, we might wait or fetch in parallel. 
            // Ideally we wait for main list. 
            // But if main list is slow, we want to see profile fast. 
            // Let's rely on list load first for simplicity to avoid double fetch race conditions
        }
    }, [expertId, experts, loading]);




    // ... existing effective/state loading ...

    const countries = ['All', 'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Egypt', 'Rwanda', 'Sierra Leone'];
    const projectTypes = ['All', 'Web Development', 'Mobile App', 'UI/UX Design', 'Data Science', 'DevOps', 'Cybersecurity'];

    const filteredExperts = experts.filter(expert => {
        const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expert.title && expert.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (expert.skills && expert.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesStack = selectedStack === 'All' || (expert.skills && expert.skills.includes(selectedStack));

        const matchesCountry = selectedCountry === 'All' ||
            (expert.location && expert.location.includes(selectedCountry));

        const matchesType = selectedProjectType === 'All' ||
            (expert.title && expert.title.toLowerCase().includes(selectedProjectType.toLowerCase())) ||
            (expert.skills && expert.skills.some(skill =>
                skill.toLowerCase().includes(selectedProjectType.toLowerCase())
            ));

        return matchesSearch && matchesStack && matchesCountry && matchesType;
    });

    const stacks = ['All', 'React', 'Node.js', 'Python', 'Figma', 'Cybersecurity', 'DevOps']; // Keep popular stacks as quick filters if desired, or rely on search

    // Render Detail View
    if (expertId) {
        if (detailLoading || (loading && !selectedExpert)) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            );
        }
        return (
            <ExpertDetail
                expert={selectedExpert}
                onBack={() => setSearchParams({})}
                isOwnProfile={user?.id === selectedExpert.id}
                onEditProfile={() => navigate('/expert-dashboard')}
                onHire={handleHireClick}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO
                title="Browse Experts"
                description="Find and hire top African tech talent. Vetted developers, designers, and product managers ready to join your team."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Vetted African Talent</h1>
                        <p className="text-lg text-gray-600 mt-2 max-w-2xl">Connect with the top 1% of developers, designers, and creative professionals.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 sticky top-20 z-10 transition-shadow hover:shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Search */}
                        <div className="md:col-span-5 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, role, or skill..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Country Filter */}
                        <div className="md:col-span-3 relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white cursor-pointer"
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value)}
                            >
                                {countries.map(country => (
                                    <option key={country} value={country}>{country === 'All' ? 'All Countries' : country}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Project Type Filter */}
                        <div className="md:col-span-4 relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white cursor-pointer"
                                value={selectedProjectType}
                                onChange={(e) => setSelectedProjectType(e.target.value)}
                            >
                                {projectTypes.map(type => (
                                    <option key={type} value={type}>{type === 'All' ? 'All Project Types' : type}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

                    {/* Quick Skills Stack */}
                    <div className="flex gap-2 overflow-x-auto w-full pb-2 mt-4 scrollbar-hide border-t border-gray-100 pt-4">
                        <span className="text-sm text-gray-500 py-2 mr-2">Popular:</span>
                        {stacks.map(stack => (
                            <button
                                key={stack}
                                onClick={() => setSelectedStack(stack)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedStack === stack
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                                    }`}
                            >
                                {stack}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                {
                    loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Card key={i} className="p-0 h-96 animate-pulse bg-gray-100 border-none rounded-2xl">
                                    <div className="h-full w-full"></div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {filteredExperts.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
                                    >
                                        <Search size={64} className="mx-auto text-gray-200 mb-6" />
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No experts found</h3>
                                        <p className="text-gray-500 mb-6">We couldn't find any experts matching your criteria.</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setSelectedStack('All');
                                                setSelectedCountry('All');
                                                setSelectedProjectType('All');
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </motion.div>
                                ) : (
                                    filteredExperts.map((expert) => (
                                        <motion.div
                                            key={expert.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card hoverEffect className="p-0 flex flex-col h-full overflow-hidden border border-gray-100 hover:border-primary/30 transition-all rounded-2xl">
                                                <div className="p-6">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <img
                                                                    src={expert.profile_image_url || `https://ui-avatars.com/api/?name=${expert.name}`}
                                                                    alt={expert.name}
                                                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-gray-100"
                                                                />
                                                                {(expert.vetting_status === 'verified' || expert.verified) && (
                                                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
                                                                        <CheckCircle size={16} className="text-blue-500 fill-blue-500 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                                    {expert.name}
                                                                </h3>
                                                                <p className="text-primary font-medium text-sm line-clamp-1">{expert.title || 'Expert'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0 border border-yellow-100">
                                                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                            <span className="text-yellow-700 font-bold text-sm">{expert.rating || '5.0'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6 px-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin size={14} className="text-gray-400" />
                                                            <span className="line-clamp-1">{expert.location || 'Remote'}</span>
                                                        </div>
                                                        <div className="font-bold text-gray-900 flex items-center gap-1">
                                                            <span className="text-lg">${expert.hourly_rate || '0'}</span>
                                                            <span className="text-gray-400 font-normal text-xs">/hr</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-6 h-[72px] overflow-hidden content-start">
                                                        {(expert.skills || []).slice(0, 4).map((tech) => (
                                                            <span key={tech} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 font-medium">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                        {(!expert.skills || expert.skills.length === 0) && (
                                                            <span className="text-xs text-gray-400 italic">No skills listed</span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mt-auto">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700"
                                                            onClick={() => setSearchParams({ id: expert.id })}
                                                        >
                                                            View Profile
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="w-full shadow-sm"
                                                            onClick={() => handleHireClick(expert)}
                                                        >
                                                            Hire Now
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default Experts;
