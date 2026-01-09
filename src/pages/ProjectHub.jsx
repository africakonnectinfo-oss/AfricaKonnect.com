import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Briefcase, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

import { Step1Vault } from '../features/project-hub/Step1Vault';
import { Step2Match } from '../features/project-hub/Step2Match';
import { Step3Interview } from '../features/project-hub/Step3Interview';
import { Step4Contract } from '../features/project-hub/Step4Contract';

const steps = [
    "Company Vault",
    "AI Match",
    "Interview",
    "Contract"
];

const ProjectHub = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'wizard'
    const [clientProjects, setClientProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Fetch user projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            // Check if expert (redirect handled by legacy effect below effectively)
            const userInfo = localStorage.getItem('userInfo');
            let isExpert = false;
            if (userInfo) {
                try {
                    const parsed = JSON.parse(userInfo);
                    if (parsed.role === 'expert') {
                        navigate('/expert-dashboard');
                        return;
                    }
                } catch (e) { }
            }

            if (user?.id) {
                try {
                    const data = await api.projects.getMine();
                    if (data && data.projects) {
                        setClientProjects(data.projects);
                        // Always show list view first, let user choose to create project
                        setViewMode('list');
                    }
                } catch (e) {
                    console.error("Failed to load projects", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [navigate, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }


    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Vault onNext={nextStep} />;
            case 2: return <Step2Match onNext={nextStep} />;
            case 3: return <Step3Interview onNext={nextStep} />;
            case 4: return <Step4Contract onNext={nextStep} />;
            default: return <Step1Vault onNext={nextStep} />;
        }
    };

    if (viewMode === 'list' && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12">
                <SEO title="My Projects" description="Manage your Africa Konnect projects." />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
                            <p className="text-gray-600">Track and manage your ongoing work</p>
                        </div>
                        <Button onClick={() => setViewMode('wizard')}>
                            <Plus className="mr-2" size={20} />
                            New Project
                        </Button>
                    </div>

                    {clientProjects.length === 0 ? (
                        <Card className="p-12 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="text-primary w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h2>
                            <p className="text-gray-600 mb-8">Start your first project to connect with top African tech talent.</p>
                            <Button size="lg" onClick={() => setViewMode('wizard')}>Start Project</Button>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {clientProjects.map(p => (
                                <Card key={p.id} className="p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold 
                                                    ${p.status === 'active' ? 'bg-success/10 text-success' :
                                                        p.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-primary/10 text-primary'}`}>
                                                    {p.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{p.description}</p>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(p.created_at).toLocaleDateString()}</span>
                                                <span>Budget: ${p.budget}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {p.status === 'active' || p.status === 'contracted' ? (
                                                <Button onClick={() => navigate('/collaboration')}>
                                                    Open Workspace <ChevronRight size={16} className="ml-1" />
                                                </Button>
                                            ) : (
                                                <Button variant="secondary" onClick={() => {
                                                    // Logic to resume editing would go here
                                                    // For now, simpler to just direct them to wizard logic 
                                                    // OR if it's draft, we might want to load it into context
                                                    alert('Resume editing feature coming soon');
                                                }}>
                                                    Manage
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // Render Wizard View (Legacy ProjectHub)
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO
                title="Create Project"
                description="Start a new project with Africa Konnect."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Back Button */}
                <div className="mb-8 flex items-center justify-between">
                    <button
                        onClick={() => setViewMode('list')}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
                    <div className="w-20"></div> {/* Spacer */}
                </div>

                {/* Progress Stepper */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, index) => {
                            const stepNum = index + 1;
                            const isActive = stepNum === currentStep;
                            const isCompleted = stepNum < currentStep;

                            return (
                                <div key={step} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${isActive
                                            ? 'bg-primary text-white ring-4 ring-primary/20 scale-110'
                                            : isCompleted
                                                ? 'bg-success text-white'
                                                : 'bg-gray-200 text-gray-500'
                                            }`}
                                    >
                                        {isCompleted ? '✓' : stepNum}
                                    </div>
                                    <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-gray-400'
                                        }`}>
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProjectHub;
