"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff, FiUser, FiLock, FiMail } from 'react-icons/fi';
import styles from '../../../styles/Login.module.css';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await apiClient.post(
        '/api/v1/auth/forgot-password',
        { phoneNumber },
        {
          'Content-Type': 'application/json',
        }
      );
    } catch (err) {
      setError(err?.data?.message || err.message || 'Forgot Password failed');
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
        <div className={styles.logoContainer}>
          <Image 
            src="/assets/nbs-logo.png" 
            alt='NBS LOGO'
            width={120} 
            height={60} 
            className={styles.logo}
            
          />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Forgot Password</h1>
          <p className={styles.subtitle}>Add your phone number</p>
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
            <label htmlFor="phoneNumber" className={styles.inputLabel}>Phone Number</label>
            <div className={styles.inputContainer}>
              <div className={styles.inputIcon}>
                <FiUser />
              </div>
              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={styles.inputField}
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>

          <div className={styles.options}>
            <a href="/auth/login" className={styles.forgotPassword}>
              Login
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
              </div>
            ) : (
              <>
                <FiLogIn className={styles.buttonIcon} />
                Reset Password
              </>
            )}
          </motion.button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Need assistance?{' '}
            <a href="/auth/contact-support" className={styles.footerLink}>
              Contact administrator
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}