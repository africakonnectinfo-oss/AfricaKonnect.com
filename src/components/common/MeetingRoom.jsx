import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const MeetingRoom = ({ roomName, userName, onLeave, appId = "vpaas-magic-cookie-xxx" }) => {
    const [loading, setLoading] = useState(true);
    const jitsiContainerRef = React.useRef(null);
    const jitsiApiRef = React.useRef(null);

    React.useEffect(() => {
        // Using the External API from the script tag for Jitsi
        if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
            const domain = "africakonnect.com";
            const options = {
                roomName: roomName,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                configOverwrite: {
                    prejoinPageEnabled: false,
                    startWithAudioMuted: false,
                    disableModeratorIndicator: true,
                    startScreenSharing: true,
                },
                interfaceConfigOverwrite: {
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                        'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                        'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                        'security'
                    ]
                },
                userInfo: {
                    displayName: userName
                }
            };

            const api = new window.JitsiMeetExternalAPI(domain, options);
            jitsiApiRef.current = api;

            api.addEventListener('videoConferenceJoined', () => {
                setLoading(false);
            });

            api.addEventListener('videoConferenceLeft', () => {
                if (onLeave) onLeave();
            });

            return () => {
                if (jitsiApiRef.current) {
                    jitsiApiRef.current.dispose();
                }
            };
        }
    }, [roomName, userName, onLeave, appId]);

    return (
        <div className="h-[600px] w-full bg-gray-900 rounded-xl overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                    <Loader2 className="animate-spin mr-2" />
                    <span>Connecting to Secure Meeting Room...</span>
                </div>
            )}
            <div ref={jitsiContainerRef} className="h-full w-full" />
        </div>
    );
};

export default MeetingRoom;
