"use client"
import React, { useEffect, useState } from 'react';
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

const ROLE_OPTIONS = ["SUPER_SYSTEM_ADMIN","ADMIN","USER"].map(l => ({
    label: l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: l
  }));

const fields = [
    { label: 'Username', name: 'username', required: true },
    { label: 'Email', name: 'email', required: true},
    { label: 'Password', name: 'password', required: true},
    { label: 'Roles', name: 'roles', required: true, type: 'select', options: ROLE_OPTIONS },  
  ];



const UserPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, seteditUser] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const router = useRouter();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/auth/users`);
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



    const handleEdit = (row) => {
      if (!row.id) {
        return; 
      }
      const completeProduct = data.find(product => product.id === row.id);
      seteditUser(completeProduct);
      setShowForm(true);
    };

  const handleFormSubmit = async (formData) => {
    try {
      if (editUser) {
        if (!editUser.id) return; 
        await apiClient.put(`/api/auth/register/${editUser.id}`, formData);
        setSuccessMessage('User updated successfully.');
      } else {
        const res = await apiClient.post(`/api/auth/register`,formData);
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
            fields={fields}
            onSubmit={handleFormSubmit}
            buttonLabel={editUser ? "Update User" : "Create User"}
            onCancel={() => { setShowForm(false); seteditUser(null); }}
            initialValues={editUser || {}}
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
      <Table exportFileName="User" columns={tableColumns} data={tableData}  />
      </div>
    </>
  );
};

export default UserPage;
