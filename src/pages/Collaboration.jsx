import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import { api } from '../lib/api';
import { Step4Contract } from '../features/project-hub/Step4Contract';
import {
    LayoutDashboard, MessageSquare, FolderOpen, CheckSquare,
    Plus, Paperclip, Send, CheckCircle2, Clock, FileText,
    Download, Play, Upload, Video, Users2, Sparkles,
    ChevronLeft, X, FileSignature, Loader2, List
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import MeetingRoom from '../components/common/MeetingRoom';

// --- Shared Components ---

const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Icon size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
        {action}
    </div>
);

// --- Tab Components ---

const OverviewTab = ({ project, tasks, contracts = [], onInvite }) => {
    const [showInviteCallback, setShowInviteCallback] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

    const handleGetRoadmap = async () => {
        try {
            setIsGeneratingRoadmap(true);
            const res = await api.ai.collaborationHelp(project);
            if (res.milestones || res.tasks) {
                setAiSuggestions(res);
                toast.success("AI has suggested a roadmap for your project!");
            }
        } catch (error) {
            console.error("Failed to get roadmap", error);
            toast.error("Failed to generate AI suggestions.");
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            await onInvite(inviteEmail);
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setShowInviteCallback(false);
        } catch (error) {
            console.error("Invite failed", error);
            toast.error("Failed to send invitation");
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 p-8 bg-gradient-to-br from-white to-gray-50 border-gray-100/50 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
                            <p className="text-gray-500">Project ID: #{project.id.substring(0, 8)}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setShowInviteCallback(!showInviteCallback)}>
                                <Plus size={16} className="mr-1" /> Add Member
                            </Button>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {project.status}
                            </span>
                        </div>
                    </div>

                    {showInviteCallback && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-white rounded-xl border border-blue-100 shadow-sm"
                        >
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Invite Team Member</h4>
                            <form onSubmit={handleInvite} className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter colleague's email..."
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                                <Button type="submit" size="sm" disabled={inviting}>
                                    {inviting ? 'Sending...' : 'Invite'}
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    <p className="text-gray-600 leading-relaxed mb-8 text-lg">{project.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Budget</span>
                            <span className="text-xl font-bold text-gray-900">${project.budget?.toLocaleString()}</span>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Deadline</span>
                            <span className="text-xl font-bold text-gray-900">
                                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tasks</span>
                            <span className="text-xl font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length}/{tasks.length}</span>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Team</span>
                            <span className="text-xl font-bold text-gray-900">{contracts.filter(c => c.status === 'signed').length + 1}</span>
                        </div>
                    </div>
                </Card>

                <div className="space-y-6">
                    {/* AI Suggestions Section */}
                    <Card className="p-6 bg-gradient-to-br from-primary/5 to-white border-primary/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Sparkles size={18} className="text-primary" /> AI Roadmap
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary text-xs h-7 hover:bg-primary/10"
                                onClick={handleGetRoadmap}
                                disabled={isGeneratingRoadmap}
                            >
                                {isGeneratingRoadmap ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="mr-1" />}
                                {aiSuggestions ? 'Refresh' : 'Get Roadmap'}
                            </Button>
                        </div>

                        {aiSuggestions ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Suggested Milestones</p>
                                    <div className="space-y-2">
                                        {aiSuggestions.milestones?.map((m, i) => (
                                            <div key={i} className="flex gap-2 p-2 bg-white rounded-lg border border-gray-100 text-sm">
                                                <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">{i + 1}</div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{m.title}</p>
                                                    <p className="text-xs text-gray-500">{m.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button
                                    className="w-full text-xs h-8 bg-primary/10 text-primary border-none shadow-none hover:bg-primary/20"
                                    onClick={() => setAiSuggestions(null)}
                                >
                                    Dismiss
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 leading-relaxed italic">
                                Need help planning? Get AI-driven milestones and task suggestions tailored to your project.
                            </p>
                        )}
                    </Card>
                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Users2 size={18} className="text-primary" /> Team Leader
                        </h3>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <Avatar name={project.client_name || "Client"} className="bg-primary text-white h-10 w-10 text-sm" />
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{project.client_name || "Client Name"}</p>
                                <span className="text-xs text-primary font-medium">Project Owner</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-600" /> Progress
                        </h3>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        Completion
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                                <div style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const MessagesTab = ({ messages, onSend, user }) => {
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSend(message);
        setMessage('');
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="h-[calc(100vh-220px)] flex flex-col p-0 overflow-hidden shadow-lg border-0 ring-1 ring-gray-100">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Project Chat</h3>
                        <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" ref={scrollRef}>
                {messages.length === 0 && (
                    <EmptyState
                        icon={MessageSquare}
                        title="No messages yet"
                        description="Start the conversation with your team."
                    />
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                <div className={`px-5 py-3 rounded-2xl shadow-sm border ${isMe
                                    ? 'bg-primary text-white rounded-br-sm border-primary'
                                    : 'bg-white text-gray-800 rounded-bl-sm border-gray-100'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-100 flex items-center gap-2 shadow-sm animate-pulse">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-xs text-gray-500 italic">
                                {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <Button type="button" size="icon" variant="ghost" className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200/50">
                        <Paperclip size={18} />
                    </Button>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 text-gray-800 placeholder:text-gray-400"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => {
                            setMessage(e.target.value);
                            onTyping();
                        }}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className={`rounded-full transition-all duration-200 ${message.trim() ? 'bg-primary text-white shadow-md hover:bg-primary/90' : 'bg-gray-200 text-gray-400'}`}
                        disabled={!message.trim()}
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </form>
        </Card>
    );
};

const FilesTab = ({ files, onUpload }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('Uploading file...');
        try {
            await onUpload(file);
            toast.success('File uploaded successfully', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Upload failed: ' + (error.message || 'Unknown error'), { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (file) => {
        if (file.url) {
            window.open(file.url, '_blank');
        } else {
            toast.error("Preview not available for this file");
        }
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg">Project Files</h3>
                    <p className="text-sm text-gray-500">Manage and share project assets</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <div className="animate-spin mr-2 h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> : <Upload size={18} className="mr-2" />}
                        Upload File
                    </Button>
                </div>
            </div>

            {files.length === 0 ? (
                <EmptyState
                    icon={FolderOpen}
                    title="No files yet"
                    description="Upload documents, designs, or resources to share with the team."
                    action={
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Select File
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="group p-5 border border-gray-100 rounded-xl bg-white hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText size={20} />
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-primary h-8 w-8" onClick={() => handleDownload(file)}>
                                    <Download size={16} />
                                </Button>
                            </div>
                            <h4 className="font-bold text-gray-900 truncate mb-1" title={file.name}>{file.name}</h4>
                            <div className="flex justify-between items-center text-xs text-gray-400 mt-2 border-t border-gray-50 pt-3">
                                <span>{(file.size / 1024).toFixed(1)} KB</span>
                                <span>{new Date(file.created_at || file.uploaded_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const TasksTab = ({ tasks, onCreate, onUpdateStatus, project }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

    const handleSuggestTasks = async () => {
        try {
            setIsGeneratingTasks(true);
            const res = await api.ai.collaborationHelp(project);
            if (res.tasks && res.tasks.length > 0) {
                // For demo/simplicity, we just toast and maybe could auto-add them.
                // For now, let's just show a toast or a list.
                toast.success(`AI suggested ${res.tasks.length} tasks!`);
                // Auto-create them? Or let user pick? 
                // Let's auto-create the top 3 for "wow" factor
                const topTasks = res.tasks.slice(0, 3);
                for (const t of topTasks) {
                    await onCreate({ title: t.title, status: 'todo' });
                }
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to suggest tasks");
        } finally {
            setIsGeneratingTasks(false);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onCreate({ title: newTaskTitle, status: 'todo' });
        setNewTaskTitle('');
    };

    const StatusColumn = ({ id, label, color, icon: Icon, items }) => (
        <div className="flex-1 min-w-[300px] flex flex-col h-full bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${color} bg-opacity-20 text-${color.split('-')[1]}-700`}>
                        <Icon size={16} />
                    </div>
                    <span className="font-bold text-gray-700">{label}</span>
                </div>
                <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-bold text-gray-500 border border-gray-200">
                    {items.length}
                </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
                {items.map(task => (
                    <div key={task.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                        <p className="text-gray-900 font-medium mb-3 text-sm">{task.title}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <span className="text-[10px] text-gray-400">{new Date(task.created_at || Date.now()).toLocaleDateString()}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {id !== 'todo' && <button onClick={() => onUpdateStatus(task.id, 'todo')} className="h-2 w-2 rounded-full bg-gray-300 hover:scale-125" title="Move to Todo" />}
                                {id !== 'in_progress' && <button onClick={() => onUpdateStatus(task.id, 'in_progress')} className="h-2 w-2 rounded-full bg-blue-400 hover:scale-125" title="Move to In Progress" />}
                                {id !== 'done' && <button onClick={() => onUpdateStatus(task.id, 'done')} className="h-2 w-2 rounded-full bg-green-400 hover:scale-125" title="Move to Done" />}
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="py-8 text-center text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 h-[calc(100vh-200px)] flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-900 text-lg">Project Tasks</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary text-xs hover:bg-primary/5 border border-primary/20"
                        onClick={handleSuggestTasks}
                        disabled={isGeneratingTasks}
                    >
                        {isGeneratingTasks ? <Loader2 size={14} className="animate-spin mr-1" /> : <Sparkles size={14} className="mr-1" />}
                        AI Suggest Tasks
                    </Button>
                </div>
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Add a new task..."
                        className="w-64 px-4 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                    />
                    <Button type="submit" size="sm" disabled={!newTaskTitle.trim()}>
                        <Plus size={16} /> Add
                    </Button>
                </form>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 h-full">
                <StatusColumn id="todo" label="To Do" color="bg-gray-100" icon={Clock} items={tasks.filter(t => t.status === 'todo')} />
                <StatusColumn id="in_progress" label="In Progress" color="bg-blue-100" icon={Play} items={tasks.filter(t => t.status === 'in_progress')} />
                <StatusColumn id="done" label="Completed" color="bg-green-100" icon={CheckCircle2} items={tasks.filter(t => t.status === 'done')} />
            </div>
        </div>
    );
};

// ... Include other tabs (Video, Contracts) with similar styling ...
const VideoConferenceTab = ({ project, user, onNotify }) => {
    const [inMeeting, setInMeeting] = useState(false);
    const roomName = `africakonnect-project-${project.id}`;
    const meetingLink = `https://africakonnect.com/${roomName}`;

    const handleJoin = () => {
        setInMeeting(true);
        if (onNotify) {
            onNotify(`I've started a video meeting for project: ${project.title}. \n\nJoin here: ${meetingLink}`);
        }
    };

    const copyMeetingLink = () => {
        navigator.clipboard.writeText(meetingLink);
        toast.success("Meeting link copied to clipboard!");
    };

    if (inMeeting) {
        return (
            <div className="h-[calc(100vh-150px)] rounded-2xl overflow-hidden shadow-2xl bg-black">
                <div className="bg-gray-900 p-4 flex justify-between items-center text-white border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-lg animate-pulse">
                            <Video size={16} />
                        </div>
                        <span className="font-bold">Live Meeting: {project.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700" onClick={copyMeetingLink}>
                            Copy Link
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setInMeeting(false)}>
                            Leave Meeting
                        </Button>
                    </div>
                </div>
                <div className="h-full">
                    <MeetingRoom roomName={roomName} userName={user?.name || 'User'} onLeave={() => setInMeeting(false)} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-[calc(100vh-250px)]">
            <Card className="max-w-md w-full p-8 text-center space-y-8">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                    <Video size={40} className="text-primary relative z-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Video Room</h2>
                    <p className="text-gray-500">Connect with your team in real-time. HD video and screen sharing enabled.</p>
                </div>
                <div className="pt-4 space-y-3">
                    <Button size="lg" className="w-full text-base py-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] transition-all" onClick={handleJoin}>
                        Join Meeting Room & Notify Team
                    </Button>
                    <Button variant="outline" className="w-full" onClick={copyMeetingLink}>
                        Copy Invite Link
                    </Button>
                </div>
            </Card>
        </div>
    );
};

// --- Main Layout ---

export default function Collaboration() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const projectId = location.state?.projectId;
    const [project, setProject] = useState(null);
    const [initLoading, setInitLoading] = useState(true);

    const {
        activeTab,
        setActiveTab,
        data,
        loading,
        actions
    } = useCollaboration(projectId, user);

    useEffect(() => {
        const loadProject = async () => {
            if (!user) return;
            // ... existing load logic
            if (projectId) {
                try {
                    const p = await api.projects.getById(projectId);
                    setProject(p);
                } catch (e) {
                    console.error(e);
                    toast.error("Failed to load project details");
                }
            } else {
                const p = await api.projects.getMine();
                if (p?.projects?.length > 0) setProject(p.projects[0]);
            }
            setInitLoading(false);
        };
        loadProject();
    }, [user, projectId]);

    if (initLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;
    if (!project) return <EmptyState icon={FolderOpen} title="No Project Selected" description="Please select a project from your dashboard." action={<Button onClick={() => navigate('/expert-dashboard')}>Go to Dashboard</Button>} />;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'messages', label: 'Chat', icon: MessageSquare },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'contracts', label: 'Contract', icon: FileSignature },
        { id: 'video', label: 'Meeting', icon: Video },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-20">
            <SEO title={`${project.title} - Hub`} />

            {/* Sidebar */}
            <div className="w-full md:w-72 bg-white h-auto md:h-[calc(100vh-80px)] border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0 sticky top-20 z-20">
                <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex items-center gap-3 mb-4 text-gray-500 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(-1)}>
                        <ChevronLeft size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Back to Dashboard</span>
                    </div>
                    <h1 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2" title={project.title}>{project.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-xs text-gray-500 capitalize">{project.status} Project</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-md shadow-primary/20'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <tab.icon size={20} className={activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-primary'} />
                                <span className="font-medium">{tab.label}</span>
                            </div>
                            {tab.id === 'messages' && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{data.messages.length}</span>}
                            {tab.id === 'tasks' && <span className="text-xs bg-gray-100 text-gray-500 group-hover:bg-white px-2 py-0.5 rounded-full">{data.tasks.filter(t => t.status !== 'done').length}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Layout */}
            <main className="flex-1 p-4 md:p-8 h-[calc(100vh-80px)] overflow-y-auto bg-gray-50/50 relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {activeTab === 'overview' && <OverviewTab project={project} tasks={data.tasks} contracts={data.contracts} onInvite={actions.inviteUser} />}
                        {activeTab === 'contracts' && (
                            <div className="h-full overflow-y-auto">
                                <Step4Contract
                                    project={project}
                                    hideProceed={true}
                                    onNext={() => { }} // No next action needed in Hub
                                />
                            </div>
                        )}
                        {activeTab === 'messages' && <MessagesTab messages={data.messages} onSend={actions.sendMessage} onTyping={actions.sendTyping} typingUsers={data.typingUsers} user={user} />}
                        {activeTab === 'files' && <FilesTab files={data.files} onUpload={actions.uploadFile} />}
                        {activeTab === 'tasks' && <TasksTab tasks={data.tasks} onCreate={actions.createTask} onUpdateStatus={actions.updateTaskStatus} project={project} />}
                        {activeTab === 'video' && <VideoConferenceTab project={project} user={user} onNotify={(msg) => actions.sendMessage(msg)} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
