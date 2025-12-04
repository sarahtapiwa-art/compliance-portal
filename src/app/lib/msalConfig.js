// src/app/lib/msalConfig.js
import { LogLevel } from '@azure/msal-browser';

// Helper function to get redirect URI
const getRedirectUri = () => {
    if (typeof window !== 'undefined') {
        // Use the current origin (will be http:// or https:// based on how user accessed)
        return window.location.origin;
    }

    // Server-side or build time
    // In production, default to HTTPS, otherwise HTTP for localhost
    if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_REDIRECT_URI || 'https://192.168.1.145:3000';
    }

    return process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000';
};

// Helper function to get post-logout redirect URI
const getPostLogoutRedirectUri = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }

    if (process.env.NODE_ENV === 'production') {
        return process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI || 'https://192.168.1.145:3000';
    }

    return process.env.NEXT_PUBLIC_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';
};

const msalConfig = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID || 'common'}`,
        redirectUri: getRedirectUri(),
        postLogoutRedirectUri: getPostLogoutRedirectUri(),
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) return;
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;
                    case LogLevel.Info:
                        console.info(message);
                        break;
                    case LogLevel.Verbose:
                        console.debug(message);
                        break;
                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                }
            },
            logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Verbose : LogLevel.Error
        }
    }
};

export const loginRequest = {
    scopes: ["User.Read", "Mail.Send", "offline_access"]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/sendMail"
};

export default msalConfig;

// Helper function to create instance (client-side only)
export function createMsalInstance() {
    if (typeof window !== 'undefined') {
        const { PublicClientApplication } = require('@azure/msal-browser');
        const instance = new PublicClientApplication(msalConfig);
        return instance;
    }
    return null;
}

// Or export a singleton getter function
let msalInstanceCache = null;
export function getMsalInstance() {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!msalInstanceCache) {
        const { PublicClientApplication } = require('@azure/msal-browser');
        msalInstanceCache = new PublicClientApplication(msalConfig);
    }
    return msalInstanceCache;
}