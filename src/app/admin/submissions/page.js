"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';

const columns = [
  { Header: 'Report Title', accessor: (row) => row.returnDefinition?.title || 'N/A' },
  { Header: 'Regulatory Body', accessor: (row) => row.returnDefinition?.regulatoryBody || 'N/A' },
  { Header: 'Period Start', accessor: (row) => new Date(row.periodStart).toLocaleDateString() },
  { Header: 'Period End', accessor: (row) => new Date(row.periodEnd).toLocaleDateString() },
  { Header: 'Due Date', accessor: (row) => new Date(row.dueAt).toLocaleDateString() },
  { Header: 'Department', accessor: (row) => row.returnDefinition?.department?.departmentName || 'N/A' },
  { Header: 'Status', accessor: 'status' },
];

const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const STATUS = ["PENDING", "UPLOADED", "SUBMITTED", "OVERDUE", "CLOSED"].map(l => ({
  label: l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
  value: l
}));

const SubmissionsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnDefinitions, setReturnDefinitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSubmission, setEditSubmission] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const router = useRouter();

  const fields = [
    { label: 'Return Definition', name: 'returnDefinitionId', required: true, type: 'select', options: returnDefinitions },
    { label: 'Start Date', name: 'periodStart', required: true, type: 'date' },
    { label: 'End Date', name: 'periodEnd', required: true, type: 'date' },
    { label: 'Due At', name: 'dueAt', required: true, type: 'date' },
    { label: 'Status', name: 'status', required: true, type: 'select', options: STATUS },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/submissions`);
      setData(res.content || []);
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnDefinitions = async () => {
    try {
      const res = await apiClient.get('/api/v1/return-definition', { 
        params: { page: 0, size: 100 } 
      });
      const definitionOptions = res.content.map(definition => ({
        label: `${definition.title} (${definition.regulatoryBody})`,
        value: definition.id
      }));
      setReturnDefinitions(definitionOptions);
    } catch (err) {
      setError('Failed to fetch return definitions');
      setShowNotification(true);
    }
  };

  useEffect(() => {
    fetchData();
    fetchReturnDefinitions();
  }, []);

  const handleEdit = (row) => {
    if (!row.original.id) return;
    setEditSubmission(row.original);
    setShowForm(true);
  };

  const handleView = (row) => {
    if (!row.original.id) return;
    router.push(`/admin/submissions/${row.original.id}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await apiClient.delete(`/api/v1/submissions/${id}`);
        setSuccessMessage('Submission deleted successfully.');
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 10000);
        await fetchData();
      } catch (err) {
        setError(err.message);
        setShowNotification(true);
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editSubmission) {
        if (!editSubmission.id) return; 
        await apiClient.put(`/api/v1/submissions/${editSubmission.id}`, formData);
        setSuccessMessage('Submission updated successfully.');
      } else {
        await apiClient.post(`/api/v1/submissions`, formData);
        setSuccessMessage('Submission created successfully.');
      }
      setShowForm(false);
      setEditSubmission(null);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 10000);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    }
  };

  const tableData = data.map(row => {
    const newRow = {};
    columns.forEach(col => {
      const key = col.Header.replace(/\s+/g, '_').toLowerCase();
      newRow[key] = getCellValue(row, col.accessor);
    });
    return { ...newRow, original: row }; 
  });

  const tableColumns = [
    ...columns.map(col => ({
      Header: col.Header,
      accessor: col.Header.replace(/\s+/g, '_').toLowerCase(),
    })),
   
  ];

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: '#ffc107',
      UPLOADED: '#17a2b8',
      SUBMITTED: '#28a745',
      OVERDUE: '#dc3545',
      CLOSED: '#6c757d'
    };
    
    return (
      <span 
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: statusColors[status] || '#6c757d',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {status}
      </span>
    );
  };

  const formattedTableData = tableData.map(row => ({
    ...row,
    status: getStatusBadge(row.status)
  }));

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Submissions</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => setShowForm(true)}
          className="create-button"
        >
          Add Submission
        </button>
      </div>

      {showForm && (
        <CreateForm
          title={editSubmission ? "Update Submission" : "Add Submission"}
          fields={fields}
          onSubmit={handleFormSubmit}
          buttonLabel={editSubmission ? "Update Submission" : "Create Submission"}
          onCancel={() => { setShowForm(false); setEditSubmission(null); }}
          initialValues={editSubmission || {}}
        />
      )}

      {showNotification && error && (
        <Notification
          message={`Error: ${error}`}
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading submissions...</div>
      ) : error ? (
        <div style={{ color: '#dc3545', textAlign: 'center', padding: '20px' }}>Error loading data: {error}</div>
    
      ) : (
<Table 
  exportFileName="Submissions" 
  columns={tableColumns} 
  data={formattedTableData} 
  onView={handleView}
  showViewButton={(row) => row.original.status === "SUBMITTED"}
/>
      )}
    </div>
  );
};

export default SubmissionsPage;