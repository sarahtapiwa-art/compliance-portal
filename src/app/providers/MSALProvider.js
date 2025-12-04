// src/app/providers/MSALProvider.js
"use client";

import { MsalProvider } from "@azure/msal-react";
import { useEffect, useState, Suspense } from "react";

// Create MSAL instance only on client
function createMsalInstance() {
    if (typeof window === 'undefined') return null;

    const { PublicClientApplication } = require('@azure/msal-browser');
    const msalConfig = require('../lib/msalConfig').default;

    const instance = new PublicClientApplication(msalConfig);
    return instance;
}

export default function MSALProvider({ children }) {
    const [instance, setInstance] = useState(null);

    useEffect(() => {
        const init = async () => {
            const msalInstance = createMsalInstance();
            if (msalInstance) {
                await msalInstance.initialize();
                await msalInstance.handleRedirectPromise();
                setInstance(msalInstance);
            }
        };

        init();
    }, []);

    // While loading, show minimal placeholder (same on server and client)
    if (!instance) {
        return (
            <div style={{ minHeight: '100vh' }}>
                {children} {/* Render children without MSAL initially */}
            </div>
        );
    }

    return (
        <MsalProvider instance={instance}>
            <Suspense fallback={<div>Loading authentication...</div>}>
                {children}
            </Suspense>
        </MsalProvider>
    );
}