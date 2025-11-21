"use client"
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {useParams, useRouter, useSearchParams} from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page';
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';
import '../../../styles/Submissions.css';
import {jwtDecode} from "jwt-decode";

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

// Status badge component with custom styling
const StatusBadge = ({ status }) => {
    const getStatusStyles = (status) => {
        const baseStyles = {
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'capitalize',
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '80px'
        };

        switch (status?.toUpperCase()) {
            case 'OVERDUE':
                return {
                    ...baseStyles,
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fecaca'
                };
            case 'PENDING':
                return {
                    ...baseStyles,
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    border: '1px solid #fcd34d'
                };
            case 'SUBMITTED':
                return {
                    ...baseStyles,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0'
                };
            case 'UPLOADED':
                return {
                    ...baseStyles,
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    border: '1px solid #93c5fd'
                };
            case 'CLOSED':
                return {
                    ...baseStyles,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: '1px solid #d1d5db'
                };
            default:
                return {
                    ...baseStyles,
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #e5e7eb'
                };
        }
    };

    const styles = getStatusStyles(status);

    return (
        <span style={styles}>
            {status?.replace('_', ' ')}
        </span>
    );
};

// Status badge for title with larger styling
const TitleStatusBadge = ({ status }) => {
    const getStatusStyles = (status) => {
        const baseStyles = {
            padding: '6px 16px',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'capitalize',
            display: 'inline-block',
            textAlign: 'center',
            marginLeft: '12px',
            verticalAlign: 'middle'
        };

        switch (status?.toUpperCase()) {
            case 'OVERDUE':
                return {
                    ...baseStyles,
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '2px solid #fecaca'
                };
            case 'PENDING':
                return {
                    ...baseStyles,
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    border: '2px solid #fcd34d'
                };
            case 'SUBMITTED':
                return {
                    ...baseStyles,
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    border: '2px solid #a7f3d0'
                };
            case 'UPLOADED':
                return {
                    ...baseStyles,
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    border: '2px solid #93c5fd'
                };
            case 'CLOSED':
                return {
                    ...baseStyles,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: '2px solid #d1d5db'
                };
            default:
                return {
                    ...baseStyles,
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb'
                };
        }
    };

    const styles = getStatusStyles(status);

    return (
        <span style={styles}>
            {status?.replace('_', ' ')}
        </span>
    );
};

const SubmissionStatus = () => {
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
    const [userData, setUserData] = useState(null);

    // Function to generate dynamic title based on active filters
    const getSubmissionsTitle = () => {
        const activeFilters = [];

        if (statusFilter) {
            const statusLabel = STATUS.find(s => s.value === statusFilter)?.label || statusFilter;
            activeFilters.push(statusLabel);
        }

        if (frequencyFilter) {
            activeFilters.push(frequencyFilter);
        }

        if (departmentFilter) {
            activeFilters.push(departmentFilter);
        }

        if (activeFilters.length === 0) {
            return "All Submissions";
        }

        return `Submissions - ${activeFilters.join(', ')}`;
    };

    // Function to render title with styled status
    const renderSubmissionsTitle = () => {
        const activeFilters = [];

        if (statusFilter) {
            const statusLabel = STATUS.find(s => s.value === statusFilter)?.label || statusFilter;
            activeFilters.push({ type: 'status', value: statusLabel });
        }

        if (frequencyFilter) {
            activeFilters.push({ type: 'frequency', value: frequencyFilter });
        }

        if (departmentFilter) {
            activeFilters.push({ type: 'department', value: departmentFilter });
        }

        if (activeFilters.length === 0) {
            return <span>All Submissions</span>;
        }

        return (
            <span>
                Submissions -
                {activeFilters.map((filter, index) => (
                    <span key={index}>
                        {filter.type === 'status' ? (
                            <TitleStatusBadge status={filter.value} />
                        ) : (
                            <span
                                style={{
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    marginLeft: '8px',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                {filter.value}
                            </span>
                        )}
                        {index < activeFilters.length - 1 && ', '}
                    </span>
                ))}
            </span>
        );
    };

    const fields = [
        { label: 'Return Definition', name: 'returnDefinitionId', required: true, type: 'select', options: returnDefinitions.map(p => ({ label: p.title, value: p.id }))},
        { label: 'Start Date', name: 'periodStart', required: true, type: 'date' },
        { label: 'End Date', name: 'periodEnd', required: true, type: 'date' },
        { label: 'Due At', name: 'dueAt', required: true, type: 'date' },
        { label: 'Status', name: 'status', required: true, type: 'select', options: STATUS },
    ];

    // Get user data on component mount
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserData(decoded);
                console.log('User Data:', decoded);
                console.log('User Role:', decoded.roles?.[0]);
                console.log('User Department:', decoded.department?.departmentName);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }
    }, []);

    // Use useCallback to memoize fetchData
    const fetchData = useCallback(async (returnDefinitionId = null) => {
        setLoading(true);
        setError(null);

        try {
            const urlParams = Object.fromEntries(searchParams.entries());
            const params = new URLSearchParams();

            Object.entries(urlParams).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            // Only append user's department if NOT super admin and department exists
            if (userData?.roles?.[0] !== "ROLE_SUPER_SYSTEM_ADMIN") {
                const deptName = userData?.department?.departmentName;
                if (deptName) {
                    params.append('departmentName', deptName);
                    console.log('Filtering by Department:', deptName);
                } else {
                    console.log('No department found for user');
                }
            } else {
                console.log('Super admin - showing all departments');
            }

            if (returnDefinitionId) {
                params.append('returnDefinitionId', returnDefinitionId);
            }

            const queryString = params.toString();
            console.log('API Request URL:', `/api/v1/submissions?${queryString}`);

            const res = await apiClient.get(`/api/v1/submissions?${queryString}`);
            setData(res.content || []);

            // Debug: Check what data we received
            console.log('Received data:', res.content);
            if (res.content && res.content.length > 0) {
                console.log('Departments in received data:',
                    res.content.map(item => item.returnDefinition?.department?.departmentName)
                );
            }

        } catch (err) {
            setError(err.message || 'Something went wrong');
            setShowNotification(true);
        } finally {
            setLoading(false);
        }
    }, [userData, searchParams]); // Add dependencies

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

    // Fetch data when userData is available
    useEffect(() => {
        if (userData !== null) { // Only fetch when userData is loaded (even if null)
            fetchData();
            fetchReturns();
        }
    }, [userData, fetchData]); // Add fetchData to dependencies

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
        // Use the new StatusBadge component for status column
        if (newRow.status) {
            newRow.status = <StatusBadge status={newRow.status} />;
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
            {/* Updated h2 with styled status badge */}
            <h2 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                {renderSubmissionsTitle()}
            </h2>

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

export default SubmissionStatus;