"use client";
import Link from "next/link";
import { FiUser, FiLogOut, FiMenu, FiLock } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../../../styles/Topnav.css";
import { apiClient } from "../../_utils/apiClient";
import {jwtDecode} from 'jwt-decode';

export default function TopNav() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [decodedToken, setDecodedToken] = useState(null); 
  const [data, setData] = useState([]); 
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null); 
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('token');
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.push('/auth/login');
    } catch (error) {
      setError(error.message); 
    }
  };

  const handleChangePassword = async () => {
      router.push('auth/reset-password');
  }
  
  const fetchData = async () => {
    try {
      const response = await apiClient.getAccessToken();
      if (response) {
        const tokenData = jwtDecode(response);
        setDecodedToken(tokenData);
        const extractedUsername = tokenData.sub;
        setUsername(extractedUsername);
        setData(response.content || []);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  useEffect(() => {
    fetchData();
        return () => {
    };
  }, []);


  return (
    <header className="top-nav">
      <div className="nav-container">
        <div className="nav-left">
          <button 
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <FiMenu size={24} />
          </button>
          <Link href="/dashboard" className="logo">
            <span className="logo-highlight">Compliance</span>
          </Link>
        </div>

        <div className="nav-right">
          <div className="user-dropdown">
            <div className="user-avatar">
              {username.charAt(0) || <FiUser size={18} />}
            </div>
            <span className="user-name">{username || "User"}</span>
            <div className="dropdown-content">
            <button onClick={handleChangePassword} className="dropdown-item">
                <FiLock size={16} />
                <span>Reset Password</span>
              </button>
              <button onClick={handleLogout} className="dropdown-item">
                <FiLogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}