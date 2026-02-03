import React, { useState, useEffect, useCallback } from 'react';
import { Video, Calendar, Clock, CheckCircle, Video as VideoIcon, X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib/api';
import MeetingRoom from '../../components/common/MeetingRoom';
import { useAuth } from '../../contexts/AuthContext';

const Step3Interview = ({ onNext }) => {
    const { currentProject } = useProject();
    const { user } = useAuth();
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMeeting, setActiveMeeting] = useState(null); // { roomName: string, id: string }

    const loadInterviews = useCallback(async () => {
        if (!currentProject?.id) return;
        try {
            const data = await api.interviews.getByProject(currentProject.id);
            setInterviews(data.interviews || []);
        } catch (e) {
            console.error("Failed to load interviews", e);
        } finally {
            setLoading(false);
        }
    }, [currentProject?.id]);

    useEffect(() => {
        loadInterviews();
    }, [loadInterviews]);

    const handleSchedule = async () => {
        if (!scheduledDate || !scheduledTime) {
            alert("Please select both date and time");
            return;
        }

        try {
            setIsScheduling(true);
            const scheduledAt = new Date(`${scheduledDate}T${scheduledTime} `);

            // Assuming currentProject.selected_expert_id (the shortlisted one)
            // If no expert selected yet (rare in this flow), warn user
            if (!currentProject.selected_expert_id) {
                alert("No expert selected/shortlisted yet to interview.");
                return;
            }

            // Create a unique room name
            const roomName = `AK-Interview-${currentProject.id}-${Date.now()}`;

            await api.interviews.schedule({
                projectId: currentProject.id,
                expertId: currentProject.selected_expert_id,
                scheduledAt: scheduledAt.toISOString(),
                durationMinutes: 45,
                notes: "Initial screening",
                meetingLink: roomName // Storing room name as the link for internal logic
            });

            alert("Interview Invitation Sent!");
            loadInterviews();
        } catch (error) {
            console.error(error);
            alert("Failed to schedule: " + error.message);
        } finally {
            setIsScheduling(false);
        }
    };

    const handleJoinMeeting = (interview) => {
        // If meeting_link is a full URL (legacy), extract room name or just use it. 
        // For new ones, it's just the room name.
        let roomName = interview.meeting_link;
        if (!roomName) {
            roomName = `AK-Interview-${interview.id}`; // Fallback
        }

        // Ensure clean room name if it was a URL
        if (roomName.startsWith('http')) {
            roomName = roomName.split('/').pop();
        }

        setActiveMeeting({
            id: interview.id,
            roomName: roomName
        });
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Interview</h2>
                <p className="text-gray-600">Coordinate a time to meet your shortlisted expert.</p>
            </div>

            {activeMeeting ? (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                            Live Interview Session
                        </h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveMeeting(null)}
                            className="text-gray-500 hover:text-red-500"
                        >
                            <X size={16} className="mr-1" /> Leave Meeting
                        </Button>
                    </div>
                    <MeetingRoom
                        roomName={activeMeeting.roomName}
                        userName={user?.user_metadata?.name || user?.email || 'User'}
                        onLeave={() => setActiveMeeting(null)}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Scheduler Form */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="text-primary" />
                            Propose a Time
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    className="w-full p-2 border rounded-lg"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full"
                                    onClick={handleSchedule}
                                    disabled={isScheduling || !currentProject?.selected_expert_id}
                                >
                                    {isScheduling ? "Sending Invite..." : "Send Interview Invitation"}
                                </Button>
                                {!currentProject?.selected_expert_id && (
                                    <p className="text-xs text-red-500 mt-2 text-center">
                                        Please shortlist an expert in the previous step first.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Scheduled Interviews List */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <VideoIcon className="text-primary" />
                            Scheduled Sessions
                        </h3>

                        {interviews.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <p className="text-gray-500">No interviews scheduled yet.</p>
                            </div>
                        ) : (
                            interviews.map((interview) => (
                                <Card key={interview.id} className="p-4 border-l-4 border-l-primary">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Interview with {interview.expert_name || 'Expert'}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Calendar size={14} />
                                                {new Date(interview.scheduled_at).toLocaleDateString()} at {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Clock size={14} />
                                                {interview.duration_minutes} mins
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleJoinMeeting(interview)}
                                            className="bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                                            size="sm"
                                        >
                                            <Video size={16} className="mr-2" />
                                            Join
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="flex justify-end mt-8">
                {!activeMeeting && (
                    <Button
                        variant="outline"
                        className="mr-2"
                        onClick={() => setActiveMeeting({ roomName: 'AfricaKonnect-Demo-Room', id: 'demo' })}
                    >
                        Test Video (Demo)
                    </Button>
                )}
                <Button onClick={onNext}>
                    Skip / Continue to Contract
                </Button>
            </div>
        </div>
    );
};

export { Step3Interview };
