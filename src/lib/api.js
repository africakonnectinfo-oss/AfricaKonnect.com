const API_URL = import.meta.env.VITE_API_URL || 'https://africa-konnect-api.onrender.com/api';

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
};

// Debug Helper
const debugLog = (type, ...args) => {
    if (import.meta.env.DEV && localStorage.getItem('DEBUG') === 'true') {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`%c[API ${type}] ${timestamp}`, 'color: #00bcd4; font-weight: bold;', ...args);
    }
};

// Wrapper for fetch to handle logging
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    debugLog('REQ', options.method || 'GET', endpoint, options.body ? JSON.parse(options.body) : '');

    try {
        const response = await fetch(url, options);
        debugLog('RES', response.status, endpoint);

        return handleResponse(response);
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error(`API Error (${endpoint}):`, error);
        }
        throw error;
    }
};

export const api = {
    API_URL,
    // Auth
    auth: {
        register: async (data) => apiRequest('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
        login: async (data) => apiRequest('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
        getProfile: async () => apiRequest('/auth/profile', {
            headers: getHeaders(),
        }),
        updateProfile: async (data) => apiRequest('/auth/profile', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getPublicProfile: async (id) => apiRequest(`/auth/users/${id}/public`, {
            headers: getHeaders(),
        }),
        verifyEmail: async (token) => apiRequest('/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        }),
        resendVerification: async () => apiRequest('/auth/resend-verification', {
            method: 'POST',
            headers: getHeaders(),
        }),
        refreshToken: async (refreshToken) => apiRequest('/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        }),
        getSessions: async () => apiRequest('/auth/sessions', {
            headers: getHeaders(),
        }),
        revokeSession: async (sessionId) => apiRequest('/auth/sessions/' + sessionId, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        revokeOtherSessions: async () => apiRequest('/auth/sessions/revoke-others', {
            method: 'POST',
            headers: getHeaders(),
        }),
        logout: async () => apiRequest('/auth/logout', {
            method: 'POST',
            headers: getHeaders(),
        }),
        forgotPassword: async (email) => apiRequest('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        }),
        resetPassword: async (token, newPassword) => apiRequest('/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        }),
        oauthDecision: async (data) => apiRequest('/auth/oauth/decision', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Projects
    projects: {
        create: async (data) => apiRequest('/projects', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/projects?${queryString}`, {
                headers: getHeaders(),
            });
        },
        getById: async (id) => apiRequest(`/projects/${id}`, {
            headers: getHeaders(),
        }),
        getInvitedProjects: async () => apiRequest('/projects/expert/invites', {
            headers: getHeaders(),
        }),
        getClientProjects: async (clientId) => apiRequest(`/projects/client/${clientId}`, {
            headers: getHeaders(),
        }),
        getMine: async () => {
            // Retrieve self client ID from token or use generic "me" endpoint if available
            // Since endpoint is /projects/client/:clientId, and we have user info in localStorage
            const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (!user.id) throw new Error('User not found');

            // Reuse getClientProjects
            return apiRequest(`/projects/client/${user.id}`, {
                headers: getHeaders(),
            });
        },
        update: async (id, data) => apiRequest(`/projects/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/projects/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        invite: async (id, expertId) => apiRequest(`/projects/${id}/invite`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ expertId }),
        }),
        inviteMember: async (id, email, role = 'member') => apiRequest(`/projects/${id}/members`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, role }),
        }),
        respond: async (id, status) => apiRequest(`/projects/${id}/invite`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
    },

    // Experts
    experts: {
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/experts?${queryString}`, {
                headers: getHeaders(),
            });
        },
        createProfile: async (data) => apiRequest('/experts/profile', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getProfile: async (userId) => apiRequest(`/experts/profile/${userId}`, {
            headers: getHeaders(),
        }),
        updateProfile: async (userId, data) => apiRequest(`/experts/profile/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getCompleteness: async (userId) => apiRequest(`/experts/profile/${userId}/completeness`, {
            headers: getHeaders(),
        }),
        updateCompleteness: async () => apiRequest('/experts/profile/completeness', {
            method: 'POST',
            headers: getHeaders(),
        }),
        addPortfolio: async (data) => apiRequest('/experts/portfolio', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        removePortfolio: async (itemId) => apiRequest(`/experts/portfolio/${itemId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        updateAvailability: async (calendar) => apiRequest('/experts/availability', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ calendar }),
        }),
        setRateRange: async (min, max, currency = 'USD') => apiRequest('/experts/rate-range', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ min, max, currency }),
        }),
        updateSkills: async (skillCategories) => apiRequest('/experts/skills', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ skillCategories }),
        }),
        getSkills: async () => apiRequest('/experts/skills', {
            headers: getHeaders(),
        }),
        getCategories: async () => apiRequest('/experts/skills/categories', {
            headers: getHeaders(),
        }),
        searchSkills: async (query) => apiRequest(`/experts/skills/search?q=${encodeURIComponent(query)}`, {
            headers: getHeaders(),
        }),
    },

    // Transactions
    transactions: {
        fund: async (projectId, amount) => apiRequest(`/projects/${projectId}/fund`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount }),
        }),
        release: async (projectId, amount) => apiRequest(`/projects/${projectId}/release`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount }),
        }),
        getHistory: async (projectId) => apiRequest(`/projects/${projectId}/transactions`, {
            headers: getHeaders(),
        }),
    },

    // Messages
    messages: {
        getMessages: async (projectId) => apiRequest(`/messages/project/${projectId}`, {
            headers: getHeaders(),
        }),
        send: async (projectId, content) => apiRequest('/messages', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ projectId, content }),
        }),
        getUnread: async () => apiRequest('/messages/unread', {
            headers: getHeaders(),
        }),
        markRead: async (id) => apiRequest(`/messages/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
        markProjectRead: async (projectId) => apiRequest(`/messages/project/${projectId}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
    },

    // Tasks
    tasks: {
        create: async (projectId, data) => apiRequest(`/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/tasks`, {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/tasks/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Milestones
    milestones: {
        create: async (projectId, data) => apiRequest(`/projects/${projectId}/milestones`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/milestones`, {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/milestones/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Files
    files: {
        upload: async (data) => {
            // Data is { projectId, name, type, size, data } or FormData
            if (data instanceof FormData) {
                // Determine URL based on endpoint availability, trying generic upload
                return apiRequest(`/files/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, // No content-type for FormData
                    body: data
                });
            }

            return apiRequest(`/files/upload`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
        },
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/files`, {
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/files/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Contracts
    contracts: {
        create: async (data) => apiRequest('/contracts', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        get: async (id) => apiRequest(`/contracts/${id}`, {
            headers: getHeaders(),
        }),
        getByProject: async (projectId) => apiRequest(`/contracts/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getUserContracts: async () => apiRequest('/contracts/user', {
            headers: getHeaders(),
        }),
        sign: async (id, metadata = null) => apiRequest(`/contracts/${id}/sign`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ signatureMetadata: metadata }),
        }),
        update: async (id, data) => apiRequest(`/contracts/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Interviews
    interviews: {
        schedule: async (data) => apiRequest('/interviews', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/interviews/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getMyInterviews: async () => apiRequest('/interviews/my', {
            headers: getHeaders(),
        }),
        updateStatus: async (id, status) => apiRequest(`/interviews/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
    },

    // Files
    files: {
        getFiles: async (projectId) => apiRequest(`/files/project/${projectId}`, {
            headers: getHeaders(),
        }),
        upload: async (projectId, formData) => {
            const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : null;
            const response = await fetch(`${API_URL}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'File upload failed');
            }
            return response.json();
        },
        uploadImage: async (fileData) => apiRequest('/files/upload', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(fileData),
        }),
        addVersion: async (fileId, data) => apiRequest(`/files/${fileId}/versions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getVersions: async (fileId) => apiRequest(`/files/${fileId}/versions`, {
            headers: getHeaders(),
        }),
        download: async (id) => apiRequest(`/files/${id}/download`, {
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/files/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Notifications
    notifications: {
        getAll: async (limit = 20, offset = 0) => apiRequest(`/notifications?limit=${limit}&offset=${offset}`, {
            headers: getHeaders(),
        }),
        markRead: async (id) => apiRequest(`/notifications/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/notifications/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        getPreferences: async () => apiRequest('/notifications/preferences', {
            headers: getHeaders(),
        }),
        updatePreferences: async (data) => apiRequest('/notifications/preferences', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }),
    },

    // Payments
    payments: {
        initEscrow: (projectId, amount) => apiRequest(`/payments/${projectId}/escrow`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
            headers: getHeaders(),
        }),
        getEscrow: (projectId) => apiRequest(`/payments/${projectId}/escrow`, {
            headers: getHeaders(),
        }),
        requestRelease: (projectId, data) => apiRequest(`/payments/${projectId}/release`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getHeaders(),
        }),
        approveRelease: (projectId, releaseId) => apiRequest(`/payments/${projectId}/release/${releaseId}/approve`, {
            method: 'POST',
            headers: getHeaders(),
        })
    },

    // AI Features (DeepSeek)
    ai: {
        draftContract: (data) => apiRequest('/ai/draft-contract', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getHeaders(),
        }),
        matchExperts: (data) => apiRequest('/ai/match', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getHeaders(),
        })
    },

    // Applications
    applications: {
        apply: async (projectId, data) => apiRequest(`/applications/${projectId}/apply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/applications/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getMyApplications: async () => apiRequest('/applications/my', {
            headers: getHeaders(),
        }),
        updateStatus: async (id, status) => apiRequest(`/applications/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
    },
};

const handleResponse = async (response) => {
    let data;
    const contentType = response.headers.get("content-type");

    try {
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }
    } catch (err) {
        // Fallback if parsing fails
        data = { message: response.statusText || 'Unknown Error' };
    }

    if (!response.ok) {
        const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
        if (import.meta.env.DEV) {
            console.error("API Response Error:", errorMessage);
        }
        throw new Error(errorMessage);
    }
    return data;
};
