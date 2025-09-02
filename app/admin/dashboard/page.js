// "use client";
// import { useEffect, useState } from "react";
// import { apiClient } from "../_utils/apiClient";
// import { 
//   LineChart, 
//   Line, 
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis, 
//   YAxis, 
//   Tooltip, 
//   CartesianGrid, 
//   ResponsiveContainer,
//   Legend 
// } from 'recharts';
// import { 
//   FiTrendingUp, 
//   FiDollarSign,
//   FiUsers,
//   FiHome
// } from 'react-icons/fi';
// import '../../../styles/Dashboard.css';

// export default function Dashboard() {
//   const [metrics, setMetrics] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     async function fetchMetrics() {
//       setLoading(true);
//       setError(null);
//       try {
//         const data = await apiClient.get("/api/v1/dashboards/metrics");
//         setMetrics(data);
//       } catch (err) {
//         setError(err.message || "Failed to load metrics");
//       } finally {
//         setLoading(false);
//       }
//     }
//     fetchMetrics();
//   }, []);

//   const formatPaymentData = () => {
//     if (!metrics?.currentMonthPaymentsByDay) return [];
//     return Object.entries(metrics.currentMonthPaymentsByDay).map(([date, amount]) => ({
//       date: new Date(date).getDate(),
//       amount
//     })).reverse();
//   };

//   const formatProductData = () => {
//     if (!metrics?.productTypeAgreementCounts) return [];
//     return Object.entries(metrics.productTypeAgreementCounts).map(([name, value]) => ({
//       name,
//       value
//     }));
//   };

//   const COLORS = ['#006834', '#00C49F', '#FFBB28'];

//   if (loading) return <div className="loading">Loading...</div>;
//   if (error) return <div className="error">Error: {error}</div>;
//   if (!metrics) return <div className="empty">No data</div>;

//   return (
//     <div className="dashboard">
//       <h1>Dashboard</h1>

//       <div className="metrics">
//         <div className="metric">
//           <FiTrendingUp className="icon" />
//           <div>
//             <h3>Active Agreements</h3>
//             <p className="value">{metrics.totalActiveAgreements}</p>
//             <p className="subtext">{metrics.productGrowthRatePercentage}% growth</p>
//           </div>
//         </div>

//         <div className="metric">
//           <FiDollarSign className="icon" />
//           <div>
//             <h3>Loan Book</h3>
//             <p className="value">${metrics.totalLoanBookValue.toLocaleString()}</p>
//             <p className="subtext">${metrics.totalOverdueAmount.toLocaleString()} overdue</p>
//           </div>
//         </div>

//         <div className="metric">
//           <FiUsers className="icon" />
//           <div>
//             <h3>Clients</h3>
//             <p className="value">{metrics.totalClients}</p>
//             <p className="subtext">{metrics.clientGrowthRatePercentage}% growth</p>
//           </div>
//         </div>

//         <div className="metric">
//           <FiHome className="icon" />
//           <div>
//             <h3>Stands</h3>
//             <p className="value">{metrics.totalStands}</p>
//             <p className="subtext">{metrics.availableStands} available</p>
//           </div>
//         </div>
//       </div>
      
//       <div className="side-by-side-charts">
//         <div className="chart-row">
//           <h3>Product Distribution</h3>
//           <div className="chart-container">
//             <ResponsiveContainer width="100%" height={200}>
//               <PieChart>
//                 <Pie
//                   data={formatProductData()}
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={60}
//                   dataKey="value"
//                   label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
//                 >
//                   {formatProductData().map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Tooltip />
//                 <Legend wrapperStyle={{ fontSize: '12px' }} />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="chart-row">
//           <h3>Stands Allocation</h3>
//           <div className="chart-container">
//             <ResponsiveContainer width="100%" height={200}>
//               <BarChart data={[
//                 { name: 'Allocated', value: metrics.allocatedStands },
//                 { name: 'Available', value: metrics.availableStands }
//               ]}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="name" tick={{ fontSize: 10 }} />
//                 <YAxis tick={{ fontSize: 10 }} />
//                 <Tooltip />
//                 <Bar dataKey="value" fill="#006834" radius={[2, 2, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       <div className="chart-row">
//         <h3>Monthly Payments</h3>
//         <div className="chart-container">
//           <ResponsiveContainer width="100%" height={200}>
//             <LineChart data={formatPaymentData()}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//               <XAxis dataKey="date" tick={{ fontSize: 10 }} />
//               <YAxis tick={{ fontSize: 10 }} />
//               <Tooltip />
//               <Line 
//                 type="monotone" 
//                 dataKey="amount" 
//                 stroke="#006834" 
//                 strokeWidth={2}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>



//     </div>
//   );
// }