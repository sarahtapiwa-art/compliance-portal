"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';

const columns = [
  { Header: 'Return Definition', accessor: (row) => row.returnDefinition?.title || 'N/A' },
  { Header: 'Regulatory Body', accessor: (row) => row.returnDefinition?.regulatoryBody || 'N/A' },
  { Header: 'Frequency', accessor: (row) => row.returnDefinition?.frequency || 'N/A' },
  { Header: 'Department', accessor: (row) => row.returnDefinition?.department?.departmentName || 'N/A' },
  { Header: 'Remind Days Before', accessor: 'remindDaysBefore' },
  { Header: 'Escalated After (Hours)', accessor: 'escalateAfterHours' },
  { Header: 'Escalation Email', accessor: 'escalationEmail' },
];

const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const SchedulePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnDefinitions, setReturnDefinitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const router = useRouter();

  const fields = [
    { label: 'Return Definition', name: 'returnDefinitionId', required: true, type: 'select', options: returnDefinitions },
    { label: 'Remind days before (CSV)', name: 'remindDaysBefore', required: true, type: 'text', placeholder: 'e.g., 1,3,7' },
    { label: 'Escalate After (Hours)', name: 'escalateAfterHours', required: true, type: 'number' },
    { label: 'Escalation Email', name: 'escalationEmail', required: true, type: 'email' },  
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/schedule-rule`);
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

  const handleFormSubmit = async (formData) => {
    try {
      if (editSchedule) {
        if (!editSchedule.id) return; 
        await apiClient.put(`/api/v1/schedule-rule/${editSchedule.id}`, formData);
        setSuccessMessage('Schedule Rule updated successfully.');
      } else {
        await apiClient.post(`/api/v1/schedule-rule`, formData);
        setSuccessMessage('Schedule Rule created successfully.');
      }
      setShowForm(false);
      setEditSchedule(null);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 10000);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    }
  };

  const handleEdit = (row) => {
    setEditSchedule(row);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule rule?')) {
      try {
        await apiClient.delete(`/api/v1/schedule-rule/${id}`);
        setSuccessMessage('Schedule Rule deleted successfully.');
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 10000);
        await fetchData();
      } catch (err) {
        setError(err.message);
        setShowNotification(true);
      }
    }
  };

  const tableData = data.map(row => {
    const newRow = {};
    columns.forEach(col => {
      const key = col.Header.replace(/\s+/g, '_').toLowerCase();
      newRow[key] = getCellValue(row, col.accessor);
    });
    return { ...newRow, original: row }; // Keep original data for actions
  });

  const tableColumns = [
    ...columns.map(col => ({
      Header: col.Header,
      accessor: col.Header.replace(/\s+/g, '_').toLowerCase(),
    })),
    {
      Header: 'Actions',
      accessor: 'actions',
      Cell: ({ row }) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => handleEdit(row.original)}
            className="edit-button"
            style={{ padding: '4px 8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(row.original.id)}
            className="delete-button"
            style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Delete
          </button>
        </div>
      ),
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Schedule Rule Management</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => setShowForm(true)}
          className="create-button"
        >
          Add Schedule Rule
        </button>
      </div>

      {showForm && (
        <CreateForm
          title={editSchedule ? "Update Schedule Rule" : "Add Schedule Rule"}
          fields={fields}
          onSubmit={handleFormSubmit}
          buttonLabel={editSchedule ? "Update Schedule Rule" : "Create Schedule Rule"}
          onCancel={() => { setShowForm(false); setEditSchedule(null); }}
          initialValues={editSchedule || {}}
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
        <div>Loading schedule rules...</div>
      ) : (
        <Table 
          exportFileName="Schedule_Rules" 
          columns={tableColumns} 
          data={tableData} 
        />
      )}
    </div>
  );
};

export default SchedulePage;