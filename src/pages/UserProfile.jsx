import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import {
    User, Mail, Phone, MapPin, Building, Globe, Camera,
    Briefcase, Award, Save, X, Loader2, Check
} from 'lucide-react';

const UserProfile = () => {
    const navigate = useNavigate();
    const { user, profile, updateProfile, uploadProfileImage, isExpert, loading: authLoading } = useAuth();
    const { uploadFile, uploading } = useFileUpload();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        company: '',
        website: '',
        skills: [],
    });
    const [newSkill, setNewSkill] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/signin');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                company: profile.company || '',
                website: profile.website || '',
                skills: profile.skills || [],
                certifications: profile.certifications || [],
            });

            if (profile.profileImage?.data) {
                setImagePreview(profile.profileImage.data);
            }
        }
    }, [profile]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const result = await uploadFile(file, {
                maxSize: 5 * 1024 * 1024, // 5MB
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            });

            if (result.file) {
                setImagePreview(result.file.data);
                await uploadProfileImage(file);
            }
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData({
                ...formData,
                skills: [...formData.skills, newSkill.trim()],
            });
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill) => {
        setFormData({
            ...formData,
            skills: formData.skills.filter(s => s !== skill),
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile(formData);
            setEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form data to profile
        if (profile) {
            setFormData({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                company: profile.company || '',
                website: profile.website || '',
                skills: profile.skills || [],
            });
        }
        setEditing(false);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <SEO
                title="User Profile"
                description="Manage your Africa Konnect profile, update your information, and upload your profile picture."
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-600 mt-1">
                            {isExpert ? 'Expert Account' : 'Client Account'}
                        </p>
                    </div>
                    {!editing ? (
                        <Button onClick={() => setEditing(true)}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={handleCancel}>
                                <X size={16} className="mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                ) : (
                                    <Save size={16} className="mr-2" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Image Card */}
                    <Card className="p-6 h-fit">
                        <div className="text-center">
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto mb-4">
                                    {imagePreview ? (
                                        <img
                                            src={imagePreview}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={48} className="text-gray-400" />
                                    )}
                                </div>
                                {editing && (
                                    <label className="absolute bottom-4 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                                        <Camera size={16} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                )}
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                                {formData.name || 'Your Name'}
                            </h3>
                            <p className="text-sm text-gray-500">{formData.email}</p>
                            <div className="mt-4 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full inline-block">
                                {isExpert ? 'Expert' : 'Client'}
                            </div>
                        </div>
                    </Card>

                    {/* Profile Information Card */}
                    <Card className="p-6 lg:col-span-2">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>

                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!editing}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                        value={formData.email}
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        disabled={!editing}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        disabled={!editing}
                                        placeholder="City, Country"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bio
                                </label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                    rows="4"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    disabled={!editing}
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            {/* Company (for clients) */}
                            {!isExpert && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company
                                    </label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                            value={formData.company}
                                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                            disabled={!editing}
                                            placeholder="Your Company Name"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Website */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="url"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary disabled:bg-gray-50"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        disabled={!editing}
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>

                            {/* Skills (for experts) */}
                            {isExpert && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Skills
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {formData.skills.map((skill, index) => (
                                            <motion.span
                                                key={index}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
                                            >
                                                {skill}
                                                {editing && (
                                                    <button
                                                        onClick={() => handleRemoveSkill(skill)}
                                                        className="hover:text-error"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </motion.span>
                                        ))}
                                    </div>
                                    {editing && (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                value={newSkill}
                                                onChange={(e) => setNewSkill(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                                                placeholder="Add a skill..."
                                            />
                                            <Button onClick={handleAddSkill} size="sm">
                                                Add
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Certifications (for experts) */}
                            {isExpert && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Certifications
                                    </label>
                                    <div className="space-y-4">
                                        {formData.certifications?.map((cert, index) => (
                                            <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{cert.name}</p>
                                                    <p className="text-sm text-gray-600">{cert.issuer} • {cert.year}</p>
                                                </div>
                                                {editing && (
                                                    <button
                                                        onClick={() => {
                                                            const newCerts = formData.certifications.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, certifications: newCerts });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {editing && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 border border-dashed border-gray-300 rounded-lg">
                                                <input
                                                    placeholder="Certification Name"
                                                    className="px-3 py-2 border rounded text-sm"
                                                    id="new-cert-name"
                                                />
                                                <input
                                                    placeholder="Issuer"
                                                    className="px-3 py-2 border rounded text-sm"
                                                    id="new-cert-issuer"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        placeholder="Year"
                                                        className="px-3 py-2 border rounded text-sm w-20"
                                                        id="new-cert-year"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            const name = document.getElementById('new-cert-name');
                                                            const issuer = document.getElementById('new-cert-issuer');
                                                            const year = document.getElementById('new-cert-year');
                                                            if (name.value && issuer.value) {
                                                                setFormData({
                                                                    ...formData,
                                                                    certifications: [...(formData.certifications || []), {
                                                                        name: name.value,
                                                                        issuer: issuer.value,
                                                                        year: year.value
                                                                    }]
                                                                });
                                                                name.value = '';
                                                                issuer.value = '';
                                                                year.value = '';
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
