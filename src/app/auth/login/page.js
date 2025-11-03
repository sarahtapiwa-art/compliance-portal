"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLogIn, FiEye, FiEyeOff, FiUser, FiLock, FiMail } from 'react-icons/fi';
import styles from '../../../styles/Login.module.css';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Image from 'next/image';
import {jwtDecode} from 'jwt-decode';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post(
        '/api/auth/login',
        { username, password },
        {
          'Content-Type': 'application/json',
          'X-User-Agent': 'INTERNAL'
        }
      );
  
      const token = typeof response === 'string' ? response : response?.token;
  
      if (token) {
        sessionStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/;`;

        const decoded = jwtDecode(token);
        const authority = decoded.roles?.[0]; 
        if (authority == 'SUPER_SYSTEM_ADMIN' || 'USER' || 'ADMIN') {
          router.push('/dashboard');
        } 
  
      } else {
        setError('Login failed: No token received');
      }
  
    } catch (err) {
      setError(err?.data?.message || err.message || 'Login failed');
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
            priority
          />
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Compliance Portal</h1>
          <p className={styles.subtitle}>Sign in to your Compliance account</p>
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
            <label htmlFor="username" className={styles.inputLabel}>Username</label>
            <div className={styles.inputContainer}>
              <div className={styles.inputIcon}>
                <FiUser />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.inputField}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Password</label>
            <div className={styles.inputContainer}>
              <div className={styles.inputIcon}>
                <FiLock />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.inputField}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className={styles.options}>
            <a href="/auth/forgot-password" className={styles.forgotPassword}>
              Forgot Password?
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
                Sign In
              </>
            )}
          </motion.button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Need an account?{' '}
            <a href="/auth/contact-support" className={styles.footerLink}>
              Contact administrator
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}