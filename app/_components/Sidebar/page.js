"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  FiHome, 
  FiUsers, 
  FiFolder, 
  FiChevronRight,
  FiBook,
  FiDollarSign,
  FiFile,
  FiX,
  FiMenu,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiUserX,
  FiGrid,
  FiCalendar,
  FiFileText,
  FiRepeat
} from "react-icons/fi";
import "../../../styles/Sidenav.css";
import {jwtDecode} from 'jwt-decode';



const adminItems = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },

//   { 
//     name: "Payments", icon: FiDollarSign,
//     subItems: [
//       { name: "Transactions", href: "/admin/payments" },
//       { name: "Proof of Payments", href: "/admin/proof-of-payments" }
//     ]
//   },
];

const userItems = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "Departments", href: "/admin/department", icon: FiGrid },
  { name: "Return Definition", href: "/admin/return-definition", icon: FiRepeat },
  { name: "Schedule", href: "/admin/schedule", icon: FiCalendar },
  { name: "Submissions", href: "/admin/submissions", icon: FiFileText },
  { name: "Task Track", href: "/admin/task-track", icon: FiFileText },
  { name: "Notifications", href: "/admin/notifications", icon: FiBell },

  { name: "Users", href: "/admin/users", icon: FiUsers },

];


export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const role = decoded.roles?.[0];
        setUserRole(role);
      } catch (err) {
        // console.error('Invalid token:', err);
      }
    }
  }, []);
  

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const initialExpanded = {};
    (userRole === 'SUPER_SYSTEM_ADMIN' ? adminItems : userItems).forEach(item => {
      if (item.subItems) {
        initialExpanded[item.name] = item.subItems.some(
          subItem => pathname.startsWith(subItem.href)
        );
      }
    });
    setExpandedItems(initialExpanded);
  }, [pathname]);

  const toggleExpand = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };



  return (
    <>
      {loading && (
        <div className="route-loader-overlay">
          <div className="spinner-global" />
        </div>
      )}
      
      <button 
        className="mobile-menu-button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>
      
      {isMobileOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <nav className={`side-nav ${isMobileOpen ? 'open' : ''}`}>
        <ul className="side-nav-list">
        {(userRole === 'SUPER_SYSTEM_ADMIN' ? adminItems : userItems).map((item) => {
            const isActive = pathname.startsWith(item.href) || 
              (item.subItems && item.subItems.some(subItem => pathname.startsWith(subItem.href)));
            
            return (
              <li key={item.name} className={`side-nav-item ${isActive ? 'active' : ''}`}>
                {item.subItems ? (
                  <>
                    <div 
                      className="side-nav-link has-subitems"
                      onClick={() => toggleExpand(item.name)}
                    >
                      <span className="side-nav-icon">
                        <item.icon size={18} />
                      </span>
                      <span className="side-nav-text">{item.name}</span>
                      <span className="side-nav-arrow">
                        {expandedItems[item.name] ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    </div>
                    {expandedItems[item.name] && (
                      <ul className="submenu">
                        {item.subItems.map(subItem => {
                          const isSubActive = pathname.startsWith(subItem.href);
                          return (
                            <li 
                              key={subItem.name} 
                              className={`submenu-item ${isSubActive ? 'active' : ''}`}
                            >
                              <Link href={subItem.href} className="submenu-link">
                                <span className="submenu-icon">
                                  <FiChevronRight size={14} />
                                </span>
                                <span>{subItem.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link href={item.href} className="side-nav-link">
                    <span className="side-nav-icon">
                      <item.icon size={18} />
                    </span>
                    <span className="side-nav-text">{item.name}</span>
                    {isActive && (
                      <span className="side-nav-arrow">
                        <FiChevronRight size={14} />
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}