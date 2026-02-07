import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useSocket } from './useSocket';

export const useCollaboration = (projectId, user) => {
    const socket = useSocket();
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [activity, setActivity] = useState([]);

    // Loading States
    const [loading, setLoading] = useState({
        messages: false,
        files: false,
        tasks: false,
        activity: false,
        contracts: false
    });

    const [error, setError] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        if (!projectId) return;

        const fetchAllData = async () => {
            setLoading(prev => ({ ...prev, messages: true, files: true, tasks: true, contracts: true }));
            try {
                // Parallel fetching
                const [msgsRes, filesRes, tasksRes, contractsRes, interviewsRes] = await Promise.allSettled([
                    api.messages.getMessages(projectId),
                    api.files.getFiles(projectId),
                    api.tasks.getByProject(projectId),
                    api.contracts.getByProject(projectId),
                    api.interviews.getByProject(projectId)
                ]);

                // Handle Messages
                if (msgsRes.status === 'fulfilled') {
                    setMessages(msgsRes.value || []);
                } else {
                    console.error("Failed to fetch messages", msgsRes.reason);
                }

                // Handle Files
                if (filesRes.status === 'fulfilled') {
                    setFiles(filesRes.value || []);
                } else {
                    console.error("Failed to fetch files", filesRes.reason);
                }

                // Handle Contracts
                if (contractsRes.status === 'fulfilled') {
                    const data = contractsRes.value;
                    setContracts(data.contracts || (Array.isArray(data) ? data : []));
                }

                // Handle Interviews
                if (interviewsRes.status === 'fulfilled') {
                    setInterviews(interviewsRes.value?.interviews || (Array.isArray(interviewsRes.value) ? interviewsRes.value : []));
                } else {
                    console.error("Failed to fetch interviews", interviewsRes.reason);
                }

                // Handle Tasks
                if (tasksRes.status === 'fulfilled') {
                    setTasks(tasksRes.value || []);
                } else {
                    console.error("Failed to fetch tasks", tasksRes.reason);
                }

            } catch (err) {
                console.error("Failed to fetch collaboration data", err);
                setError("Failed to load some project data");
            } finally {
                setLoading({ messages: false, files: false, tasks: false, activity: false });
            }
        };

        fetchAllData();
    }, [projectId]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket || !projectId) return;

        // Join project room
        if (socket.connected) {
            socket.emit('join_project', projectId);
        } else {
            socket.on('connect', () => {
                socket.emit('join_project', projectId);
            });
        }

        const handleNewMessage = (msg) => {
            if (msg.project_id === projectId || msg.projectId === projectId) {
                setMessages(prev => {
                    // Prevent duplicates if optimistic update already added it
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleTaskUpdate = (task) => {
            if (task.project_id === projectId) {
                setTasks(prev => {
                    const exists = prev.find(t => t.id === task.id);
                    if (exists) return prev.map(t => t.id === task.id ? task : t);
                    return [...prev, task];
                });
            }
        };

        const handleFileUploaded = (file) => {
            if (file.project_id === projectId) {
                setFiles(prev => [...prev, file]);
            }
        };

        const handleTaskCreated = (task) => {
            if (task.project_id === projectId) {
                setTasks(prev => {
                    if (prev.some(t => t.id === task.id)) return prev;
                    return [...prev, task];
                });
            }
        };

        const handleTaskDeleted = ({ id }) => {
            setTasks(prev => prev.filter(t => t.id !== id));
        };

        const handleContractUpdated = (contract) => {
            setContracts(prev => {
                const exists = prev.find(c => c.id === contract.id);
                if (exists) return prev.map(c => c.id === contract.id ? contract : c);
                return [...prev, contract];
            });
        };

        const handleInterviewScheduled = (interview) => {
            setInterviews(prev => {
                if (prev.some(i => i.id === interview.id)) return prev;
                return [...prev, interview];
            });
        };

        // Placeholder for Escrow/Payment updates if we add that state
        // const handleEscrowUpdated = (escrow) => { ... }

        socket.on('receive_message', handleNewMessage);
        socket.on('task_updated', handleTaskUpdate);
        socket.on('task_created', handleTaskCreated);
        socket.on('task_deleted', handleTaskDeleted);
        socket.on('file_uploaded', handleFileUploaded);
        socket.on('contract_updated', handleContractUpdated);
        socket.on('interview_scheduled', handleInterviewScheduled);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('task_updated', handleTaskUpdate);
            socket.off('task_created', handleTaskCreated);
            socket.off('task_deleted', handleTaskDeleted);
            socket.off('file_uploaded', handleFileUploaded);
            socket.off('contract_updated', handleContractUpdated);
            socket.off('interview_scheduled', handleInterviewScheduled);
            socket.emit('leave_project', projectId);
        };
    }, [socket, projectId]);

    // Actions
    const sendMessage = useCallback(async (content) => {
        try {
            // Optimistic update
            const tempId = Date.now();
            const optimisticMsg = {
                id: tempId,
                content,
                sender_id: user?.id,
                created_at: new Date().toISOString(),
                isOptimistic: true,
                sender: {
                    id: user?.id,
                    name: user?.name || 'You',
                    avatar_url: user?.avatar_url
                }
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const res = await api.messages.send(projectId, content);

            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m.id === tempId ? res : m));
            return res;
        } catch (err) {
            console.error("Failed to send message", err);
            // Revert optimistic update
            setMessages(prev => prev.filter(m => !m.isOptimistic));
            throw err;
        }
    }, [projectId, user]);

    const uploadFile = useCallback(async (fileData) => {
        try {
            const formData = new FormData();
            formData.append('file', fileData);

            // api.files.upload expects projectId and formData
            const res = await api.files.upload(projectId, formData);

            setFiles(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Upload failed", err);
            throw err;
        }
    }, [projectId]);

    const createTask = useCallback(async (taskData) => {
        try {
            const res = await api.tasks.create(projectId, taskData);
            setTasks(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Task creation failed", err);
            throw err;
        }
    }, [projectId]);

    const updateTaskStatus = useCallback(async (taskId, status) => {
        try {
            // Optimistic
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

            await api.tasks.update(taskId, { status });
        } catch (err) {
            console.error("Task update failed", err);
            // Revert
            // You might want to re-fetch tasks here or revert the optimistic change
        }
    }, []);

    const signContract = useCallback(async (contractId) => {
        try {
            // Optimistic update
            setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'signed' } : c));

            const res = await api.contracts.sign(contractId);

            // Update with real data
            setContracts(prev => prev.map(c => c.id === contractId ? res : c));
            return res;
        } catch (err) {
            console.error("Sign contract failed", err);
            // Revert
            // logic to revert or re-fetch
            const res = await api.contracts.getByProject(projectId); // Fallback refetch
            if (res && res.contracts) setContracts(res.contracts);
        }
    }, [projectId]);

    const scheduleInterview = useCallback(async (data) => {
        try {
            const res = await api.interviews.schedule({ ...data, projectId });
            setInterviews(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Schedule interview failed", err);
            throw err;
        }
    }, [projectId]);

    const createContract = useCallback(async (contractData) => {
        try {
            const res = await api.contracts.create({ ...contractData, projectId });
            setContracts(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Create contract failed", err);
            throw err;
        }
    }, [projectId]);

    const inviteUser = useCallback(async (email) => {
        try {
            // api.projects.inviteMember(projectId, email)
            // We need to implement this in api lib as well if not exists
            const res = await api.projects.inviteMember(projectId, email);
            return res;
        } catch (err) {
            console.error("Invite failed", err);
            throw err;
        }
    }, [projectId]);

    return {
        activeTab,
        setActiveTab,
        data: { messages, files, tasks, activity, contracts, interviews },
        loading,
        error,
        actions: {
            sendMessage,
            uploadFile,
            createTask,
            updateTaskStatus,
            signContract,
            scheduleInterview,
            createContract,
            inviteUser
        }
    };
};
