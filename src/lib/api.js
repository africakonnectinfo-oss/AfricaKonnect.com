const API_URL = import.meta.env.VITE_API_URL || '/api';

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

export const api = {
    API_URL,
    // Auth
    auth: {
        register: async (data) => {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        login: async (data) => {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getProfile: async () => {
            const response = await fetch(`${API_URL}/auth/profile`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        updateProfile: async (data) => {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        verifyEmail: async (token) => {
            const response = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            return handleResponse(response);
        },
        resendVerification: async () => {
            const response = await fetch(`${API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        refreshToken: async (refreshToken) => {
            const response = await fetch(`${API_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            return handleResponse(response);
        },
        getSessions: async () => {
            const response = await fetch(`${API_URL}/auth/sessions`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        revokeSession: async (sessionId) => {
            const response = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        revokeOtherSessions: async () => {
            const response = await fetch(`${API_URL}/auth/sessions/revoke-others`, {
                method: 'POST',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        logout: async () => {
            const response = await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        forgotPassword: async (email) => {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return handleResponse(response);
        },
        resetPassword: async (token, newPassword) => {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            return handleResponse(response);
        },
    },

    // Projects
    projects: {
        create: async (data) => {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/projects?${queryString}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getById: async (id) => {
            const response = await fetch(`${API_URL}/projects/${id}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getInvitedProjects: async () => {
            const response = await fetch(`${API_URL}/projects/expert/invites`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getClientProjects: async (clientId) => {
            const response = await fetch(`${API_URL}/projects/client/${clientId}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getMine: async () => {
            // Retrieve self client ID from token or use generic "me" endpoint if available
            // Since endpoint is /projects/client/:clientId, and we have user info in localStorage
            const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (!user.id) throw new Error('User not found');

            // Reuse getClientProjects
            const response = await fetch(`${API_URL}/projects/client/${user.id}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        update: async (id, data) => {
            const response = await fetch(`${API_URL}/projects/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_URL}/projects/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        invite: async (id, expertId) => {
            const response = await fetch(`${API_URL}/projects/${id}/invite`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ expertId }),
            });
            return handleResponse(response);
        },
        respond: async (id, status) => {
            const response = await fetch(`${API_URL}/projects/${id}/invite`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            });
            return handleResponse(response);
        },
    },

    // Experts
    experts: {
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_URL}/experts?${queryString}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        createProfile: async (data) => {
            const response = await fetch(`${API_URL}/experts/profile`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getProfile: async (userId) => {
            const response = await fetch(`${API_URL}/experts/profile/${userId}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        updateProfile: async (userId, data) => {
            const response = await fetch(`${API_URL}/experts/profile/${userId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getCompleteness: async (userId) => {
            const response = await fetch(`${API_URL}/experts/profile/${userId}/completeness`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        updateCompleteness: async () => {
            const response = await fetch(`${API_URL}/experts/profile/completeness`, {
                method: 'POST',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        addPortfolio: async (data) => {
            const response = await fetch(`${API_URL}/experts/portfolio`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        removePortfolio: async (itemId) => {
            const response = await fetch(`${API_URL}/experts/portfolio/${itemId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        updateAvailability: async (calendar) => {
            const response = await fetch(`${API_URL}/experts/availability`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ calendar }),
            });
            return handleResponse(response);
        },
        setRateRange: async (min, max, currency = 'USD') => {
            const response = await fetch(`${API_URL}/experts/rate-range`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ min, max, currency }),
            });
            return handleResponse(response);
        },
        updateSkills: async (skillCategories) => {
            const response = await fetch(`${API_URL}/experts/skills`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ skillCategories }),
            });
            return handleResponse(response);
        },
        getSkills: async () => {
            const response = await fetch(`${API_URL}/experts/skills`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getCategories: async () => {
            const response = await fetch(`${API_URL}/experts/skills/categories`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        searchSkills: async (query) => {
            const response = await fetch(`${API_URL}/experts/skills/search?q=${encodeURIComponent(query)}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
    },

    // Transactions
    transactions: {
        fund: async (projectId, amount) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/fund`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount }),
            });
            return handleResponse(response);
        },
        release: async (projectId, amount) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/release`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount }),
            });
            return handleResponse(response);
        },
        getHistory: async (projectId) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/transactions`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
    },

    // Messages
    messages: {
        getMessages: async (projectId) => {
            const response = await fetch(`${API_URL}/messages/project/${projectId}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        send: async (projectId, content) => {
            const response = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ projectId, content }),
            });
            return handleResponse(response);
        },
        getUnread: async () => {
            const response = await fetch(`${API_URL}/messages/unread`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        markRead: async (id) => {
            const response = await fetch(`${API_URL}/messages/${id}/read`, {
                method: 'PUT',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        markProjectRead: async (projectId) => {
            const response = await fetch(`${API_URL}/messages/project/${projectId}/read`, {
                method: 'PUT',
                headers: getHeaders(),
            });
            return handleResponse(response);
        }
    },

    // Tasks
    tasks: {
        create: async (projectId, data) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getByProject: async (projectId) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/tasks`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        update: async (id, data) => {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
    },

    // Milestones
    milestones: {
        create: async (projectId, data) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/milestones`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getByProject: async (projectId) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/milestones`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        update: async (id, data) => {
            const response = await fetch(`${API_URL}/milestones/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
    },

    // Files
    files: {
        getFiles: async (projectId) => {
            const response = await fetch(`${API_URL}/files/project/${projectId}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
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
        uploadImage: async (fileData) => {
            const response = await fetch(`${API_URL}/files/upload`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(fileData), // { data: base64, name: "foo.png" }
            });
            return handleResponse(response);
        },
        addVersion: async (fileId, data) => {
            const response = await fetch(`${API_URL}/files/${fileId}/versions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getVersions: async (fileId) => {
            const response = await fetch(`${API_URL}/files/${fileId}/versions`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        download: async (id) => {
            const response = await fetch(`${API_URL}/files/${id}/download`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_URL}/files/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
    },

    // Notifications
    notifications: {
        getAll: async (limit = 20, offset = 0) => {
            const response = await fetch(`${API_URL}/notifications?limit=${limit}&offset=${offset}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        markRead: async (id) => {
            const response = await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        getPreferences: async () => {
            const response = await fetch(`${API_URL}/notifications/preferences`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        updatePreferences: async (data) => {
            const response = await fetch(`${API_URL}/notifications/preferences`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        }
    },

    // Contracts
    contracts: {
        update: async (id, data) => {
            const response = await fetch(`${API_URL}/contracts/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getByProject: async (projectId) => {
            const response = await fetch(`${API_URL}/contracts/project/${projectId}`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        create: async (data) => {
            const response = await fetch(`${API_URL}/contracts`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        getUserContracts: async () => {
            const response = await fetch(`${API_URL}/contracts/user`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        sign: async (id, metadata = null) => {
            const response = await fetch(`${API_URL}/contracts/${id}/sign`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ signatureMetadata: metadata }),
            });
            return handleResponse(response);
        },
    },

    // Payments
    payments: {
        initEscrow: async (projectId, amount) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/escrow`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ amount }),
            });
            return handleResponse(response);
        },
        getEscrow: async (projectId) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/escrow`, {
                headers: getHeaders(),
            });
            return handleResponse(response);
        },
        requestRelease: async (projectId, data) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/releases`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        approveRelease: async (projectId, releaseId) => {
            const response = await fetch(`${API_URL}/projects/${projectId}/releases/${releaseId}/approve`, {
                method: 'PUT',
                headers: getHeaders(),
            });
            return handleResponse(response);
        }
    },
};

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
    }
    return data;
};
