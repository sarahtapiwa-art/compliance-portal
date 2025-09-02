"use client"
import React, { useEffect, useState } from 'react';
import Table from '../../_components/Table';
import '../../globals.css';
import { apiClient } from '../../_utils/apiClient';
import Notification from '../../_components/Notifications/page'

const columns = [
  { Header: '', accessor: 'auditId' },
  { Header: 'Action', accessor: 'action' },
  { Header: 'Details', accessor: 'details' },
  { Header: 'Date', accessor: 'actionDate' },
];


const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};



const AuditTrailPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/audit-trails`);
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







  const tableData = data.map(row => {
    const newRow = {};
    columns.forEach(col => {
      const key = typeof col.accessor === 'function' ? col.Header : col.accessor;
      newRow[key] = getCellValue(row, col.accessor);
    });
    return newRow;
  });

  const tableColumns = columns.map(col => ({
    Header: col.Header,
    accessor: typeof col.accessor === 'function' ? col.Header : col.accessor,
  }));

  return (
    <>
    <div>
      <h2>Audit Trail</h2>
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
      <Table exportFileName="auditTrail" columns={tableColumns} data={tableData} />
      </div>
    </>
  );
};

export default AuditTrailPage;
