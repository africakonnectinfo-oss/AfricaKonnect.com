import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import { User, MapPin, Building, Globe, Mail, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.auth.getPublicProfile(id);
                setProfile(data);
            } catch (err) {
                console.error("Failed to load profile", err);
                setError("User not found or access denied.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20">
                <p className="text-xl text-red-500 mb-4">{error || "Profile not found"}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const isExpert = profile.role === 'expert';

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO title={`${profile.name} - Profile`} description={`View profile of ${profile.name}`} />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header / Cover */}
                    <div className="h-32 bg-gradient-to-r from-primary/80 to-purple-600"></div>

                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                                    {profile.profileImage ? (
                                        <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                            <User size={40} />
                                        </div>
                                    )}
                                </div>
                                {profile.isVerified && (
                                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5" title="Verified">
                                        <CheckCircle size={20} className="text-blue-500 fill-blue-500 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Actions? e.g. Message if allowed */}
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                {profile.name}
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200 uppercase">
                                    {profile.role}
                                </span>
                            </h1>
                            {profile.title && <p className="text-primary font-medium">{profile.title}</p>}

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                                {profile.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} className="text-gray-400" />
                                        {profile.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar size={16} className="text-gray-400" />
                                    Joined {new Date(profile.joinedAt).toLocaleDateString()}
                                </div>
                                {profile.company && (
                                    <div className="flex items-center gap-1">
                                        <Building size={16} className="text-gray-400" />
                                        {profile.company}
                                    </div>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                        <Globe size={16} />
                                        Website
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-100 pt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
                            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                {profile.bio || "No bio information provided."}
                            </p>
                        </div>

                        {/* If we had more public info like skills for experts, we could show it here.
                            Ideally for experts, we redirect to generic Experts Detail view which is richer.
                            This view is good for Clients.
                         */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
