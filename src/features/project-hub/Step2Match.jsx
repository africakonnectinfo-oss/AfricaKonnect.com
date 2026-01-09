import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, MapPin, Star, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useProject } from '../../contexts/ProjectContext';

const Step2Match = ({ onNext }) => {
    const { currentProject, inviteExpert } = useProject();
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [experts, setExperts] = useState([]);
    const [selectedExpert, setSelectedExpert] = useState(null);
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        loadExperts();
    }, []);

    const loadExperts = async () => {
        try {
            setLoading(true);
            const data = await api.experts.getAll({
                verified: 'true'
                // In future, pass currentProject.techStack to filter
            });
            setExperts(data.experts || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            // Simulate analysis delay for effect
            setTimeout(() => setStatsLoading(false), 2000);
        }
    };

    const handleInvite = async () => {
        if (!selectedExpert || !currentProject) return;

        try {
            setInviting(true);
            await inviteExpert(currentProject.id, selectedExpert);
            onNext();
        } catch (error) {
            alert('Failed to invite expert');
        } finally {
            setInviting(false);
        }
    };

    if (loading || statsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-24 h-24 mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full border-4 border-gray-200 border-t-primary rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <Sparkles size={32} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing your company DNA...</h2>
                <p className="text-gray-600">Scanning {experts.length > 0 ? experts.length : '5,000+'} vetted experts for the perfect match.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">We Found Your Top Matches</h2>
                <p className="text-gray-600">Based on your stack and requirements, these experts are the best fit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {experts.map((expert) => (
                    <Card
                        key={expert.id}
                        className={`cursor-pointer transition-all ${selectedExpert === expert.id
                            ? 'ring-2 ring-primary border-primary shadow-xl shadow-primary/10'
                            : 'hover:border-primary/50'
                            }`}
                        onClick={() => setSelectedExpert(expert.id)}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={expert.profile_image_url || `https://ui-avatars.com/api/?name=${expert.name}`}
                                    alt={expert.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                                />
                                <div>
                                    <h3 className="font-bold text-gray-900">{expert.name}</h3>
                                    <p className="text-primary font-medium text-sm">{expert.title || 'Expert'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {expert.location || 'Remote'}
                                </div>
                                <div className="flex items-center gap-1 bg-highlight/10 px-2 py-1 rounded-lg">
                                    <Star size={12} className="text-highlight fill-highlight" />
                                    <span className="text-highlight font-bold text-sm">9.8</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                <p className="text-xs text-blue-700 font-medium">
                                    <Sparkles size={12} className="inline mr-1" />
                                    Why We Matched You
                                </p>
                                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                                    {expert.bio ? expert.bio.substring(0, 80) + '...' : 'Perfect match for your requirements.'}
                                </p>
                            </div>

                            {selectedExpert === expert.id && (
                                <div className="flex justify-center text-primary">
                                    <CheckCircle size={24} className="fill-primary text-white" />
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <div className="flex justify-end">
                <Button
                    size="lg"
                    onClick={handleInvite}
                    disabled={!selectedExpert || inviting}
                >
                    {inviting ? 'Inviting...' : 'Select Expert & Continue'}
                </Button>
            </div>
        </div>
    );
};

export { Step2Match };
