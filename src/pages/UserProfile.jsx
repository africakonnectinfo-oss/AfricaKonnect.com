import React, { useState, useEffect, useRef } from 'react';
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
    Briefcase, Award, Save, X, Loader2, Check, ShieldCheck,
    Upload, FileText, Trash2, Plus, Monitor, Shield, Info
} from 'lucide-react';

import NotificationPreferences from '../components/bidding/NotificationPreferences';

const UserProfile = () => {
    const navigate = useNavigate();
    const { user, profile, updateProfile, uploadProfileImage, isExpert, loading: authLoading } = useAuth();
    const { uploadFile, uploading } = useFileUpload();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);

    // Initial state matching database schema
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        bio: '',
        company: '',
        website: '',
        skills: [],
        services: [], // New JSONB field
        documents: [], // New JSONB field
        // Expert-specific fields
        title: '',
        hourly_rate: ''
    });

    const [newSkill, setNewSkill] = useState('');
    const [newService, setNewService] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/signin');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || user?.name || '',
                email: profile.email || user?.email || '',
                phone: profile.phone || '',
                country: profile.country || '',
                city: profile.city || '',
                bio: profile.bio || '',
                company: profile.company || '',
                website: profile.website || '',
                skills: profile.skills || [],
                services: profile.services || [],
                documents: profile.documents || [],
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
            setImagePreview(previewUrl);
            await uploadProfileImage(file);
            toast.success('Avatar updated successfully!');
        } catch (error) {
            toast.error('Error uploading image: ' + error.message);
        }
    };

    const handleDocumentUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await uploadFile(file);
            const newDoc = {
                name: file.name,
                url: result.url,
                type: file.type,
                uploadedAt: new Date().toISOString()
            };
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, newDoc]
            }));
            toast.success(`${file.name} uploaded successfully!`);
        } catch (error) {
            toast.error('Upload failed: ' + error.message);
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const handleAddService = () => {
        if (newService.trim() && !formData.services.includes(newService.trim())) {
            setFormData(prev => ({ ...prev, services: [...prev.services, newService.trim()] }));
            setNewService('');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Prepared data for common user fields
            const userData = {
                name: formData.name,
                phone: formData.phone,
                country: formData.country,
                city: formData.city,
                company: formData.company,
                profileImageUrl: imagePreview
            };

            await updateProfile(userData);

            if (isExpert) {
                const expertData = {
                    title: formData.title,
                    bio: formData.bio,
                    country: formData.country,
                    city: formData.city,
                    company: formData.company,
                    skills: formData.skills,
                    services: formData.services,
                    documents: formData.documents,
                    hourlyRate: parseFloat(formData.hourly_rate) || 0,
                    profileImageUrl: imagePreview
                };

                await api.experts.updateProfile(user.id, expertData);
            }

            toast.success('Detailed profile updated successfully!');
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const InputGroup = ({ icon: Icon, label, value, onChange, disabled, type = "text", placeholder }) => (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 ${disabled ? 'bg-gray-50/50 border-gray-100 shadow-inner' : 'bg-white border-gray-200 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 active:scale-[0.99]'}`}>
                <Icon size={18} className={`${disabled ? 'text-gray-300' : 'text-primary'}`} />
                <input
                    type={type}
                    value={value}
                    onChange={onChange ? e => onChange(e.target.value) : undefined}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-[15px] font-medium text-gray-900 placeholder:text-gray-400"
                />
            </div>
        </div>
    );

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50/30"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="min-h-screen bg-[#FDFDFF] py-24 px-4 sm:px-6">
            <SEO title="My Settings | Africa Konnect" />

            <div className="max-w-6xl mx-auto">
                {/* Modern Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Monitor size={20} className="text-primary" />
                            </div>
                            <span className="text-sm font-bold text-primary uppercase tracking-widest">Settings</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Profile Center</h1>
                        <p className="text-gray-500 font-medium">Control your identity and professional presence.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {editing ? (
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving} className="rounded-2xl px-6">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="rounded-2xl px-8 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
                                    Save Changes
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => setEditing(true)} className="rounded-2xl px-8 shadow-xl shadow-primary/20">
                                Edit My Profile
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Sidebar: Navigation & Identity */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border-gray-100/50 overflow-hidden">
                            <div className="relative h-32 bg-gradient-to-br from-primary via-blue-600 to-indigo-600">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            </div>
                            <div className="px-8 pb-8 -mt-16 relative">
                                <div className="relative inline-block group mb-6">
                                    <div className="w-32 h-32 rounded-[2rem] border-[6px] border-white shadow-2xl overflow-hidden bg-white rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                                                <User size={56} />
                                            </div>
                                        )}
                                        {/* Premium Overlay */}
                                        <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity duration-300 ${editing ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                                            <Camera size={24} className="text-white mb-1" />
                                            <span className="text-[10px] text-white font-bold uppercase">Update</span>
                                        </div>
                                    </div>
                                    {editing && (
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="absolute -bottom-2 -right-2 p-3 bg-white shadow-xl rounded-2xl border border-gray-100 text-primary hover:scale-110 transition-transform active:scale-95"
                                        >
                                            <Upload size={18} />
                                            <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-1 mb-8">
                                    <h2 className="text-2xl font-black text-gray-900 leading-none">{formData.name || 'Anonymous User'}</h2>
                                    <p className="text-gray-400 font-medium text-sm flex items-center gap-1.5 truncate">
                                        <Mail size={14} /> {user?.email}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <User size={18} /> Profile Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('notifications')}
                                        className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg shadow-blue-300' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <Shield size={18} /> Connectivity
                                    </button>
                                </div>
                            </div>
                        </Card>

                        {/* Profile Completion Card */}
                        {isExpert && (
                            <Card className="p-8 rounded-[2rem] bg-gray-900 text-white border-none shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Award size={100} />
                                </div>
                                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Check size={20} className="text-green-400" /> Completeness
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-3xl font-black">{profile?.profile_completeness || 0}%</span>
                                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Target: 100%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${profile?.profile_completeness || 0}%` }}
                                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        Adding documents and certification details increases your ranking visibility by 2.5x.
                                    </p>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Right Side: Tab Panels */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    key="profile-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    {/* Personal Info */}
                                    <Card className="p-8 md:p-10 rounded-[2.5rem] shadow-sm border-gray-100/60">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                                <User size={20} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Personal Details</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <InputGroup icon={User} label="Full Display Name" value={formData.name} onChange={val => setFormData({ ...formData, name: val })} disabled={!editing} />
                                            <InputGroup icon={Phone} label="Mobile Contact" value={formData.phone} onChange={val => setFormData({ ...formData, phone: val })} disabled={!editing} placeholder="+234 ..." />
                                            <InputGroup icon={Globe} label="Country" value={formData.country} onChange={val => setFormData({ ...formData, country: val })} disabled={!editing} placeholder="Nigeria" />
                                            <InputGroup icon={MapPin} label="City / Region" value={formData.city} onChange={val => setFormData({ ...formData, city: val })} disabled={!editing} placeholder="Lagos" />
                                        </div>

                                        <div className="mt-8 space-y-2">
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Professional Biography</label>
                                            <textarea
                                                className={`w-full p-5 rounded-[1.5rem] border transition-all duration-300 resize-none ${editing ? 'bg-white border-gray-200 shadow-sm focus:ring-4 focus:ring-primary/5 focus:border-primary' : 'bg-gray-50/50 border-gray-100 text-gray-600 shadow-inner'}`}
                                                rows={5}
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                                disabled={!editing}
                                                placeholder="Tell potential collaborators about your accomplishments and unique approach..."
                                            />
                                        </div>
                                    </Card>

                                    {/* Professional/Expert Details */}
                                    <Card className="p-8 md:p-10 rounded-[2.5rem] shadow-sm border-gray-100/60">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <Briefcase size={20} />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{isExpert ? 'Professional Profile' : 'Business Details'}</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            <InputGroup icon={Building} label="Current Company" value={formData.company} onChange={val => setFormData({ ...formData, company: val })} disabled={!editing} />
                                            <InputGroup icon={Globe} label="Work Website" value={formData.website} onChange={val => setFormData({ ...formData, website: val })} disabled={!editing} placeholder="https://..." />
                                            {isExpert && (
                                                <>
                                                    <InputGroup icon={Monitor} label="Professional Title" value={formData.title} onChange={val => setFormData({ ...formData, title: val })} disabled={!editing} placeholder="e.g. Creative Director" />
                                                    <InputGroup icon={Check} label="Hourly Rate ($)" value={formData.hourly_rate} onChange={val => setFormData({ ...formData, hourly_rate: val })} disabled={!editing} type="number" />
                                                </>
                                            )}
                                        </div>

                                        {isExpert && (
                                            <div className="space-y-8 pt-8 border-t border-gray-100">
                                                {/* Skills Section */}
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-sm font-bold text-gray-700">Expertise Tags</label>
                                                        <span className="text-[10px] text-gray-400 uppercase font-black">Multi-select available</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 min-h-[60px]">
                                                        {formData.skills.map((skill, i) => (
                                                            <motion.div
                                                                initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                                                key={i} className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
                                                            >
                                                                {skill}
                                                                {editing && <X size={14} className="cursor-pointer text-gray-400 hover:text-red-500 transition-colors" onClick={() => handleRemoveSkill(skill)} />}
                                                            </motion.div>
                                                        ))}
                                                        {editing && (
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 w-32 shadow-sm"
                                                                    placeholder="+ Add Skill"
                                                                    value={newSkill}
                                                                    onChange={e => setNewSkill(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Services Section */}
                                                <div className="space-y-4">
                                                    <label className="text-sm font-bold text-gray-700">Services Offered</label>
                                                    <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 min-h-[60px]">
                                                        {formData.services.map((service, i) => (
                                                            <motion.div
                                                                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                                key={i} className="px-4 py-2 bg-primary/5 text-primary border border-primary/20 rounded-xl text-sm font-bold flex items-center gap-2"
                                                            >
                                                                {service}
                                                                {editing && <X size={14} className="cursor-pointer hover:text-primary transition-opacity" onClick={() => setFormData(p => ({ ...p, services: p.services.filter((_, idx) => idx !== i) }))} />}
                                                            </motion.div>
                                                        ))}
                                                        {editing && (
                                                            <input
                                                                type="text"
                                                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 w-32 shadow-sm"
                                                                placeholder="+ Add Service"
                                                                value={newService}
                                                                onChange={e => setNewService(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleAddService()}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </Card>

                                    {/* Verification & Documents */}
                                    <Card className="p-8 md:p-10 rounded-[2.5rem] shadow-sm border-gray-100/60">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                                                    <Shield size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Trust & Verification</h3>
                                                    <p className="text-xs text-gray-400 font-medium">Verify your identity and portfolio.</p>
                                                </div>
                                            </div>
                                            {editing && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl border-dashed border-2 hover:bg-gray-50"
                                                    onClick={() => document.getElementById('doc-upload').click()}
                                                    disabled={uploading}
                                                >
                                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                    <span className="ml-2">Add Document</span>
                                                    <input id="doc-upload" type="file" className="hidden" onChange={handleDocumentUpload} />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {formData.documents.length === 0 ? (
                                                <div className="p-10 text-center rounded-[2rem] border-2 border-dashed border-gray-100 bg-gray-50/30">
                                                    <div className="mx-auto w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-300 mb-3">
                                                        <FileText size={20} />
                                                    </div>
                                                    <p className="text-gray-500 font-medium text-sm">No verification documents added yet.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {formData.documents.map((doc, i) => (
                                                        <motion.div
                                                            layout
                                                            key={i}
                                                            className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                                <FileText size={18} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                            </div>
                                                            {editing && (
                                                                <button
                                                                    onClick={() => removeDocument(i)}
                                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <Info size={18} className="text-blue-600 mt-1 flex-shrink-0" />
                                                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                                    High-quality portfolio PDF and ID verification documents are encrypted and only accessible by the Africa Konnect Vetting Team. Your privacy is our priority.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="notif-tab"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <NotificationPreferences />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
