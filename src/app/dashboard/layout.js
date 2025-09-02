import TopNav from '../_components/TopNav/page';
import SideNav from '../_components/Sidebar/page';
import '../globals.css';

export default function DashboardLayout({ children }) {
  return (
    
    <div className="app-layout">
      <TopNav />
      <div className="app-container">
        <SideNav />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
} 