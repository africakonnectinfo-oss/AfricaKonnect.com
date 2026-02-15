import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui';
import { createAuthClient } from '@neondatabase/neon-js/auth';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

const authConfig = {
    baseURL: neonAuthUrl,
};

const authClient = neonAuthUrl ? createAuthClient(neonAuthUrl) : null;

export { authConfig, authClient };
