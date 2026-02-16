import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (userData) => {
        try {
            if (userData.role === 'expert') {
                try {
                    const profileData = await api.experts.getProfile(userData.id);
                    setProfile(profileData);
                } catch (error) {
                    console.log('No expert profile found yet');
                    setProfile(userData);
                }
            } else {
                setProfile(userData);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            const storedUserJson = localStorage.getItem('userInfo');

            if (storedUserJson) {
                // Verify the token with our backend
                const dbUser = await api.auth.getProfile();
                setUser(dbUser);
                loadProfile(dbUser);
            }
        } catch (error) {
            console.log("Authentication check failed:", error.message);
            if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Auth'))) {
                localStorage.removeItem('userInfo');
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, [loadProfile]);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const signUp = async (email, password, name, role) => {
        try {
            const dbUser = await api.auth.register({
                email,
                password,
                name,
                role
            });

            if (dbUser && dbUser.id) {
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));
                await loadProfile(dbUser);
                return { user: dbUser, error: null };
            } else {
                throw new Error('Registration failed - no user returned');
            }
        } catch (error) {
            console.error("❌ SignUp Error Details:", error);
            return { user: null, error: error?.message || error || "Unknown signup error" };
        }
    };

    const signIn = async (email, password, rememberMe = false) => {
        try {
            const dbUser = await api.auth.login({ email, password, rememberMe });

            if (dbUser && dbUser.id) {
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));
                await loadProfile(dbUser);
                return { user: dbUser, error: null };
            } else {
                throw new Error('Login failed - no user returned');
            }
        } catch (error) {
            console.error("❌ SignIn Error Details:", error);
            return { user: null, error: error?.message || error || "Unknown login error" };
        }
    };

    const signOut = async () => {
        try {
            // Backend signout (if needed) or just local cleanup
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            // Always clear local session
            setUser(null);
            setProfile(null);
            localStorage.removeItem('userInfo');
            return { error: null };
        }
    };

    const updateProfile = async (updates) => {
        try {
            // Update user table if basic fields changed
            if (updates.name || updates.email || updates.profileImageUrl || updates.profile_image_url) {
                const updatedUser = await api.auth.updateProfile({
                    name: updates.name || user.name,
                    email: updates.email || user.email,
                    profile_image_url: updates.profileImageUrl || updates.profile_image_url || user.profile_image_url
                });

                // Merge updated fields into user object
                const newUser = { ...user, ...updatedUser.user };
                setUser(newUser);
                localStorage.setItem('userInfo', JSON.stringify(newUser));
            }

            // Update expert profile if user is an expert
            if (user?.role === 'expert') {
                const updated = await api.experts.updateProfile(user.id, updates);
                setProfile(updated);
                return { profile: updated, error: null };
            } else {
                // For clients, update the profile state with user data
                const refreshedUser = await api.auth.getProfile();
                setUser(refreshedUser);
                setProfile(refreshedUser);
                localStorage.setItem('userInfo', JSON.stringify(refreshedUser));
                return { profile: refreshedUser, error: null };
            }
        } catch (error) {
            console.error(error);
            return { profile: null, error };
        }
    };

    const uploadProfileImage = async (file) => {
        // 1. Immediate Optimistic Update
        const optimisticUrl = URL.createObjectURL(file);

        // Update both user and profile state immediately
        setUser(prev => ({ ...prev, profile_image_url: optimisticUrl }));
        setProfile(prev => prev ? ({ ...prev, profile_image_url: optimisticUrl }) : { profile_image_url: optimisticUrl });

        try {
            const { url } = await api.files.uploadImage({
                data: await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                }),
                name: file.name
            });

            // 2. Confirm with real URL
            setUser(prev => ({ ...prev, profile_image_url: url }));
            setProfile(prev => prev ? ({ ...prev, profile_image_url: url }) : { profile_image_url: url });

            // Persist to localStorage
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            localStorage.setItem('userInfo', JSON.stringify({ ...stored, profile_image_url: url }));

            // Update Backend Profiles
            await updateProfile({ profile_image_url: url });

            return { url };
        } catch (error) {
            console.error('Image upload failed:', error);
            // Revert on failure (optional, or let next load fix it)
            toast.error("Failed to save profile picture permanently.");
            throw error;
        }
    };

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        uploadProfileImage,
        isAuthenticated: !!user,
        isExpert: user?.role === 'expert' || user?.user_metadata?.role === 'expert',
        isClient: user?.role === 'client' || user?.user_metadata?.role === 'client',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
