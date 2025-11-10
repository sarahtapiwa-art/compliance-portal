"use client"
import React, { useEffect, useMemo, useState } from 'react';
import {useParams, useRouter, useSearchParams} from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page';
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';
import '../../../styles/Submissions.css';

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

const SubmissionsContent = () => {
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
  const searchParams = useSearchParams();
  const status = searchParams.get('status'); // This will be "overdue"
  const [statusFilter, setStatusFilter] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const fields = [
    { label: 'Return Definition', name: 'returnDefinitionId', required: true, type: 'select', options: returnDefinitions.map(p => ({ label: p.title, value: p.id }))},
    { label: 'Start Date', name: 'periodStart', required: true, type: 'date' },
    { label: 'End Date', name: 'periodEnd', required: true, type: 'date' },
    { label: 'Due At', name: 'dueAt', required: true, type: 'date' },
    { label: 'Status', name: 'status', required: true, type: 'select', options: STATUS },
  ];

  const fetchData = async (returnDefinitionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const urlParams = Object.fromEntries(searchParams.entries());

      const params = new URLSearchParams();

      // Add all parameters from URL
      Object.entries(urlParams).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add additional parameters
      if (returnDefinitionId) {
        params.append('returnDefinitionId', returnDefinitionId);
      }

      const res = await apiClient.get(`/api/v1/submissions?${params.toString()}`);
      setData(res.content || []);
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    try {      
      const res = await apiClient.get(`/api/v1/return-definition`);
      setReturnDefinitions(res.content || []);
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchReturns();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    const department = searchParams.get('department') || searchParams.get('departmentName');
    if (status) setStatusFilter(status);
    if (department) setDepartmentFilter(department);
  }, [searchParams]);

  const handleView = (row) => {
    if (!row.original.id) return;
    router.push(`/admin/submissions/${row.original.id}`);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editSubmission) {
        if (!editSubmission.id) return; 
        await apiClient.put(`/api/v1/submissions/${editSubmission.id}`, formData);
        setSuccessMessage('Submission updated successfully.');
      } else {
        const { returnDefinitionId, ...submissionData } = formData;
        await apiClient.post(`/api/v1/submissions?returnDefinitionId=${returnDefinitionId}`, submissionData);
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

  const uniqueFrequencies = useMemo(() => {
    const setVals = new Set((data || []).map(r => r.returnDefinition?.frequency).filter(Boolean));
    return Array.from(setVals);
  }, [data]);

  const uniqueDepartments = useMemo(() => {
    const setVals = new Set((data || []).map(r => r.returnDefinition?.department?.departmentName).filter(Boolean));
    return Array.from(setVals);
  }, [data]);

  const filteredData = useMemo(() => {
    return (data || []).filter(r => {
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchFrequency = !frequencyFilter || r.returnDefinition?.frequency === frequencyFilter;
      const matchDepartment = !departmentFilter || r.returnDefinition?.department?.departmentName === departmentFilter;
      return matchStatus && matchFrequency && matchDepartment;
    });
  }, [data, statusFilter, frequencyFilter, departmentFilter]);

  const tableData = filteredData.map(row => {
    const newRow = {};
    columns.forEach(col => {
      const key = col.Header.replace(/\s+/g, '_').toLowerCase();
      newRow[key] = getCellValue(row, col.accessor);
    });
    if (newRow.status) {
      newRow.status = (
        <span className={`status-badge status-${newRow.status.toLowerCase().replace('_', '-')}`}>
          {newRow.status.replace('_', ' ')}
        </span>
      );
    }
    return { ...newRow, original: row }; 
  });

  const tableColumns = [
    ...columns.map(col => ({
      Header: col.Header,
      accessor: col.Header.replace(/\s+/g, '_').toLowerCase(),
    })),
  ];

  const formattedTableData = tableData.map(row => ({
    ...row,
  }));

  return (
    <div className="submissions-page">
      <h2>Submissions</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => setShowForm(true)}
          className="create-button"
        >
          Add Submission
        </button>
      </div>

      <div className="filters-card">
        <div className="filters-group">
          <div className="filter">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label>Frequency</label>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
            >
              <option value="">All Frequencies</option>
              {uniqueFrequencies.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="filter">
            <label>Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {uniqueDepartments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-actions">
          <button
            onClick={() => { setStatusFilter(''); setFrequencyFilter(''); setDepartmentFilter(''); }}
            className="export-button"
          >
            Clear Filters
          </button>
        </div>
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

      <Table 
        exportFileName="Submissions" 
        columns={tableColumns} 
        data={formattedTableData} 
        onView={handleView}
        showSearch={false}
        loading={loading}
        showViewButton={(row) => row.original.status === "SUBMITTED"}
      />
    </div>
  );
};

export default SubmissionsContent;