import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { api } from '../../lib/api';

const ExpertProfile = ({ user, existingProfile, onComplete }) => {
    const [formData, setFormData] = useState({
        title: existingProfile?.title || '',
        bio: existingProfile?.bio || '',
        location: existingProfile?.location || '',
        hourly_rate: existingProfile?.hourly_rate || '',
        skills: existingProfile?.skills || [],
        certifications: existingProfile?.certifications || []
    });

    // Local state for adding new items
    const [newSkill, setNewSkill] = useState('');
    const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });

    // Portfolio state
    const [portfolioItems, setPortfolioItems] = useState(existingProfile?.portfolio_items || []);
    const [showAddPortfolio, setShowAddPortfolio] = useState(false);
    const [newPortfolio, setNewPortfolio] = useState({ title: '', description: '', url: '', type: 'link' });

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basics'); // basics, skills, portfolio

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Skills Logic
    const addSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
    };

    // Certifications Logic
    const addCertification = () => {
        if (newCert.name && newCert.issuer) {
            setFormData(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
            setNewCert({ name: '', issuer: '', year: '' });
        }
    };

    const removeCertification = (index) => {
        setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
    };

    // Portfolio Logic
    const handleAddPortfolio = async () => {
        if (!newPortfolio.title || !newPortfolio.url) return;
        setLoading(true);
        try {
            const res = await api.experts.addPortfolio(newPortfolio);
            setPortfolioItems(res.portfolioItems); // Update local list from server response
            setShowAddPortfolio(false);
            setNewPortfolio({ title: '', description: '', url: '', type: 'link' });
        } catch (error) {
            console.error("Failed to add portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePortfolio = async (itemId) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        setLoading(true);
        try {
            const res = await api.experts.removePortfolio(itemId);
            setPortfolioItems(res.portfolioItems);
        } catch (error) {
            console.error("Failed to remove portfolio", error);
        } finally {
            setLoading(false);
        }
    };

    // Main Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check if profile exists; if not create, else update
            // Actually the parent Dashboard handles logic, but api endpoints differ? 
            // expertController says createProfile checks for existing.
            // But we can just use updateProfile if we know it exists, or create if not.
            // Dashboard passes existingProfile null if not exists.

            if (existingProfile) {
                await api.experts.updateProfile(user.id, {
                    ...formData,
                    hourlyRate: formData.hourly_rate // Map back to API field name
                });
            } else {
                await api.experts.createProfile({
                    ...formData,
                    hourlyRate: formData.hourly_rate,
                    profileImageUrl: user?.user_metadata?.avatar_url
                });
            }

            if (onComplete) onComplete();
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto overflow-hidden">
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('basics')}
                    className={`px-6 py-4 font-medium text-sm flex-1 ${activeTab === 'basics' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Basics & Certifications
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`px-6 py-4 font-medium text-sm flex-1 ${activeTab === 'skills' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Skills & Expertise
                </button>
                <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-6 py-4 font-medium text-sm flex-1 ${activeTab === 'portfolio' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Portfolio ({portfolioItems.length})
                </button>
            </div>

            <div className="p-8">
                {activeTab === 'basics' && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g. Senior Full Stack Developer"
                                    value={formData.title}
                                    onChange={e => handleChange('title', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (USD)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g. 50"
                                    value={formData.hourly_rate}
                                    onChange={e => handleChange('hourly_rate', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g. Nairobi, Kenya"
                                value={formData.location}
                                onChange={e => handleChange('location', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Bio</label>
                            <textarea
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Highlight your experience, key achievements, and what makes you unique..."
                                value={formData.bio}
                                onChange={e => handleChange('bio', e.target.value)}
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Certifications & Awards</h3>
                            <div className="space-y-4 mb-4">
                                {formData.certifications.map((cert, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div>
                                            <p className="font-bold text-gray-900">{cert.name}</p>
                                            <p className="text-xs text-gray-500">{cert.issuer} • {cert.year}</p>
                                        </div>
                                        <button type="button" onClick={() => removeCertification(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input placeholder="Certificate Name" className="border p-2 rounded" value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} />
                                <input placeholder="Issuer" className="border p-2 rounded" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} />
                                <div className="flex gap-2">
                                    <input placeholder="Year" className="border p-2 rounded w-20" value={newCert.year} onChange={e => setNewCert({ ...newCert, year: e.target.value })} />
                                    <Button type="button" size="sm" onClick={addCertification} variant="secondary">Add</Button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                        </div>
                    </form>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">My Skills</h3>
                            <p className="text-sm text-gray-500 mb-4">Add skills to help clients find you. Press Enter to add.</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.skills.map((skill, idx) => (
                                    <span key={idx} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                                        {skill}
                                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-primary/70">×</button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2 max-w-md">
                                <input
                                    type="text"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                                    placeholder="Add a skill (e.g. React, Python)"
                                    value={newSkill}
                                    onChange={e => setNewSkill(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                                <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 flex justify-end">
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Skills'}
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Portfolio Projects</h3>
                                <p className="text-sm text-gray-500">Showcase your best work to attract clients.</p>
                            </div>
                            <Button onClick={() => setShowAddPortfolio(!showAddPortfolio)}>
                                {showAddPortfolio ? 'Cancel' : '+ Add Project'}
                            </Button>
                        </div>

                        {showAddPortfolio && (
                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8 animate-in fade-in slide-in-from-top-4">
                                <h4 className="font-bold text-gray-900 mb-4">Add New Project</h4>
                                <div className="space-y-4">
                                    <input
                                        className="w-full border p-2 rounded"
                                        placeholder="Project Title"
                                        value={newPortfolio.title}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                                    />
                                    <textarea
                                        className="w-full border p-2 rounded"
                                        placeholder="Project Description"
                                        rows={3}
                                        value={newPortfolio.description}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            className="w-full border p-2 rounded"
                                            placeholder="Project URL"
                                            value={newPortfolio.url}
                                            onChange={e => setNewPortfolio({ ...newPortfolio, url: e.target.value })}
                                        />
                                        <input
                                            className="w-full border p-2 rounded"
                                            placeholder="Image URL (Optional)"
                                            value={newPortfolio.imageUrl || ''}
                                            onChange={e => setNewPortfolio({ ...newPortfolio, imageUrl: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <Button onClick={handleAddPortfolio} disabled={loading}>Add to Portfolio</Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {portfolioItems.map((item, idx) => (
                                <div key={item.id || idx} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all group relative">
                                    <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400">No Image</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                        {item.url && (
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-2 inline-block hover:underline">View Project</a>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemovePortfolio(item.id)}
                                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                        title="Delete"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            {portfolioItems.length === 0 && !showAddPortfolio && (
                                <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    No portfolio items yet. Add one to stand out!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ExpertProfile;
