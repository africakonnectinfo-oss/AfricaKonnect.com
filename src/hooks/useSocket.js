import { useEffect, useState } from 'react';
import socketService from '../lib/socket';

export const useSocket = () => {
    // Initialize socket only once
    const [socket] = useState(() => socketService.connect());

    useEffect(() => {
        // Connection is handled by socketService.connect() which is idempotent-ish
        // or we can ensure connection here if needed, but lazy init handles the object creation.
        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            // Optional: socket.disconnect() if we want to clean up on unmount
            // But usually we keep it open for the app
        };
    }, [socket]);

    return socket;
};
