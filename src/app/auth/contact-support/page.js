"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLogIn } from 'react-icons/fi';
import styles from '../../../styles/ContactSupport.module.css';
import Head from 'next/head';
import { useRouter } from 'next/navigation';

export default function ContactSupportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  return (
      <>
        <Head>
          <title>Contact Support | Portal</title>
        </Head>
        <div className={styles.container}>
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={styles.card}
          >
            <div className={styles.header}>
              <h1 className={styles.title}>Contact Support</h1>
              <p className={styles.subtitle}>We are here to help with any questions or issues</p>
            </div>

            <div className={styles.contactInfo}>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <FiMail />
                </div>
                <div>
                  <h3>Email Us</h3>
                  <p><a href="mailto:sarahtapiwa@gmail.com">sarahtapiwa@gmail.com</a></p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h3>Call Us</h3>
                  <p><a href="tel:+263786239240">+263 786 239 240</a></p>
                </div>
              </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                disabled={isSubmitting}
                className={styles.submitButton}
                onClick={() => router.push('/auth/login')}
            >
              <>
                <FiLogIn className={styles.buttonIcon} />
                Back to Login
              </>
            </motion.button>

          </motion.div>
        </div>
      </>
  );
}