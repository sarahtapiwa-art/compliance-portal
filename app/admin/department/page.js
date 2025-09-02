"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';

const columns = [
  { Header: 'Name', accessor: 'departmentName' },
  { Header: 'Contact Person', accessor: 'contactPerson' },
  { Header: 'Email', accessor: 'email' },
];


const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const fields = [
    { label: 'Department', name: 'departmentName', required: true },
    { label: 'Contact Person', name: 'contactPerson', required: true},
    { label: 'Email', name: 'email', required: true },  
  ];



const DepartmentPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editDepartment, seteditDepartment] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const router = useRouter();

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(`/api/v1/departments`);
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
      seteditDepartment(completeProduct);
      setShowForm(true);
    };

    const handleDelete = async (row) => {
      try {
        apiClient.delete(`/api/v1/departments/${row.id}`);
        setSuccessMessage('Department deleted successfully');
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 5000);
        await fetchData();
      } catch (err) {
        setError(err.message);
        setShowNotification(true);
      }
    };




  

  const handleCreate = () => {
    router.push('/admin/department/create');
  };




  const handleFormSubmit = async (formData) => {
    try {
      if (editDepartment) {
        if (!editDepartment.id) return; 
        await apiClient.put(`/api/v1/departments/${editDepartment.id}`, formData);
        setSuccessMessage('Department updated successfully.');
      } else {
        const res = await apiClient.post(`/api/v1/departments`,formData);
        setSuccessMessage('Department created successfully.');
      }
      setShowForm(false);
      seteditDepartment(null);
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
      <h2>Departments</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => setShowForm(true)}
          className="create-button"
        >
          Add Department
        </button>
        {showForm && (
          <CreateForm
            title={editDepartment ? "Update Department" : "Add Department"}
            fields={fields}
            onSubmit={handleFormSubmit}
            buttonLabel={editDepartment ? "Update Department" : "Create Department"}
            onCancel={() => { setShowForm(false); seteditDepartment(null); }}
            initialValues={editDepartment || {}}
          />
        )}

      </div>
      {showNotification && error && (
        <Notification
          message={`Error loading departments: ${error}`}
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
      <Table exportFileName="departments" columns={tableColumns} data={tableData} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </>
  );
};

export default DepartmentPage;
