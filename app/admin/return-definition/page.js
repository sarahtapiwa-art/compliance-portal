"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../_utils/apiClient';
import Table from '../../_components/Table';
import Notification from '../../_components/Notifications/page'
import CreateForm from '../../_components/CreateForm/page';
import '../../globals.css';

const columns = [
  { Header: 'Title', accessor: 'title' },
  { Header: 'Regulatory Body', accessor: 'regulatoryBody' },
  { Header: 'Email', accessor: 'regulatoryEmail' },
  { Header: 'Frequency', accessor: 'frequency' },
  { Header: 'Deadline', accessor: 'submissionDeadline' },
  { Header: 'Department', accessor: 'responsibleDepartment' },
];

const FREQUENCY_OPTIONS = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].map(l => ({
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

  const router = useRouter();

  const getFields = () => [
    { label: 'Report Title', name: 'title', required: true },
    { label: 'Regulatory Body', name: 'regulatoryBody', required: true },
    { label: 'Email', name: 'regulatoryEmail', required: true },
    { label: 'Frequency', name: 'frequency', required: true, type: 'select', options: FREQUENCY_OPTIONS},
    { label: 'Submission Deadline', name: 'submissionDeadline', required: true, type: 'date' },
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
    // { 
    //   label: 'Responsible Person', 
    //   name: 'responsiblePerson', 
    //   required: true,
    //   readOnly: true
    // },    
    { label: 'Description', name: 'description', required: true, type: 'textarea' },  
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

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/return-definition`);
            const enhancedData = (res.content || []).map(item => {
        const department = departments.find(dept => dept.id === item.responsibleDepartmentId);
        return {
          ...item,
          responsiblePerson: department ? department.contactPerson : 'Not assigned',
          responsibleDepartment: department ? department.departmentName : 'Unknown'
        };
      });
      console.log(enhancedData)
      setData(enhancedData);
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (departments.length > 0) {
      fetchData();
    }
  }, [departments]);

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
    console.log(department)
    setSelectedDepartment(department);
    setShowForm(true);
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
      const department = departments.find(d => d.id === parseInt(submittedData.responsibleDepartmentId));
      
      const dataToSubmit = {
        ...submittedData,
        responsiblePerson: department?.contactPerson || ''
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
      setShowNotification(true);
    }
  };
  

  const handleFormCancel = () => {
    setShowForm(false);
    setEditReturnDefinition(null);
    setFormValues({});
    setSelectedDepartment(null);
  };

  const tableData = data.map(row => {
    const newRow = { id: row.id }; // Preserve the ID
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
          onFieldChange={handleFormChange}
          customHandlers={{
            responsibleDepartmentId: handleDepartmentChange
          }}
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
        <div className="loading">Loading...</div>
      ) : (
        <Table 
          exportFileName="return_definition" 
          columns={tableColumns} 
          data={tableData} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}
    </div>
  );
};

export default ReturnDefinitionPage;