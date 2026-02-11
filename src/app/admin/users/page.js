"use client"
import React, {useCallback, useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';

const columns = [
  { Header: 'Username', accessor: 'username' },
  { Header: 'Email', accessor: 'email' },
  { Header: 'Roles', accessor: 'roles' },
];


const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const ROLE_OPTIONS = ["ADMIN","USER"].map(l => ({
    label: l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: l
  }));





const UserPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [editUser, seteditUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

    const fetchData= useCallback(async (requestedPage = page, requestedPageSize = pageSize) =>{
      setLoading(true);
      setError(null);
      const apiPage = Math.max(0, Number(requestedPage) - 1);
      const apiSize = Number(requestedPageSize);
      try {
        const res = await apiClient.get(`/api/auth/users?page=${apiPage}&size=${apiSize}`);
        setData(res.content || []);
        const total = res?.page?.totalElements || res?.totalElements || res?.total;
        setTotalElements(typeof total === 'number' ? total : (res?.content || []).length);
      } catch (err) {
        setError(err.message);
        setShowNotification(true);
      } finally {
        setLoading(false);
      }
    },[page, pageSize]);

    useEffect(() => {
      fetchData(page, pageSize);
    }, [fetchData, page, pageSize]);

  const getFields = () =>[
    { label: 'Username', name: 'username', required: true },
    { label: 'Email', name: 'email', required: true},
    { label: 'Roles', name: 'roles', required: true, type: 'select', options: ROLE_OPTIONS },
    {
      label: 'Department',
      name: 'responsibleDepartmentId',
      required: true,
      type: 'select',
      options: departments.map(s => ({
        value: s.id,
        label: s.departmentName
      }))
    },
  ];
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.getDepartments();
        setDepartments(res.content || []);
      } catch (err) {
        setDepartments([]);
        setError(err.message);
        setShowNotification(true);
      }
    };
    fetchDepartments();
  }, []);

  const handleEdit = (row) => {
    if (!row.id) {
      setError('Could not find user data for editing');
      setShowNotification(true);
      return;
    }
    seteditUser(row);
    setShowForm(true);
  };
  const handleFormSubmit = async (formData) => {
    setCreating(true);
    try {
      if (editUser) {
        if (!editUser.id) return;
        const payload = {
          ...formData,
          roles: Array.isArray(formData.roles) ? formData.roles : [formData.roles]
        }
        await apiClient.put(`/api/auth/register/${editUser.id}`, payload);
        setSuccessMessage('User updated successfully.');
      } else {
        const payload = {
          ...formData,
          roles: Array.isArray(formData.roles) ? formData.roles : [formData.roles]
        }
        const res = await apiClient.post(`/api/auth/register?departmentId=${formData.responsibleDepartmentId}`,payload);
        setSuccessMessage('User created successfully.');
      }
      setShowForm(false);
      seteditUser(null);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 10000);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setCreating(false);
    }
  };

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    const department = departments.find(d => d.id === parseInt(deptId));
    setSelectedDepartment(department);

    if (department) {
      setFormValues(prev => ({
        ...prev,
        responsibleDepartmentId: deptId,
        responsiblePerson: department.contactPerson
      }));
    }
  };

  const tableData = data.map(row => {
    const newRow = { ...row }; 
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
      <h2>Users</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => setShowForm(true)}
          className="create-button"
        >
          Add User
        </button>
        {showForm && (
          <CreateForm
            title={editUser ? "Update User" : "Add User"}
            fields={getFields()}
            onSubmit={handleFormSubmit}
            loading={creating}
            buttonLabel={editUser ? "Update User" : "Create User"}
            onCancel={() => { setShowForm(false); seteditUser(null); }}
            initialValues={editUser || {}}
            customHandlers={{
              responsibleDepartmentId: handleDepartmentChange
            }}
          />
        )}

      </div>
      {showNotification && error && (
        <Notification
          message={`Error loading User: ${error}`}
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
      <Table exportFileName="User"
             columns={tableColumns}
             loading={loading}
             page={page}
             pageSize={pageSize}
             totalCount={totalElements}
             onPageChange={(newPage) => setPage(newPage)}
             onPageSizeChange={(newSize) => {
               setPageSize(newSize);
               setPage(1);
             }}
             data={tableData}  />
      </div>
    </>
  );
};

export default UserPage;
