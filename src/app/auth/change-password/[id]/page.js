"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiLock } from 'react-icons/fi';
import styles from '../../../../styles/Login.module.css';
import { useParams, useRouter } from "next/navigation";
import { apiClient } from '../../../_utils/apiClient';

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const router = useRouter();
    const params = useParams();
    const token = params.id;

    const validatePasswords = () => {
        if (newPassword !== confirmNewPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }
        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setPasswordError('');

        if (!validatePasswords()) return;

        setIsLoading(true);

        try {
            await apiClient.post(
                '/api/auth/password-reset',
                { token, newPassword, confirmNewPassword },
                {
                    'Content-Type': 'application/json',
                }
            );

            // Clear token and redirect
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            router.push('/auth/login');

        } catch (err) {
            setError(err?.data?.message || err.message || 'Change Password failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);

        if (value && newPassword !== value) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    };

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={styles.card}
            >

                <div className={styles.header}>
                    <h1 className={styles.title}>Change Password</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.errorMessage}
                        >
                            {error}
                        </motion.div>
                    )}

                    {passwordError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={styles.errorMessage}
                        >
                            {passwordError}
                        </motion.div>
                    )}

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>New Password</label>
                        <div className={styles.inputContainer}>
                            <div className={styles.inputIcon}>
                                <FiLock />
                            </div>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewPassword(value);

                                    if (confirmNewPassword && value !== confirmNewPassword) {
                                        setPasswordError('Passwords do not match');
                                    } else {
                                        setPasswordError('');
                                    }
                                }}
                                className={styles.inputField}
                                placeholder="Enter your new password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Confirm New Password</label>
                        <div className={styles.inputContainer}>
                            <div className={styles.inputIcon}>
                                <FiLock />
                            </div>
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={handleConfirmPasswordChange}
                                className={styles.inputField}
                                placeholder="Confirm your new password"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className={styles.options}>
                        <a href="/auth/login" className={styles.forgotPassword}>
                            Back to Login
                        </a>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading || !!passwordError}
                        className={`${styles.submitButton} ${(isLoading || passwordError) ? styles.disabled : ''}`}
                    >
                        {isLoading ? (
                            <div className={styles.spinnerContainer}>
                                <div className={styles.spinner}></div>
                            </div>
                        ) : (
                            <>
                                <FiLogIn className={styles.buttonIcon} />
                                Change Password
                            </>
                        )}
                    </motion.button>

                </form>
            </motion.div>
        </div>
    );
}