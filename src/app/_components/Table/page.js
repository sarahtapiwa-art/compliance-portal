import React, { useState } from 'react';
import { FiChevronUp, FiChevronDown, FiSearch, FiEye, FiEdit2, FiTrash2, FiDownload } from 'react-icons/fi';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import '../../../styles/Table.css';

const Table = ({
  columns,
  data,
  pageSizeOptions = [5, 10, 20],
  onEdit,
  onDelete,
  onView,
  page: controlledPage,
  pageSize: controlledPageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  exportable = true,
  exportFileName = 'data'
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeOptions[0]);

  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const filteredData = data.filter(row =>
    columns.some(col =>
      String(row[col.accessor] || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  const sortedData = sortBy
    ? [...filteredData].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  const paginatedData = (controlledPage !== undefined && controlledPageSize !== undefined)
    ? sortedData 
    : sortedData.slice((page - 1) * pageSize, page * pageSize);

  const totalRows = totalCount !== undefined ? totalCount : sortedData.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const handleSort = accessor => {
    if (sortBy === accessor) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(accessor);
      setSortOrder('asc');
    }
    if (onPageChange) onPageChange(1);
    else setInternalPage(1);
  };

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (onPageChange) onPageChange(newPage);
      else setInternalPage(newPage);
    }
  };

  const handlePageSizeChange = e => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) onPageSizeChange(newSize);
    else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const exportToCSV = () => {
    const exportData = sortedData.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        exportRow[col.Header] = row[col.accessor];
      });
      return exportRow;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const exportData = sortedData.map(row => {
      const exportRow = {};
      columns.forEach(col => {
        exportRow[col.Header] = row[col.accessor];
      });
      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
  };

  return (
    <div className="table-container">
      <div className="table-controls">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              if (onPageChange) onPageChange(1);
              else setInternalPage(1);
            }}
            className="search-input"
          />
        </div>
        <div className="export-controls">
          {exportable && (
            <div className="export-buttons">
              <button onClick={exportToCSV} className="export-button">
                <FiDownload /> Export CSV
              </button>
              <button onClick={exportToExcel} className="export-button">
                <FiDownload /> Export Excel
              </button>
            </div>
          )}
          <select 
            value={pageSize} 
            onChange={handlePageSizeChange}
            className="page-size-select"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>Show {size}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.accessor}
                  onClick={() => handleSort(col.accessor)}
                  className={`table-header ${sortBy === col.accessor ? 'active' : ''}`}
                >
                  <div className="header-content">
                    {col.Header}
                    {sortBy === col.accessor && (
                      <span className="sort-icon">
                        {sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="table-header">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={columns.length + 1}>
                  <div className="empty-state">
                    No data found
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="table-row">
                  {columns.map(col => (
                    <td key={col.accessor} className="table-cell">
                      {row[col.accessor]}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <td className="table-cell actions-cell">
                      <div className="action-buttons">
                        {onView && (
                          <button className="action-btn view-btn" onClick={() => onView(row)} title="View">
                            <FiEye className="action-icon" />
                          </button>
                        )}
                        {onEdit && (
                          <button className="action-btn edit-btn" onClick={() => onEdit(row)} title="Edit">
                            <FiEdit2 className="action-icon" />
                          </button>
                        )}
                        {onDelete && (
                          <button className="action-btn delete-btn" onClick={() => onDelete(row)} title="Delete">
                            <FiTrash2 className="action-icon" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination-info">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalRows)} of {totalRows} entries
        </div>
        <div className="pagination-buttons">
          <button 
            onClick={() => handlePageChange(page - 1)} 
            disabled={page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`pagination-button ${page === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && page < totalPages - 2 && (
              <span className="ellipsis">...</span>
            )}
            {totalPages > 5 && page < totalPages - 2 && (
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`pagination-button ${page === totalPages ? 'active' : ''}`}
              >
                {totalPages}
              </button>
            )}
          </div>
          <button 
            onClick={() => handlePageChange(page + 1)} 
            disabled={page === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Table;