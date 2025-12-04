// src/app/layout.js
"use client";

import { AuthProvider } from "./contexts/AuthContext";
import "./globals.css";
import MSALProvider from "./providers/MSALProvider";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body>
        <MSALProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </MSALProvider>
        </body>
        </html>
    );
}