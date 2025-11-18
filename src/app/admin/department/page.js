"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';


const columns = [
  { Header: 'Name', accessor: 'departmentName' },
  { Header: 'Responsible Person', accessor: 'responsiblePerson' },
  { Header: 'Responsible Person Email', accessor: 'responsiblePersonEmail' },
  { Header: 'Escalation Email', accessor: 'escalationEmail' },
  { Header: 'Manager', accessor: 'headOfDepartmentEmail' },
];


const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const fields = [
    { label: 'Department', name: 'departmentName', required: true },
    { label: 'Responsible Person', name: 'responsiblePerson', required: true},
    { label: 'Responsible Person Email', name: 'responsiblePersonEmail', required: true },  
    { label: 'Escalation Email', name: 'escalationEmail', required: true },
    { label: 'Manager', name: 'headOfDepartmentEmail', required: true },
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = useCallback(async (requestedPage = page, requestedPageSize = pageSize, search = "", searchField = "") => {
    setLoading(true);
    setError(null);
    try {
      const apiPage = Math.max(0, Number(requestedPage) - 1);
      const apiSize = Number(requestedPageSize);
  
      const params = new URLSearchParams({
        deleted: 'false',
        page: apiPage.toString(),
        size: apiSize.toString()
      });
  
      if (search && searchField) {
        params.append('search', search);
        params.append('searchField', searchField);
      }
  
      const res = await apiClient.get(`/api/v1/departments?${params.toString()}`);
      setData(res.content || []);
  
      const total = res?.page?.totalElements || res?.totalElements || res?.total;
      setTotalElements(typeof total === 'number' ? total : (res?.content || []).length);
  
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize, fetchData]);



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
      <p className='description'>Manage and create departments.</p>

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
<Table 
  exportFileName="departments" 
  columns={tableColumns} 
  data={tableData} 
  onEdit={handleEdit} 
  onDelete={handleDelete}
  page={page}
  pageSize={pageSize}
  totalCount={totalElements}
  onPageChange={(newPage) => {
    setPage(newPage);
    fetchData(newPage, pageSize);
  }}
  onPageSizeChange={(newSize) => {
    setPageSize(newSize);
    setPage(1);
    fetchData(1, newSize);
  }}
  loading={loading}
/>
      </div>
    </>
  );
};

export default DepartmentPage;
