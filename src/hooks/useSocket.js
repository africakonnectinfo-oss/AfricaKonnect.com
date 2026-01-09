import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';

export const useSocket = () => {
    const [socket, setSocket] = useState(socketService.socket);

    useEffect(() => {
        // Ensure connection
        const s = socketService.connect();
        setSocket(s);
    }, []);

    return socket;
};
