import React, { createContext, useContext, useState, useEffect } from 'react';


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

    useEffect(() => {
        // Check for existing user session
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                loadProfile(parsedUser);
            } catch (e) {
                console.error('Failed to parse user info:', e);
            }
        }
        setLoading(false);
    }, []);

    const loadProfile = async (userData) => {
        try {
            // Data from login/register already contains user info
            // Fetch expert profile if needed
            if (userData.role === 'expert') {
                try {
                    const profileData = await api.experts.getProfile(userData.id);
                    setProfile(profileData);
                } catch (error) {
                    console.log('No expert profile found yet');
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const signUp = async (email, password, name, role) => {
        try {
            const data = await api.auth.register({
                email,
                password,
                name,
                role
            });

            const userWithToken = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                token: data.token
            };

            setUser(userWithToken);
            localStorage.setItem('userInfo', JSON.stringify(userWithToken));
            await loadProfile(userWithToken);

            return { user: userWithToken, error: null };
        } catch (error) {
            return { user: null, error };
        }
    };

    const signIn = async (email, password, rememberMe = false) => {
        try {
            const data = await api.auth.login({
                email,
                password,
                rememberMe,
            });

            const userWithToken = {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role,
                token: data.token
            };

            setUser(userWithToken);
            localStorage.setItem('userInfo', JSON.stringify(userWithToken));
            await loadProfile(userWithToken);

            return { user: userWithToken, error: null };
        } catch (error) {
            return { user: null, error };
        }
    };

    const signOut = async () => {
        try {
            // Call backend logout to revoke sessions
            try {
                await api.auth.logout();
            } catch (error) {
                // Even if backend logout fails, clear local storage
                console.error('Logout API error:', error);
            }

            // Clear local state
            setUser(null);
            setProfile(null);
            localStorage.removeItem('userInfo');
            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const updateProfile = async (updates) => {
        try {
            // First, update base user profile (users table)
            // We strip out expert specific fields for this call if mixed
            if (updates.name || updates.email || updates.profileImageUrl) {
                const updatedUser = await api.auth.updateProfile({
                    name: updates.name || user.name,
                    email: updates.email || user.email,
                    profileImageUrl: updates.profileImageUrl || user.profile_image_url
                });

                // Update local user state
                const newUser = { ...user, ...updatedUser.user };
                setUser(newUser);
                localStorage.setItem('userInfo', JSON.stringify(newUser));
            }

            // If expert, update expert profile
            if (user?.role === 'expert') {
                const updated = await api.experts.updateProfile(user.id, updates);
                setProfile(updated);
                return { profile: updated, error: null };
            }

            return { profile: updates, error: null };
        } catch (error) {
            console.error(error);
            return { profile: null, error };
        }
    };

    const uploadProfileImage = async (file) => {
        try {
            // Convert file to base64
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onload = async (e) => {
                    const base64Image = e.target.result;

                    try {
                        // 1. Upload image to server
                        const { url } = await api.files.uploadImage({
                            data: base64Image,
                            name: file.name
                        });

                        // 2. Update profile with URL
                        await updateProfile({ profileImageUrl: url });

                        resolve(url);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        } catch (error) {
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
