"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../_utils/apiClient";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClipboard
} from 'react-icons/fi';
import '../../styles/Dashboard.css';

export default function Dashboard() {
  const router = useRouter();
  const [completionData, setCompletionData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [overviewData, setOverviewData] = useState(null);
  const [upcomingData, setUpcomingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7); 

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(false);
      console.log('Loading dashboard', loading);
      setError(null);
      try {
        const [completionRes, overdueRes, overviewRes, upcomingRes] = await Promise.all([
          apiClient.get("/api/v1/dashboard/completion-rate"),
          apiClient.get("/api/v1/dashboard/overdue"),
          apiClient.get("/api/v1/dashboard/overview"),
          apiClient.get(`/api/v1/dashboard/upcoming?days=${days}`)
        ]);
        
        setCompletionData(completionRes);
        setOverdueData(Array.isArray(overdueRes) ? overdueRes : [overdueRes]);
        setOverviewData(overviewRes);
        setUpcomingData(Array.isArray(upcomingRes) ? upcomingRes : [upcomingRes]);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [days]);

  const formatCompletionData = () => {
    return completionData.map(item => ({
      department: item.department,
      rate: item.completionRate * 100 
    }));
  };

  const COLORS = ['#006834', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const goTo = (path) => router.push(path);

  const handleMetricClick = (type) => {
    if (type === 'total') return goTo('/admin/submissions');
    if (type === 'completed') return goTo('/admin/submissions?status=SUBMITTED');
    if (type === 'overdue') return goTo('/admin/submissions?status=OVERDUE');
    if (type === 'upcoming') return goTo(`/admin/submissions?dueWithin=${days}`);
  };

  const handleUpcomingClick = (item) => {
    if (item?.id) return goTo(`/admin/submissions/${item.id}`);
    const query = encodeURIComponent(item?.title || '');
    return goTo(`/admin/submissions?search=${query}`);
  };

  const handleOverdueClick = (item) => {
    if (item?.id) return goTo(`/admin/submissions/${item.id}`);
    const params = new URLSearchParams();
    if (item?.title) params.set('search', item.title);
    params.set('status', 'overdue');
    if (item?.department) params.set('department', item.department);
    return goTo(`/admin/submissions?${params.toString()}`);
  };

  const handleDepartmentBarClick = (department) => {
    if (!department) return;
    return goTo(`/admin/submissions?department=${encodeURIComponent(department)}`);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <div className="loading-container">
          <div className="loader">
            <div className="loader-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>

        </div>
      </div>
    );
  }

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Compliance Dashboard</h1>

      {overviewData && !loading  ? (
        <div className="metrics">
          <div className="metric metric-total clickable" onClick={() => handleMetricClick('total')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('total')}>
            <FiClipboard className="icon" />
            <div>
              <h3>Total Submissions</h3>
              <p className="value">{overviewData.totalSubmissions}</p>
            </div>
          </div>

          <div className="metric metric-completed clickable" onClick={() => handleMetricClick('completed')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('completed')}>
            <FiCheckCircle className="icon" />
            <div>
              <h3>Completed</h3>
              <p className="value">{overviewData.completedSubmissions}</p>
              <p className="subtext">{overviewData.completionRate}% completion rate</p>
            </div>
          </div>

          <div className="metric metric-overdue clickable" onClick={() => handleMetricClick('overdue')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('overdue')}>
            <FiAlertTriangle className="icon" />
            <div>
              <h3>Overdue</h3>
              <p className="value">{overviewData.overdueSubmissions}</p>
            </div>
          </div>

          <div className="metric metric-upcoming clickable" onClick={() => handleMetricClick('upcoming')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('upcoming')}>
            <FiCalendar className="icon" />
            <div>
              <h3>Upcoming</h3>
              <p className="value">{overviewData.upcomingSubmissions}</p>
              <div className="days-selector">
                <label>Next </label>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : (
          <div className="metrics">
            <div className="metric metric-total clickable" onClick={() => handleMetricClick('total')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('total')}>
              <FiClipboard className="icon" />
              <div>
                <h3>Total Submissions</h3>
                <div className="flex items-center justify-center gap-2 p-4">
                  {/* Option A - More explicit Tailwind */}
                  <div
                      className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  {/*<span className="text-gray-600">Loading data...</span>*/}
                  <div className="dot-spinner">
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric metric-completed clickable" onClick={() => handleMetricClick('completed')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('completed')}>
              <FiCheckCircle className="icon" />
              <div>
                <h3>Completed</h3>
                <div className="flex items-center justify-center gap-2 p-4">
                  {/* Option A - More explicit Tailwind */}
                  <div
                      className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  {/*<span className="text-gray-600">Loading data...</span>*/}
                  <div className="dot-spinner">
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric metric-overdue clickable" onClick={() => handleMetricClick('overdue')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('overdue')}>
              <FiAlertTriangle className="icon" />
              <div>
                <h3>Overdue</h3>
                <div className="flex items-center justify-center gap-2 p-4">
                  {/* Option A - More explicit Tailwind */}
                  <div
                      className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  {/*<span className="text-gray-600">Loading data...</span>*/}
                  <div className="dot-spinner">
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric metric-upcoming clickable" onClick={() => handleMetricClick('upcoming')} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick('upcoming')}>
              <FiCalendar className="icon" />
              <div>
                <h3>Upcoming</h3>
                <div className="flex items-center justify-center gap-2 p-4">
                  {/* Option A - More explicit Tailwind */}
                  <div
                      className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  {/*<span className="text-gray-600">Loading data...</span>*/}
                  <div className="dot-spinner">
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                    <div className="dot-spinner__dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

            {/* Upcoming Submissions */}
            <div className="chart-row chart-upcoming">
        <h3>Upcoming Submissions (Next {days} Days)</h3>
        <div className="data-list">
          {upcomingData.length > 0 ? (
            upcomingData.map((item, index) => (
              <div key={index} className="data-item" onClick={() => handleUpcomingClick(item)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleUpcomingClick(item)}>
                <h4>{item.title}</h4>
                <p><strong>Department:</strong> {item.department}</p>
                <p><strong>Due:</strong> {new Date(item.dueAt).toLocaleDateString()}</p>
                <p><strong>Period:</strong> {item.periodLabel}</p>
              </div>
            ))
          ) : (
            <p className="no-data">No upcoming submissions in the next {days} days</p>
          )}
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="side-by-side-charts">
        {/* Completion Rate by Department */}
        <div className="chart-row chart-completion">
          <h3>Completion Rate by Department</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatCompletionData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => [`${value}%`, "Completion Rate"]} />
                <Bar dataKey="rate" name="Completion Rate">
                  {formatCompletionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor="pointer" onClick={() => handleDepartmentBarClick(entry.department)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Submissions */}
        <div className="chart-row chart-overdue">
          <h3>Overdue Submissions</h3>
          <div className="data-list">
            {overdueData.length > 0 ? (
              overdueData.map((item, index) => (
                <div key={index} className="data-item-overdue" onClick={() => handleOverdueClick(item)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOverdueClick(item)}>
                  <h4>{item.title}</h4>
                  <p><strong>Department:</strong> {item.department}</p>
                  <p><strong>Due:</strong> {new Date(item.dueAt).toLocaleDateString()}</p>
                  <p><strong>Period:</strong> {item.periodLabel}</p>
                </div>
              ))
            ) : (
              <p className="no-data">No overdue submissions</p>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}