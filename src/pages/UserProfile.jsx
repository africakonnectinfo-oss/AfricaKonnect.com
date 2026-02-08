import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { api } from '../lib/api';
import { toast } from 'sonner';
import {
    User, Mail, Phone, MapPin, Building, Globe, Camera,
    Briefcase, Award, Save, X, Loader2, Check, ShieldCheck
} from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const { user, profile, updateProfile, uploadProfileImage, isExpert, loading: authLoading } = useAuth();
    const { uploadFile, uploading } = useFileUpload();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial state
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', location: '', bio: '',
        company: '', website: '', skills: [], certifications: [],
        // Expert-specific fields
        title: '', hourly_rate: ''
    });

    const [newSkill, setNewSkill] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [newCert, setNewCert] = useState({ name: '', issuer: '', year: '' });
    const [newCertFile, setNewCertFile] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/signin');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || user?.name || '',
                email: profile.email || user?.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                company: profile.company || '',
                website: profile.website || '',
                skills: profile.skills || [],
                certifications: profile.certifications || [],
                // Expert-specific fields
                title: profile.title || '',
                hourly_rate: profile.hourly_rate || ''
            });
            if (profile.profile_image_url || user?.profile_image_url) {
                setImagePreview(profile.profile_image_url || user.profile_image_url);
            }
        }
    }, [profile, user]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl); // Immediate local preview
            await uploadProfileImage(file);
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update user profile
            await updateProfile(formData);

            // If expert, also update expert profile
            if (isExpert) {
                const expertData = {
                    title: formData.title,
                    bio: formData.bio,
                    location: formData.location,
                    skills: formData.skills,
                    hourlyRate: parseFloat(formData.hourly_rate) || 0,
                    profileImageUrl: imagePreview,
                    certifications: formData.certifications
                };

                try {
                    await api.experts.updateProfile(user.id, expertData);
                    toast.success('Profile updated successfully!');
                } catch (expertError) {
                    // If profile doesn't exist, create it
                    if (expertError.response?.status === 404) {
                        await api.experts.createProfile(expertData);
                        toast.success('Expert profile created successfully!');
                    } else {
                        throw expertError;
                    }
                }
            } else {
                toast.success('Profile updated successfully!');
            }

            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // --- Sub-components for cleaner render ---

    const InputGroup = ({ icon: Icon, label, value, onChange, disabled, type = "text", placeholder }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${disabled ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'}`}>
                <Icon size={18} className={`${disabled ? 'text-gray-400' : 'text-primary'}`} />
                <input
                    type={type}
                    value={value}
                    onChange={onChange ? e => onChange(e.target.value) : undefined}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                />
            </div>
        </div>
    );

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title="My Profile" />
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Public Profile</h1>
                        <p className="text-gray-500">Manage how you appear to others on the platform.</p>
                    </div>
                    <div className="flex gap-3">
                        {editing ? (
                            <>
                                <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving && <Loader2 className="animate-spin mr-2" size={16} />}
                                    Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Avatar & Status */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/10 to-blue-50"></div>
                            <div className="relative mb-6">
                                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden bg-white relative group">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300"><User size={48} /></div>
                                    )}

                                    {/* Upload Overlay */}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity duration-200">
                                        <Camera size={24} className="mb-1" />
                                        <span className="text-xs font-medium">Change Photo</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading || !editing} />
                                    </label>
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">{formData.name || 'Your Name'}</h2>
                            <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm">
                                {isExpert ? <ShieldCheck size={16} /> : <User size={16} />}
                                <span className="capitalize">{isExpert ? 'Verified Expert' : 'Client Account'}</span>
                            </div>
                        </Card>

                        {/* Completion / Stats Card could go here */}
                    </div>

                    {/* Right Column: Form Fields */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="p-8">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <User size={20} className="text-primary" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup icon={User} label="Full Name" value={formData.name} onChange={val => setFormData({ ...formData, name: val })} disabled={!editing} />
                                <InputGroup icon={Mail} label="Email Address" value={formData.email} disabled={true} />
                                <InputGroup icon={Phone} label="Phone Number" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val })} disabled={!editing} placeholder="+1 234 567 890" />
                                <InputGroup icon={MapPin} label="Location" value={formData.location} onChange={val => setFormData({ ...formData, location: val })} disabled={!editing} placeholder="San Francisco, CA" />
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Bio</label>
                                <textarea
                                    className={`w-full p-4 rounded-xl border transition-all ${editing ? 'bg-white border-gray-200 focus:ring-4 focus:ring-primary/10 focus:border-primary' : 'bg-gray-50 border-transparent text-gray-600'}`}
                                    rows={4}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    disabled={!editing}
                                    placeholder="Tell potential clients about your expertise..."
                                />
                            </div>
                        </Card>

                        {(formData.company || formData.website || isExpert) && (
                            <Card className="p-8">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <Briefcase size={20} className="text-primary" /> Professional Details
                                </h3>

                                {/* Expert-specific fields */}
                                {isExpert && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Professional Title</label>
                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${!editing ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'}`}>
                                                <Briefcase size={18} className={`${!editing ? 'text-gray-400' : 'text-primary'}`} />
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                    disabled={!editing}
                                                    placeholder="e.g. Senior Full Stack Developer"
                                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hourly Rate (USD)</label>
                                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${!editing ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'}`}>
                                                <span className={`text-sm font-semibold ${!editing ? 'text-gray-400' : 'text-primary'}`}>$</span>
                                                <input
                                                    type="number"
                                                    value={formData.hourly_rate}
                                                    onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })}
                                                    disabled={!editing}
                                                    placeholder="50"
                                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    {!isExpert && <InputGroup icon={Building} label="Company" value={formData.company} onChange={val => setFormData({ ...formData, company: val })} disabled={!editing} />}
                                    <InputGroup icon={Globe} label="Website" value={formData.website} onChange={val => setFormData({ ...formData, website: val })} disabled={!editing} placeholder="https://" />
                                </div>

                                {isExpert && (
                                    <div className="space-y-6 border-t border-gray-100 pt-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills</label>
                                                {editing && <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => document.getElementById('skill-input').focus()}>Add New</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.skills.map((skill, i) => (
                                                    <span key={i} className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-sm font-medium border border-primary/10 flex items-center gap-2">
                                                        {skill}
                                                        {editing && <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => handleRemoveSkill(skill)} />}
                                                    </span>
                                                ))}
                                                {editing && (
                                                    <input
                                                        id="skill-input"
                                                        type="text"
                                                        className="px-3 py-1 bg-gray-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-primary/20 min-w-[100px]"
                                                        placeholder="Type & Enter..."
                                                        value={newSkill}
                                                        onChange={e => setNewSkill(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
