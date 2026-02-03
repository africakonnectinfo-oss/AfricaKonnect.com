import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import { api } from '../lib/api';
import {
    LayoutDashboard, MessageSquare, FolderOpen, CheckSquare,
    CreditCard, Settings, Bell, Search, Plus, Paperclip,
    Send, MoreVertical, CheckCircle2, Clock, FileText,
    Download, Play, Upload, MoreHorizontal, Video, Users2, Users, Calendar, Sparkles
} from 'lucide-react';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import AIDraftModal from '../components/AIDraftModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import MeetingRoom from '../components/common/MeetingRoom';

// --- Tab Components ---

const OverviewTab = ({ project, tasks, contracts = [] }) => {
    const handleDownload = (contract) => {
        // Create a simple text blob for now, or request PDF from backend
        const element = document.createElement("a");
        const file = new Blob([contract.terms], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `Contract_${project.id}.txt`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Project Overview</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{project.description}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 block mb-1">Budget</span>
                        <span className="text-lg font-bold text-gray-900">${project.budget?.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500 block mb-1">Deadline</span>
                        <span className="text-lg font-bold text-gray-900">{new Date(project.deadline || new Date().getTime() + 864000000).toLocaleDateString()}</span>
                    </div>
                </div>
            </Card>

            <div className="space-y-6">
                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Team</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar name={project.client_name || "Client"} className="bg-blue-100 text-blue-600" />
                            <div>
                                <p className="font-medium text-sm">{project.client_name || "Client Name"}</p>
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">Owner</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Legal & Contracts</h3>
                    {contracts.length > 0 ? (
                        <div className="space-y-3">
                            {contracts.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">Contract Agreement</p>
                                            <p className="text-xs text-green-600 font-medium">{c.status === 'signed' ? 'Signed & Active' : c.status}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => handleDownload(c)} title="Download Contract">
                                        <Download size={16} className="text-gray-500 hover:text-primary" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">No active contracts.</p>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Task Completion</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">{tasks.filter(t => t.status === 'done').length}</span>
                        <span className="text-gray-500 mb-1">/ {tasks.length} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-success h-2 rounded-full transition-all duration-500"
                            style={{ width: `${tasks.length ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0}%` }}
                        ></div>
                    </div>
                </Card>
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
        <Card className="h-[600px] flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Project Team Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-10">No messages yet.</div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-2xl p-4 ${isMe
                                ? 'bg-primary text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                }`}>
                                <p className="text-sm">{msg.content}</p>
                                <span className={`text-[10px] mt-1 block ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input
                    type="text"
                    className="flex-1 border-0 bg-gray-100 rounded-full px-4 focus:ring-2 focus:ring-primary/50"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <Button type="submit" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center p-0">
                    <Send size={18} />
                </Button>
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
        try {
            await onUpload(file);
        } catch (error) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadFile = async (file) => {
        try {
            if (file.url) {
                window.open(file.url, '_blank');
            } else {
                // Fetch file data from backend
                const response = await api.files.download(file.id).catch(() => null);

                if (response) {
                    if (response.url) {
                        window.open(response.url, '_blank');
                    } else if (response.data && response.data.data) {
                        // Handle Buffer data (Postgres bytea)
                        // response.data is the Buffer object { type: 'Buffer', data: [...] }
                        const buffer = new Uint8Array(response.data.data);
                        const blob = new Blob([buffer], { type: response.type || 'application/octet-stream' });
                        const url = URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = url;
                        link.download = response.name || 'download';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    } else {
                        alert("File content not available");
                    }
                } else {
                    alert("File download failed");
                }
            }
        } catch (error) {
            console.error("Download failed", error);
            alert("Download failed");
        }
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Project Files</h3>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload size={16} className="mr-2" />
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </div>
            </div>

            {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <FolderOpen size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No files uploaded yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="p-4 border border-gray-200 rounded-xl hover:border-primary/50 transition-colors bg-white group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary" onClick={() => handleDownloadFile(file)}>
                                    <Download size={16} />
                                </Button>
                            </div>
                            <h4 className="font-medium text-gray-900 truncate" title={file.name}>{file.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {(file.size / 1024).toFixed(0)} KB • {new Date(file.created_at || file.uploaded_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const TasksTab = ({ tasks, onCreate, onUpdateStatus }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onCreate({ title: newTaskTitle, status: 'todo' });
        setNewTaskTitle('');
    };

    const columns = [
        { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
        { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50' },
        { id: 'done', label: 'Done', color: 'bg-green-50' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Task Board</h3>
                <form onSubmit={handleCreate} className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => alert("AI Suggest: Coming Soon! Will analyze project description and suggest tasks.")} className="text-purple-600 border-purple-200">
                        <Sparkles size={16} />
                    </Button>
                    <input
                        type="text"
                        placeholder="Add new task..."
                        className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                    />
                    <Button type="submit"><Plus size={16} /></Button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-x-auto pb-4">
                {columns.map(col => (
                    <div key={col.id} className="min-w-[280px]">
                        <div className={`p-3 rounded-t-xl font-bold text-gray-700 flex justify-between items-center ${col.color}`}>
                            {col.label}
                            <span className="bg-white/50 px-2 py-0.5 rounded text-sm">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>
                        <div className={`p-3 bg-gray-50/50 rounded-b-xl min-h-[400px] space-y-3 border-x border-b border-gray-100`}>
                            {tasks.filter(t => t.status === col.id).map(task => (
                                <div key={task.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow group">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-gray-900 flex-1">{task.title}</p>
                                        {col.id !== 'todo' && (
                                            <button onClick={() => onUpdateStatus(task.id, 'todo')} className="p-1 hover:bg-gray-100 rounded" title="Move to To Do">
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            </button>
                                        )}
                                        {col.id !== 'in_progress' && (
                                            <button onClick={() => onUpdateStatus(task.id, 'in_progress')} className="p-1 hover:bg-gray-100 rounded" title="Move to In Progress">
                                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            </button>
                                        )}
                                        {col.id !== 'done' && (
                                            <button onClick={() => onUpdateStatus(task.id, 'done')} className="p-1 hover:bg-gray-100 rounded" title="Move to Done">
                                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ContractsTab = ({ contracts, onSign, onOpenAIDraft, user }) => {
    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Contracts & Agreements</h3>
                {user.role === 'client' && (
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={onOpenAIDraft} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                            <Sparkles size={16} className="mr-2" /> Draft with AI
                        </Button>
                        <Button size="sm">
                            <Plus size={16} className="mr-2" /> New Contract
                        </Button>
                    </div>
                )}
            </div>

            {contracts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <FileText size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No active contracts.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {contracts.map(contract => (
                        <div key={contract.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-primary/30 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${contract.status === 'signed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Contract #{contract.id.substring(0, 8)}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className="capitalize">{contract.status}</span>
                                            <span>•</span>
                                            <span>${contract.amount}</span>
                                            <span>•</span>
                                            <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm">View Terms</Button>
                                    {contract.status === 'pending' && (
                                        <Button size="sm" onClick={() => onSign(contract.id)}>
                                            Sign Contract
                                        </Button>
                                    )}
                                    {contract.status === 'signed' && (
                                        <Button size="sm" variant="secondary" disabled>
                                            <CheckCircle2 size={16} className="mr-2" /> Signed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const InterviewsTab = ({ interviews, onSchedule }) => {
    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Scheduled Interviews</h3>
                <Button size="sm" onClick={onSchedule}>
                    <Plus size={16} className="mr-2" /> Schedule New
                </Button>
            </div>

            {interviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <Clock size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No interviews scheduled.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {interviews.map(interview => (
                        <div key={interview.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                                    <Video size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{interview.topic || 'Project Discussion'}</h4>
                                    <p className="text-sm text-gray-500">
                                        {new Date(interview.date).toLocaleDateString()} at {interview.time}
                                    </p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => window.open(interview.meeting_link || `https://meet.jit.si/${interview.id}`, '_blank')}>
                                Join Meeting
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const PaymentsTab = ({ project, user }) => {
    const [escrow, setEscrow] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchEscrow = async () => {
            try {
                const data = await api.payments.getEscrow(project.id).catch(() => null);
                if (data) setEscrow(data);
            } catch (e) { console.error(e); }
        };
        fetchEscrow();
    }, [project.id]);

    const handleFundEscrow = async () => {
        if (!confirm('Proceed to fund escrow with $' + (project.budget || 0) + '?')) return;
        setLoading(true);
        try {
            const data = await api.payments.initEscrow(project.id, project.budget);
            setEscrow(data);
            alert('Escrow funded successfully!');
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8">
            <div className="text-center max-w-2xl mx-auto">
                <CreditCard size={48} className="mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Escrow & Project Payments</h3>
                <p className="text-gray-600 mb-8">
                    Securely hold funds in escrow and release them when milestones are met.
                </p>

                {escrow ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-green-800 font-semibold">Escrow Balance</span>
                            <span className="text-2xl font-bold text-green-700">${escrow.balance}</span>
                        </div>
                        <div className="w-full bg-green-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-600 h-full w-full"></div>
                        </div>
                        <p className="text-xs text-green-600 mt-2 text-left">Funds are secure and ready for release.</p>
                    </div>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6 text-left">
                        <h4 className="font-bold text-yellow-900 mb-2">Escrow Not Funded</h4>
                        <p className="text-sm text-yellow-800 mb-4">
                            Funding the project builds trust with your expert. Funds are held securely until you approve the work.
                        </p>
                        {user.role === 'client' && (
                            <Button onClick={handleFundEscrow} className="w-full sm:w-auto">
                                Fund Escrow (${project.budget})
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

const TeamTab = ({ project, contracts = [], onInvite }) => {
    // Derive team from project owner + experts with signed contracts
    // This is a simplification; ideally fetching team members endpoint
    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Team Members</h3>
                <Button size="sm" variant="outline" onClick={onInvite}>
                    <Plus size={16} className="mr-2" /> Invite Member
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Client / Owner */}
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <Avatar name={project.client_name || "Client"} size="lg" className="bg-blue-600 text-white" />
                    <div>
                        <h4 className="font-bold text-gray-900">{project.client_name || 'Client'}</h4>
                        <p className="text-sm text-blue-600 font-medium">Project Owner</p>
                    </div>
                </div>

                {/* Experts from Contracts */}
                {contracts.filter(c => c.status === 'signed').map(contract => (
                    <div key={contract.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white">
                        <Avatar name={`Expert ${contract.expert_id}`} size="lg" className="bg-purple-600 text-white" />
                        <div>
                            <h4 className="font-bold text-gray-900">Expert #{contract.expert_id}</h4>
                            <p className="text-sm text-purple-600 font-medium">Collaborator</p>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


const VideoConferenceTab = ({ project, user }) => {
    const [inMeeting, setInMeeting] = useState(false);
    const [meetingLink, setMeetingLink] = useState('');

    // Generate unique meeting room name based on project ID
    const roomName = `africakonnect-project-${project.id}`;

    useEffect(() => {
        // Generate meeting link when component mounts
        setMeetingLink(`https://meet.jit.si/${roomName}`);
    }, [roomName]);

    const handleLeaveMeeting = () => {
        setInMeeting(false);
    };

    if (inMeeting) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">Team Video Conference</h3>
                    <Button variant="outline" onClick={handleLeaveMeeting}>
                        Leave Meeting
                    </Button>
                </div>
                <MeetingRoom
                    roomName={roomName}
                    userName={user?.name || 'Team Member'}
                    onLeave={handleLeaveMeeting}
                />
            </div>
        );
    }

    return (
        <Card className="p-8">
            <div className="text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Video size={40} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Project Video Conference</h3>
                <p className="text-gray-600 mb-6">
                    Start a secure video call with your team members. Share your screen, collaborate in real-time, and discuss project details.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-500 mb-2">Meeting Room</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{meetingLink}</p>
                </div>

                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full max-w-xs"
                        onClick={() => setInMeeting(true)}
                    >
                        <Video size={20} className="mr-2" />
                        Join Video Conference
                    </Button>
                    <p className="text-xs text-gray-500">
                        Powered by Jitsi • End-to-end encrypted
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">HD Video & Audio</h4>
                        <p className="text-sm text-gray-600">Crystal clear communication with your team</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">Screen Sharing</h4>
                        <p className="text-sm text-gray-600">Present your work and collaborate visually</p>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-1">Secure & Private</h4>
                        <p className="text-sm text-gray-600">End-to-end encrypted meetings</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// --- Main Component ---

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
        data: { messages, files, tasks },
        loading: dataLoading,
        actions
    } = useCollaboration(projectId, user);

    // Initial Project Fetch
    useEffect(() => {
        const loadProject = async () => {
            if (!user) return;
            try {
                if (projectId) {
                    const data = await api.projects.getOne(projectId);
                    setProject(data);
                } else {
                    const data = await api.projects.getMine();
                    if (data?.projects?.length > 0) {
                        setProject(data.projects[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to load project context", error);
            } finally {
                setInitLoading(false);
            }
        };
        loadProject();
    }, [user, projectId]);

    if (initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <FolderOpen size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Project Selected</h2>
                <Button onClick={() => navigate(user.role === 'expert' ? '/expert-dashboard' : '/project-hub')}>
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'team', label: 'Team', icon: Users2 },
        { id: 'contracts', label: 'Contracts', icon: FileText },
        { id: 'interviews', label: 'Interviews', icon: Calendar }, // Assuming Calendar imported or use Clock
        { id: 'video', label: 'Video Call', icon: Video },
        { id: 'payments', label: 'Payments', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <SEO title={`${project.title} - Collaboration`} description="Project Workspace" />

            <div className="flex h-[calc(100vh-80px)]">
                {/* Sidebar */}
                <div className="w-20 md:w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300">
                    <div className="p-6 border-b border-gray-100 hidden md:block">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Workspace</h2>
                        <h1 className="font-bold text-gray-900 truncate" title={project.title}>{project.title}</h1>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === tab.id
                                    ? 'bg-primary/5 text-primary font-semibold'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <tab.icon size={20} />
                                <span className="hidden md:block">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <Button variant="outline" className="w-full justify-start text-gray-600" onClick={() => navigate(-1)}>
                            <span className="hidden md:inline">Back to Dashboard</span>
                            <span className="md:hidden">Back</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'overview' && <OverviewTab project={project} tasks={tasks} contracts={data.contracts} />}
                            {activeTab === 'messages' && (
                                <MessagesTab
                                    messages={messages}
                                    onSend={actions.sendMessage}
                                    user={user}
                                />
                            )}
                            {activeTab === 'files' && (
                                <FilesTab
                                    files={files}
                                    onUpload={actions.uploadFile}
                                />
                            )}
                            {activeTab === 'tasks' && (
                                <TasksTab
                                    tasks={tasks}
                                    onCreate={actions.createTask}
                                    onUpdateStatus={actions.updateTaskStatus}
                                />
                            )}
                            {activeTab === 'team' && (
                                <TeamTab
                                    project={project}
                                    contracts={data.contracts}
                                    onInvite={() => navigate(`/experts?projectId=${project.id}`)}
                                />
                            )}
                            {activeTab === 'contracts' && (
                                <ContractsTab
                                    contracts={data.contracts}
                                    onSign={actions.signContract}
                                    onOpenAIDraft={() => setAiDraftModalOpen(true)}
                                    user={user}
                                />
                            )}
                            {activeTab === 'interviews' && (
                                <InterviewsTab
                                    interviews={data.interviews || []}
                                    onSchedule={() => setInterviewModalOpen(true)}
                                />
                            )}
                            {activeTab === 'video' && (
                                <VideoConferenceTab
                                    project={project}
                                    user={user}
                                />
                            )}
                            {activeTab === 'payments' && (
                                <PaymentsTab project={project} user={user} />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <ScheduleInterviewModal
                        isOpen={interviewModalOpen}
                        onClose={() => setInterviewModalOpen(false)}
                        onSchedule={actions.scheduleInterview}
                        expertName={project.selected_expert_name || 'the Expert'}
                    />

                    <AIDraftModal
                        isOpen={aiDraftModalOpen}
                        onClose={() => setAiDraftModalOpen(false)}
                        onDraft={handleAIDraft}
                        project={project}
                        clientName={project.client_name}
                        expertName={project.selected_expert_name}
                    />
                </div>
            </div>
        </div>
    );
}
