"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiUser} from 'react-icons/fi';
import styles from '../../../../styles/Login.module.css';
import { apiClient } from '../../../_utils/apiClient';

export default function ResetPasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.post(
        '/api/v1/auth/change-password',
        { oldPassword, newPassword },
        {
          'Content-Type': 'application/json',
        }
      );
    } catch (err) {
      setError(err?.data?.message || err.message || 'Change Password failed');
    } finally {
      setIsLoading(false);
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
        <div className={styles.inputGroup}>
            <label htmlFor="oldPassword" className={styles.inputLabel}>Password</label>
            <div className={styles.inputContainer}>
              <div className={styles.inputIcon}>
                <FiUser />
              </div>
              <input
                id="oldPassword"
                type="text"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={styles.inputField}
                placeholder="Enter your old password"
                required
              />
            </div>
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword" className={styles.inputLabel}>New Password</label>
            <div className={styles.inputContainer}>
              <div className={styles.inputIcon}>
                <FiUser />
              </div>
              <input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.inputField}
                placeholder="Enter your new Password"
                required
              />
            </div>
          </div>
          <div className={styles.options}>
            <a href="/dashboard" className={styles.forgotPassword}>
              Back to dashboard
            </a>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? (
              <div className={styles.spinnerContainer}>
                <div className={styles.spinner}></div>
L              </div>
            ) : (
              <>
                <FiLogIn className={styles.buttonIcon} />
                Reset Password
              </>
            )}
          </motion.button>
        </form>


      </motion.div>
    </div>
  );
}