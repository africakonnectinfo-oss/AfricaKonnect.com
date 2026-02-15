import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { authClient } from '../lib/auth'; // Import Neon Auth Client

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
                    // For experts without a profile yet, use user data
                    setProfile(userData);
                }
            } else {
                // For clients, use the user data as profile
                setProfile(userData);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            // 1. Check if we have a stored user in localStorage
            const storedUserJson = localStorage.getItem('userInfo');

            if (storedUserJson) {
                // Verify the token with our backend
                const dbUser = await api.auth.getProfile();
                setUser(dbUser);
                loadProfile(dbUser);

                // Optional: Sync with Neon if needed, but don't block
                if (authClient && import.meta.env.VITE_NEON_AUTH_URL) {
                    authClient.getSession().catch(() => { });
                }
            } else {
                // 2. Fallback: Check Neon Session directly (if user logged in elsewhere/via magic link)
                if (authClient && import.meta.env.VITE_NEON_AUTH_URL) {
                    const session = await authClient.getSession();
                    if (session && session.user) {
                        // User exists in Neon, try to get/create in our backend
                        // This might fail if we don't have a token, but let's assume valid session implies we should have a token
                        // For now, just stop loading if no local token found.
                        console.log('Neon session found but no local token');
                    }
                }
            }
        } catch (error) {
            console.log("Authentication check failed:", error.message);
            // Only clear if it's an auth error (401/403)
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
            // Primary: Register directly with our Backend DB
            // This ensures users can always sign up even without Neon Auth
            const dbUser = await api.auth.register({
                email,
                password,
                name,
                role
            });

            if (dbUser && dbUser.id) {
                // Successfully registered with backend
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));

                // Optionally try to register with Neon Auth for enhanced auth features
                if (authClient && import.meta.env.VITE_NEON_AUTH_URL) {
                    try {
                        await authClient.signUp({
                            email,
                            password,
                            options: { data: { name, role } }
                        });
                    } catch (neonError) {
                        console.log('Neon Auth sync skipped:', neonError.message);
                    }
                }

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
            // Primary: Login directly with our Backend
            // This ensures users can always login even without Neon Auth
            const dbUser = await api.auth.login({ email, password, rememberMe });

            if (dbUser && dbUser.id) {
                // Successfully logged in with backend
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));

                // Optionally try to sync with Neon Auth for enhanced auth features
                if (authClient && import.meta.env.VITE_NEON_AUTH_URL) {
                    try {
                        await authClient.signInWithEmail({ email, password });
                    } catch (neonError) {
                        console.log('Neon Auth sync skipped:', neonError.message);
                    }
                }

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
            // Attempt Neon signout if client exists
            if (authClient) {
                try {
                    await authClient.signOut();
                } catch (err) {
                    console.warn('Neon auth signout failed, proceeding with local cleanup:', err);
                }
            }
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
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                const base64Image = e.target.result;
                try {
                    const { url } = await api.files.uploadImage({
                        data: base64Image,
                        name: file.name
                    });

                    // Update user profile with correct field name
                    await updateProfile({ profile_image_url: url });

                    // If expert, also update expert profile
                    if (user?.role === 'expert') {
                        try {
                            await api.experts.updateProfile(user.id, { profile_image_url: url });
                        } catch (expertError) {
                            console.log('Expert profile image update skipped:', expertError.message);
                        }
                    }

                    // Refresh user and profile state to ensure navbar updates
                    const refreshedUser = await api.auth.getProfile();
                    setUser(refreshedUser);
                    localStorage.setItem('userInfo', JSON.stringify(refreshedUser));

                    // Reload profile based on role
                    if (refreshedUser.role === 'expert') {
                        try {
                            const refreshedProfile = await api.experts.getProfile(refreshedUser.id);
                            setProfile(refreshedProfile);
                        } catch {
                            setProfile(refreshedUser);
                        }
                    } else {
                        setProfile(refreshedUser);
                    }

                    resolve(url);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
