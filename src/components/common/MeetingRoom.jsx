import React, { useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

const MeetingRoom = ({ roomName, userName, onLeave, domain = "meet.jit.si" }) => {
    const [loading, setLoading] = useState(true);

    return (
        <div className="h-[600px] w-full bg-gray-900 rounded-xl overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                    <Loader2 className="animate-spin mr-2" />
                    <span>Connecting to Secure Meeting Room...</span>
                </div>
            )}
            <JitsiMeeting
                domain={domain}
                roomName={roomName}
                configOverwrite={{
                    startWithAudioMuted: false,
                    disableModeratorIndicator: true,
                    startScreenSharing: true,
                    enableEmailInStats: false,
                    prejoinPageEnabled: false
                }}
                interfaceConfigOverwrite={{
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ]
                }}
                userInfo={{
                    displayName: userName
                }}
                onApiReady={(externalApi) => {
                    setLoading(false);
                    // Handle events here
                    externalApi.addEventListener('videoConferenceLeft', () => {
                        if (onLeave) onLeave();
                    });
                    externalApi.addEventListener('readyToClose', () => {
                        if (onLeave) onLeave();
                    });
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                    iframeRef.style.border = 'none';
                }}
            />
        </div>
    );
};

export default MeetingRoom;
