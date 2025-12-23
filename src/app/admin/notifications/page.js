"use client"
import React, { useEffect, useState } from 'react';
import Table from '../../_components/Table';
import '../../globals.css';
import { apiClient } from '../../_utils/apiClient';
import Notification from '../../_components/Notifications/page'

const columns = [
  { Header: 'Notification', accessor: 'notificationType' },
  { Header: 'Subject', accessor: 'emailSubject' },
  { Header: 'Sent to', accessor: 'emailTarget' },
  { Header: 'Timer', accessor: (row) => new Date(row.sentAt).toLocaleDateString() },

];


const getCellValue = (row, accessor) => {
  if (typeof accessor === 'function') return accessor(row);
  if (typeof accessor === 'string') return row?.[accessor] ?? '';
  return '';
};



const NotificationPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
    const fetchData = async (requestedPage = page,
                             requestedPageSize = pageSize) => {
      setLoading(true);
      setError(null);
      try {
        const apiPage = Math.max(0, Number(requestedPage) - 1);
        const apiSize = Number(requestedPageSize);

        const params = new URLSearchParams({
          page: apiPage.toString(),
          size: apiSize.toString(),
        });

        const res = await apiClient.get(`/api/v1/notification-log?${params.toString()}`);
        setData(res.content || []);
        const total = res?.page?.totalElements || res?.totalElements || res?.total;
        setTotalElements(typeof total === 'number' ? total : (res?.content || []).length);
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

  const tableData = data.map(row => {
    const newRow = {};
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
      <h2>Notification Log</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>

</div>
      {showNotification && error && (
        <Notification
          message={`Error loading clients: ${error}`}
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
      <Table exportFileName="notifications"
             loading={loading}
             columns={tableColumns}
             data={tableData}
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
      />
      </div>
    </>
  );
};

export default NotificationPage;
