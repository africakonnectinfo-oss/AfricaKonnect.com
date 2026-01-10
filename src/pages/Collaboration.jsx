import React, { useState, useEffect, useRef } from 'react';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, GitCommit, FileText, CheckCircle,
    AlertCircle, Clock, Video, Upload, Plus, DollarSign,
    LayoutDashboard, List, CreditCard, FolderOpen, ChevronRight,
    Send, Download, Trash2, Check, X
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';

import KanbanBoard from '../components/projects/KanbanBoard';
import PaymentDashboard from '../components/payments/PaymentDashboard';

// ... (keep usage of other imports)

import { useSocket } from '../hooks/useSocket';
import { socketService } from '../lib/socket';

const Collaboration = () => {
    const { currentProject, addMessage, addProjectFile, removeProjectFile, addActivity, updateTask, addTask } = useProject();
    const { profile, user } = useAuth();
    const { uploadFile, downloadFile, uploading } = useFileUpload();
    const socket = useSocket();

    const [activeTab, setActiveTab] = useState('overview');
    const [messageInput, setMessageInput] = useState('');
    const [currentChannel, setCurrentChannel] = useState('general');
    const messagesEndRef = useRef(null);

    const projectId = currentProject?.id || 'demo_project';
    const messages = currentProject?.messages || [];
    const files = currentProject?.files || [];
    const activities = currentProject?.activities || [];

    useEffect(() => {
        if (projectId && socket) {
            socketService.joinProject(projectId);

            const handleNewMessage = (msg) => {
                if (msg.project_id === projectId) {
                    addMessage(projectId, { ...msg, isMe: msg.sender_id === user?.id });
                }
            };

            const handleTaskUpdate = (task) => {
                // Determine if it's a new task or update
                // For simplicity, we might just reload tasks or update local state if we have a robust reducer
                // Here we'll just try to update if it exists, or add if not
                // But since KanbanBoard fetches its own data, we might need a way to trigger it to refetch
                // ideally KanbanBoard should also subscribe, or we hoist state.
                // For now, we'll let KanbanBoard handle its own fetching, but we can emit a custom event or just accept that 
                // "addActivity" will update the activity feed at least.
                addActivity(projectId, {
                    user: 'System', // or user name from event if available
                    action: 'updated a task',
                    target: task.title,
                    icon: AlertCircle,
                    color: 'text-blue-500',
                    bg: 'bg-blue-50'
                });
            };

            const handleActivity = (activity) => {
                addActivity(projectId, activity);
            };

            socket.on('new_message', handleNewMessage);
            socket.on('task_updated', handleTaskUpdate);
            socket.on('task_created', handleTaskUpdate);
            socket.on('activity_logged', handleActivity);

            return () => {
                socketService.leaveProject(projectId);
                socket.off('new_message', handleNewMessage);
                socket.off('task_updated', handleTaskUpdate);
                socket.off('task_created', handleTaskUpdate);
                socket.off('activity_logged', handleActivity);
            };
        }
    }, [projectId, socket, user]);


    // ... (useEffect for scroll and tabs definition remain same)

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'tasks', label: 'Tasks', icon: List },
        { id: 'payments', label: 'Payments', icon: CreditCard },
    ];

    const handleSendMessage = (e) => {
        if (e) e.preventDefault();
        if (!messageInput.trim() || !projectId) return;

        const newMessage = {
            project_id: projectId,
            text: messageInput,
            sender_id: user.id,
            sender: user.name || 'User',
            channel: currentChannel,
            timestamp: new Date().toISOString()
        };

        // Emit to socket
        if (socket) {
            socket.emit('send_message', newMessage);
        }

        // Optimistically add to UI
        addMessage(projectId, { ...newMessage, isMe: true });
        setMessageInput('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await uploadFile(projectId, file);
            // File upload hook should handle adding to context or we might need to refetch
            // For now assuming success triggers refresh or we add manually
            addProjectFile(projectId, {
                id: Date.now(), // temp id
                name: file.name,
                size: file.size,
                uploadedBy: user.name,
                uploadedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                // ... (keep overview code)
                return (
                    // ... existing overview JSX ...
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <Card className="flex-1 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Project Health</h3>
                                <div className="flex items-center gap-2 text-success font-medium mb-2">
                                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                                    On Track
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                    <div className="bg-success h-2 rounded-full w-[33%]" />
                                </div>
                                <p className="text-xs text-gray-500">33% Complete - Milestone 1 In Review</p>
                            </Card>
                            <Card className="flex-1 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-gray-900">Project Team</h3>
                                    <Button size="sm" variant="secondary"><Plus size={16} className="mr-1" /> Invite</Button>
                                </div>
                                <div className="flex -space-x-3">
                                    {profile?.profileImage?.data ? (
                                        <img className="w-10 h-10 rounded-full border-2 border-white" src={profile.profileImage.data} alt="You" title="You - Owner" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">You</div>
                                    )}
                                    <img className="w-10 h-10 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100&h=100" alt="Expert" title="Expert - Developer" />
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">+1</div>
                                </div>
                            </Card>
                        </div>

                        <Card className="p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-6">Recent Activity</h3>
                            <div className="space-y-6">
                                {activities.slice(-5).reverse().map((activity, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full ${activity.bg || 'bg-blue-50'} flex items-center justify-center shrink-0`}>
                                            {activity.icon ? <activity.icon size={18} className={activity.color || 'text-blue-500'} /> : <GitCommit size={18} className="text-blue-500" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-900">
                                                <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium text-primary">{activity.target}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                <Clock size={12} /> {new Date(activity.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {activities.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No activity yet. Start collaborating!</p>
                                )}
                            </div>
                        </Card>
                    </div>
                );
            case 'messages':
                return (
                    <div className="h-[600px] flex gap-6">
                        <Card className="w-1/3 p-0 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Channels</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <button
                                    onClick={() => setCurrentChannel('general')}
                                    className={`w-full text-left p-4 ${currentChannel === 'general' ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'} hover:bg-gray-50 transition-colors`}
                                >
                                    <p className="font-medium text-gray-900"># general</p>
                                    <p className="text-xs text-gray-500 truncate">Main discussion</p>
                                </button>
                                <button
                                    onClick={() => setCurrentChannel('design')}
                                    className={`w-full text-left p-4 ${currentChannel === 'design' ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'} hover:bg-gray-50 transition-colors`}
                                >
                                    <p className="font-medium text-gray-900"># design</p>
                                    <p className="text-xs text-gray-500 truncate">Design discussions</p>
                                </button>
                            </div>
                        </Card>
                        <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold"># {currentChannel}</span>
                                    <span className="text-xs text-gray-500">3 members</span>
                                </div>
                                <Button size="sm" variant="secondary">
                                    <Video size={16} className="mr-2" /> Start Call
                                </Button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
                                {messages.filter(m => m.channel === currentChannel).map((msg, i) => (
                                    <div key={i} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl p-4 ${msg.isMe ? 'bg-primary text-white' : 'bg-gray-100/80 text-gray-800'}`}>
                                            <div className="flex justify-between items-end gap-4 mb-1">
                                                <span className={`text-xs font-bold ${msg.isMe ? 'text-white/80' : 'text-gray-600'}`}>{msg.sender}</span>
                                                <span className={`text-[10px] ${msg.isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {messages.filter(m => m.channel === currentChannel).length === 0 && (
                                    <div className="text-center text-gray-500 py-20">
                                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button size="icon" onClick={handleSendMessage}>
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            case 'files':
                // ... (keep files code)
                return (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Project Files</h3>
                            <label>
                                <Button size="sm" disabled={uploading}>
                                    <Upload size={16} className="mr-2" />
                                    {uploading ? 'Uploading...' : 'Upload New'}
                                </Button>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div className="overflow-hidden border border-gray-100 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {files.map((file, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText size={18} className="text-gray-400 mr-3" />
                                                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploadedBy || 'Unknown'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(file.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button
                                                    onClick={() => downloadFile(file)}
                                                    className="text-primary hover:text-primary/80"
                                                >
                                                    <Download size={16} className="inline" />
                                                </button>
                                                <button
                                                    onClick={() => removeProjectFile(projectId, file.id)}
                                                    className="text-error hover:text-error/80"
                                                >
                                                    <Trash2 size={16} className="inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {files.length === 0 && (
                                <div className="text-center text-gray-500 py-20">
                                    <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>No files uploaded yet</p>
                                </div>
                            )}
                        </div>
                    </Card>
                );
            case 'tasks':
                return <KanbanBoard projectId={projectId} />;
            case 'payments':
                return <PaymentDashboard projectId={projectId} />;
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <SEO
                title="Collaboration Hub"
                description="Monitor your active projects, collaborate with your team, and manage payments in the Africa Konnect Collaboration Hub."
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Collaboration Hub</h1>
                        <p className="text-gray-600">Active Workspace: <strong>{currentProject?.title || 'E-Commerce Platform Redesign'}</strong></p>
                    </div>
                    <Link to="/project-hub">
                        <Button>
                            <Plus className="mr-2" size={20} />
                            Start New Project
                        </Button>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 flex overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Collaboration;
