import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';

const ExpertProfile = ({ user, existingProfile, onComplete }) => {
    const [formData, setFormData] = useState({
        hourly_rate: existingProfile?.hourly_rate || '',
        skills: existingProfile?.skills || [],
        bio: existingProfile?.bio || '',
        title: existingProfile?.title || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.experts.updateProfile(user.id, {
                ...formData,
                is_complete: true
            });
            if (onComplete) onComplete();
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Expert Profile Setup</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g. Senior React Developer"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                        type="number"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g. 50"
                        value={formData.hourly_rate}
                        onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tell clients about your experience..."
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Saving...' : 'Complete Profile'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default ExpertProfile;
