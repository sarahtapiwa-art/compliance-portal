"use client"
import React, { useEffect, useState } from 'react';
import Table from '../../_components/Table';
import '../../globals.css';
import { apiClient } from '../../_utils/apiClient';
import Notification from '../../_components/Notifications/page'

const columns = [
    { 
      Header: 'Status', 
      accessor: row => row.completed ? 'Completed' : row.submission.status,
      id: 'status'
    },
    { Header: 'Return Title', accessor: 'submission.returnDefinition.title' },
    { Header: 'Regulatory Body', accessor: 'submission.returnDefinition.regulatoryBody' },
    { Header: 'Assigned To', accessor: 'userEmail' },
    { Header: 'Period Start', accessor: 'submission.periodStart' },
    { Header: 'Period End', accessor: 'submission.periodEnd' },
    { Header: 'Due Date', accessor: 'submission.dueAt' },
    { Header: 'Completed At', accessor: 'completedAt' },
  ];

  const getCellValue = (row, accessor) => {
    if (typeof accessor === 'function') return accessor(row);
    
    // Handle nested properties
    if (typeof accessor === 'string' && accessor.includes('.')) {
      const properties = accessor.split('.');
      let value = row;
      for (const prop of properties) {
        value = value?.[prop];
        if (value === undefined || value === null) break;
      }
      return value ?? '';
    }
    
    return row?.[accessor] ?? '';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const TaskTrackPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showNotification, setShowNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'
  
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/v1/task-track`);
        setData(res.content || []);
      } catch (err) {
        setError(err.message);
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchData();
    }, []);
  
    // Filter data based on selected filter
    const filteredData = data.filter(item => {
      if (filter === 'completed') return item.completed;
      if (filter === 'pending') return !item.completed;
      return true;
    });
  
    // Prepare table data with formatted dates
    const tableData = filteredData.map(row => {
      const newRow = {};
      columns.forEach(col => {
        const key = col.id || (typeof col.accessor === 'function' ? col.Header : col.accessor);
        let value = getCellValue(row, col.accessor);
        
        // Format date fields
        if (key.includes('Start') || key.includes('End') || key.includes('Due') || key.includes('Completed')) {
          value = formatDate(value);
        }
        
        newRow[key] = value;
      });
      return newRow;
    });
  
    const tableColumns = columns.map(col => ({
      Header: col.Header,
      accessor: col.id || (typeof col.accessor === 'function' ? col.Header : col.accessor),
    }));
    
    
    return (
    <>
    <div>
      <h2>Task Track</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>

</div>
      {showNotification && error && (
        <Notification
          message={`Error loading clients: ${error}`}
          type="error"
          onClose={() => setShowNotification(false)}
        />
      )}
      {showSuccessNotification && successMessage && (
        <Notification
          message={successMessage}
          type="success"
          onClose={() => setShowSuccessNotification(false)}
          duration={10000}
        />
      )}
      <Table exportFileName="taskTrack" columns={tableColumns} data={tableData} />
      </div>
    </>
  );
};

export default TaskTrackPage;
