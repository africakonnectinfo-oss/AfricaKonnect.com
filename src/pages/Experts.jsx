import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Star, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link, useSearchParams } from 'react-router-dom';
import ExpertDetail from '../components/ExpertDetail'; // Import the new component

import { api } from '../lib/api';

const Experts = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const expertId = searchParams.get('id');

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStack, setSelectedStack] = useState('All');

    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExpert, setSelectedExpert] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Initial load
    useEffect(() => {
        const fetchExperts = async () => {
            try {
                console.log('Fetching experts...');
                const data = await api.experts.getAll(); // Now returns all vetted/pending based on controller logic
                console.log('Experts data received:', data);
                if (data && data.experts) {
                    setExperts(data.experts);
                } else {
                    console.warn('Unexpected experts data format:', data);
                    setExperts([]);
                }
            } catch (error) {
                console.error('Error loading experts:', error);
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
                    console.error('Error loading expert details:', error);
                    // Maybe show notification
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


    const filteredExperts = experts.filter(expert => {
        const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (expert.title && expert.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStack = selectedStack === 'All' || (expert.skills && expert.skills.includes(selectedStack));
        return matchesSearch && matchesStack;
    });

    const stacks = ['All', 'React', 'Node.js', 'Python', 'Figma', 'Cybersecurity', 'DevOps'];

    // Render Detail View
    if (expertId) {
        if (detailLoading || (loading && !selectedExpert)) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            );
        }
        return <ExpertDetail expert={selectedExpert} onBack={() => setSearchParams({})} />;
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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 sticky top-20 z-10 transition-shadow hover:shadow-md">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, role, or skill..."
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            {stacks.map(stack => (
                                <button
                                    key={stack}
                                    onClick={() => setSelectedStack(stack)}
                                    className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedStack === stack
                                        ? 'bg-primary text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {stack}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
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
                                        onClick={() => { setSearchTerm(''); setSelectedStack('All'); }}
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
                                                    <Button size="sm" className="w-full shadow-sm">Hire Now</Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Experts;
