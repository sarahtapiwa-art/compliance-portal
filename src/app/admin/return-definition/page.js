"use client"
import React, {useCallback, useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';
import BulkUpload from '../../_components/BulkUpload';
import {jwtDecode} from "jwt-decode";

const columns = [
  { Header: 'Title', accessor: 'title' },
  { Header: 'Regulatory Body', accessor: 'regulatoryBody' },
  { Header: 'Recipient Email', accessor: 'regulatoryEmail' },
  { Header: 'Frequency', accessor: 'frequency' },
  { Header: 'Deadline', accessor: (row) => new Date(row.submissionDeadline).toLocaleDateString() },
  { Header: 'Department', accessor: (row) => row.department.departmentName },
];

const FREQUENCY_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY","SEMI_ANNUAL", "YEARLY"].map(l => ({
  label: l.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
  value: l
}));

const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};

const ReturnDefinitionPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editReturnDefinition, setEditReturnDefinition] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [userData, setUserData] = useState(null);
  const [creating, setCreating] = useState(false);

  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchData = useCallback(async (
      requestedPage = page,
      requestedPageSize = pageSize,
      search = "",
      searchField = ""
  ) => {
    setLoading(true);
    setError(null);

    try {
      const apiPage = Math.max(0, Number(requestedPage) - 1);
      const apiSize = Number(requestedPageSize);

      const params = new URLSearchParams({
        page: apiPage.toString(),
        size: apiSize.toString(),
      });

      // Only use user's department if they are NOT a super admin
      if (userData.roles?.[0] !== "ROLE_SUPER_SYSTEM_ADMIN") {
        params.append('departmentName', userData.department?.departmentName || '');
      }

      // Append search params if provided
      if (search && searchField) {
        params.append('search', search);
        params.append('searchField', searchField);
      }

      const res = await apiClient.get(`/api/v1/return-definition?${params.toString()}`);

      const enhancedData = (res.content || []).map(item => {
        const department = departments.find(dept => dept.id === item.responsibleDepartmentId);
        return {
          ...item,
          responsiblePerson: department ? department.contactPerson : 'Not assigned',
          responsibleDepartment: department ? department.departmentName : 'Unknown'
        };
      });

      setData(enhancedData);

      const total = res?.page?.totalElements || res?.totalElements || res?.total;
      setTotalElements(typeof total === 'number' ? total : (res?.content || []).length);

    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, userData, departments]);


  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize, fetchData]);


  const getFields = () => [
    { label: 'Report Title', name: 'title', required: true },
    { label: 'Regulatory Body', name: 'regulatoryBody', required: true },
    { label: 'Email', name: 'regulatoryEmail', required: true },
    { label: 'Frequency', name: 'frequency', required: true, type: 'select', options: FREQUENCY_OPTIONS},
    { label: 'Submission Deadline', name: 'submissionDeadline', required: true, type: 'date' },
    // {
    //   label: 'Department',
    //   name: 'responsibleDepartmentId',
    //   required: true,
    //   type: 'select',
    //   options: departments.map(s => ({
    //     value: s.id,
    //     label: s.departmentName
    //   }))
    // },
  
    { label: 'Description', name: 'description', required: true, type: 'textarea' },
    { label: 'Responsible Person Name', name: 'name', required: true },
    { label: 'Responsible Person Surname', name: 'surname', required: true },
    { label: 'Responsible Person Email', name: 'email', required: true },
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

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData(decoded);
      } catch (err) {
      }
    }
  }, []);

  const handleEdit = (row) => {
    if (!row.id) {
      return; 
    }
    const completeDefinition = data.find(item => item.id === row.id);
    const department = departments.find(dept => 
      dept.id === completeDefinition.responsibleDepartmentId
    );
    
    
    
    setEditReturnDefinition(completeDefinition);
    setFormValues({
      ...completeDefinition,
      responsiblePerson: department ? department.contactPerson : ''
    });
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleBulkUploadSuccess = () => {
    setSuccessMessage('Bulk upload completed successfully!');
    setShowBulkUpload(false);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 10000);
    fetchData();
  };

  const handleBulkUploadError = (errorMsg) => {
    setError(`Bulk upload failed: ${errorMsg}`);
    setShowNotification(true);
  };

  const handleView = async (row) => {
    try {
      const response = await apiClient.get(`/api/v1/stands/${row.id}`);
      setStandDetails(response.content || response); 
      setShowStandDetails(true);
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    }
  };

  const handleDelete = async (row) => {
    if (!row.id) {
      setError("Cannot delete: No ID found");
      setShowNotification(true);
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${row.title}"?`)) {
      return;
    }
    
    try {
      await apiClient.delete(`/api/v1/return-definition/${row.id}`);
      setSuccessMessage('Return definition deleted successfully');
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 5000);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
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
  

  const handleFormChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'responsibleDepartmentId') {
      const department = departments.find(d => d.id === parseInt(value));
      if (department) {
        setFormValues(prev => ({
          ...prev,
          responsiblePerson: department.contactPerson
        }));
        setSelectedDepartment(department);
      }
    }
  };

  const handleFormSubmit = async (submittedData) => {
    try {
      setCreating(true);
      const department = departments.find(d => d.id === parseInt(submittedData.responsibleDepartmentId));


      const dataToSubmit = {
        ...submittedData,
        responsibleDepartmentId: userData.department.id,
        // responsiblePerson: userData.department.responsiblePersonEmail
        responsiblePerson:{
          name: submittedData.name,
          surname: submittedData.surname,
          email: submittedData.email,
        }
      };
  
      if (editReturnDefinition) {
        await apiClient.put(`/api/v1/return-definition/${editReturnDefinition.id}`, dataToSubmit);
        setSuccessMessage('Return Definition updated successfully.');
      } else {
        await apiClient.post(`/api/v1/return-definition`, dataToSubmit);
        setSuccessMessage('Return Definition created successfully.');
      }
  
      setShowForm(false);
      setEditReturnDefinition(null);
      setFormValues({});
      setSelectedDepartment(null);
      setShowSuccessNotification(true);
      setTimeout(() => setShowSuccessNotification(false), 10000);
      await fetchData();
    } catch (err) {
      setError(err.message);
      setCreating(false);
      setShowNotification(true);
    } finally {
      setCreating(false);
    }
  };
  

  const handleFormCancel = () => {
    setShowForm(false);
    setEditReturnDefinition(null);
    setFormValues({});
    setSelectedDepartment(null);
  };

  const tableData = data.map(row => {
    const newRow = { id: row.id }; 
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
    <div className="page-container">
      <h2>Return Definition</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
        <button 
          onClick={() => {
            setFormValues({});
            setSelectedDepartment(null);
            setShowForm(true);
          }}
          className="create-button"
        >
          Add Return Definition
        </button>
        {/*<button*/}
        {/*    onClick={() => setShowBulkUpload(true)}*/}
        {/*    className="create-button"*/}
        {/*  >*/}
        {/*    Bulk Upload*/}
        {/*  </button>*/}
      </div>
      
      {showForm && (
        <CreateForm
          title={editReturnDefinition ? "Update Return Definition" : "Add Return Definition"}
          fields={getFields()}
          onSubmit={handleFormSubmit}
          buttonLabel={editReturnDefinition ? "Update" : "Create"}
          onCancel={handleFormCancel}
          initialValues={editReturnDefinition || {}}
          formValues={formValues}
          loading={creating}
          onFieldChange={handleFormChange}
          customHandlers={{
            responsibleDepartmentId: handleDepartmentChange
          }}
        />
      )}

{showBulkUpload && (
          <BulkUpload
            endpoint="/api/v1/return-definition/bulk/attach/upload"
            onSuccess={handleBulkUploadSuccess}
            onError={handleBulkUploadError}
            onCancel={() => setShowBulkUpload(false)}
            title="Bulk Upload "
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
          exportFileName="return_definition"
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
  );
};

export default ReturnDefinitionPage;