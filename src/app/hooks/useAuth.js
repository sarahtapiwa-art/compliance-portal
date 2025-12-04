// // hooks/useAuth.js
// 'use client';
// import { useState, useEffect } from 'react';
// import { useMsal } from '@azure/msal-react';
// import {loginRequest} from "@/app/lib/msalConfig";
//
// export const useAuth = () => {
//     const { instance, accounts, inProgress } = useMsal();
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [userEmail, setUserEmail] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [microsoftToken, setMicrosoftToken] = useState(null);
//
//     useEffect(() => {
//         const checkAuth = async () => {
//             if (inProgress === 'none') {
//                 if (accounts.length > 0) {
//                     // User is logged in
//                     setIsAuthenticated(true);
//                     setUserEmail(accounts[0].username || accounts[0].name);
//
//                     // Try to get a token silently to ensure it's still valid
//                     try {
//                         const response = await instance.acquireTokenSilent({
//                             ...loginRequest,
//                             account: accounts[0]
//                         });
//                         console.log('Token acquired silently on page load');
//                     } catch (error) {
//                         console.log('Silent token acquisition failed, user may need to re-authenticate');
//                         // Optional: You could trigger a popup login here
//                     }
//                 } else {
//                     setIsAuthenticated(false);
//                     setUserEmail('');
//                 }
//                 setIsLoading(false);
//             }
//         };
//
//         checkAuth();
//     }, [accounts, inProgress, instance]);
//
//     const login = async () => {
//         try {
//             await instance.loginPopup(loginRequest);
//         } catch (error) {
//             console.error('Login failed:', error);
//             throw error;
//         }
//     };
//
//     const logout = () => {
//         instance.logoutPopup();
//     };
//
//     const getToken = async () => {
//         if (accounts.length > 0) {
//             try {
//                 const response = await instance.acquireTokenSilent({
//                     ...loginRequest,
//                     account: accounts[0]
//                 });
//                 setMicrosoftToken(response.accessToken);
//                 return response.accessToken;
//             } catch (error) {
//                 if (error.name === 'InteractionRequiredAuthError') {
//                     // Fallback to popup if silent acquisition fails
//                     const response = await instance.acquireTokenPopup(loginRequest);
//                     return response.accessToken;
//                 }
//                 throw error;
//             }
//         }
//         return null;
//     };
// const getMicroToken = async () => {
//     return microsoftToken
// }
//     return {
//         isAuthenticated,
//         userEmail,
//         isLoading,
//         login,
//         logout,
//         getToken,
//         accounts
//     };
// };