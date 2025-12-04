// // lib/msalClient.js (Client-side only)
// 'use client';
// import { msalInstance } from './msalConfig';
//
// let isInitialized = false;
//
// export const initializeMSAL = async () => {
//     if (isInitialized) return msalInstance;
//
//     try {
//         await msalInstance.initialize();
//
//         // Handle redirect promise
//         await msalInstance.handleRedirectPromise().then((response) => {
//             if (response) {
//                 console.log('Redirect response received:', response);
//             }
//             return response;
//         }).catch((error) => {
//             console.error('Redirect promise error:', error);
//             return null;
//         });
//
//         isInitialized = true;
//         return msalInstance;
//     } catch (error) {
//         console.error('MSAL initialization failed:', error);
//         throw error;
//     }
// };
//
// export const getMSALInstance = () => {
//     if (!isInitialized) {
//         console.warn('MSAL not initialized. Call initializeMSAL() first.');
//     }
//     return msalInstance;
// };