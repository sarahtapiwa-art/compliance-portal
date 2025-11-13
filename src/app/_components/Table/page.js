import React, { useState } from "react";
import {
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiChevronRight,
  FiCheckCircle,
} from "react-icons/fi";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import "../../../styles/Table.css";
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CustomDateInput = ({ value, onClick }) => (
  <div className="dateInput" onClick={onClick}>
    <span>
      {value || 'Select date'}
    </span>
  </div>
);

const CustomDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date",
  maxDate = "",
  minDate = ""
}) => {
  return (
    <div >
      <ReactDatePicker
        selected={value ? new Date(value) : null}
        onChange={(date) => {
          const formattedDate = date ? date.toISOString().split('T')[0] : '';
          onChange(formattedDate);
        }}
        customInput={<CustomDateInput />}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        maxDate={maxDate ? new Date(maxDate) : null}
        minDate={minDate ? new Date(minDate) : null}
      />
    </div>
  );
};

const DateRangePicker = ({
  startDateRange,
  endDateRange,
  onstartDateRangeChange,
  onendDateRangeChange,
  onClear,
}) => {
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    < >
      <div style={{ display: "flex", alignItems: "center", gap: "12px"}}>
        <div className="formGroup">
          <label className="form-label">
            Start Date:
          </label>
          <CustomDatePicker 
            value={startDateRange}
            onChange={onstartDateRangeChange}
            placeholder="Start date"
            maxDate={endDateRange || getTodayDate()}
          />
        </div>
        
        <div className="formGroup">
          <label className="form-label">
            End Date:
          </label>
          <CustomDatePicker 
            value={endDateRange}
            onChange={onendDateRangeChange}
            placeholder="End date"
            minDate={startDateRange}
          />
        </div>
      </div>
      
      <div style={{ marginTop:"19px" }}>
        <button
          onClick={onClear}
          className="export-button"
        >
          Clear
        </button>
      </div>

      {startDateRange && endDateRange && new Date(startDateRange) > new Date(endDateRange) && (
        <div style={{ 
          width: "100%", 
          color: "#dc3545", 
          fontSize: "12px", 
          marginTop: "8px" 
        }}>
          End date cannot be before start date
        </div>
      )}
    </>
  );
};


const Table = ({
  columns,
  data,
  pageSizeOptions = [10, 15, 20],
  onEdit,
  onApprove,
  onDelete,
  onView,
  page: controlledPage,
  pageSize: controlledPageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  exportable = true,
  exportFileName = "data",
  expandable = false,
  renderRowSubComponent,
  userRoles = [],
  actionPermissions = {},
  loading = false,
  searchFields = [],
  onSearchFieldChange,
  currentSearchField = "",
  onSearch,
  showDateRange = false,
  startDateRange = "",
  endDateRange = "",
  onstartDateRangeChange,
  onendDateRangeChange,
  onDateRangeSearch,
  showSearch = true,
  originalData = []
}) => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(pageSizeOptions[0]);
  const [expandedRows, setExpandedRows] = useState({});

  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const pageSize =
    controlledPageSize !== undefined ? controlledPageSize : internalPageSize;

  const isLoading = loading || data == null;
  const safeData = Array.isArray(data) ? data : [];
  const safeOriginalData = Array.isArray(originalData) ? originalData : safeData;

  const textFilteredData = onSearch
    ? safeData
    : safeData.filter((row) =>
        columns.some((col) =>
          String(row[col.accessor] || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      );

  const filteredData = textFilteredData;

  const sortedData = sortBy
    ? [...filteredData].sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return sortOrder === "asc" ? -1 : 1;
        if (a[sortBy] > b[sortBy]) return sortOrder === "asc" ? 1 : -1;
        return 0;
      })
    : filteredData;

    const paginatedData = controlledPage !== undefined && controlledPageSize !== undefined
    ? sortedData 
    : sortedData.slice((page - 1) * pageSize, page * pageSize); 
  
  const totalRows = totalCount !== undefined ? totalCount : sortedData.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const handleSort = (accessor) => {
    if (sortBy === accessor) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(accessor);
      setSortOrder("asc");
    }
    if (onPageChange) onPageChange(1);
    else setInternalPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (onPageChange) onPageChange(newPage);
      else setInternalPage(newPage);
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    if (onPageSizeChange) onPageSizeChange(newSize);
    else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const toggleRowExpansion = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const exportToCSV = () => {
    // Use original data for export to avoid formatted currency values
    const exportData = safeOriginalData.map((row) => {
      const exportRow = {};
      columns.forEach((col) => {
        // Export the raw numeric values instead of formatted strings
        exportRow[col.Header] = row[col.accessor];
      });
      return exportRow;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    // Use original data for export to avoid formatted currency values
    const exportData = safeOriginalData.map((row) => {
      const exportRow = {};
      columns.forEach((col) => {
        // Export the raw numeric values instead of formatted strings
        exportRow[col.Header] = row[col.accessor];
      });
      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
  };

  const hasPermission = (requiredPermission) => {
    if (!requiredPermission) return true;
    return userRoles.some((role) => requiredPermission.includes(role));
  };

  const handleDateRangeSearch = () => {
    if (onDateRangeSearch) {
      onDateRangeSearch();
    }
  };

  const handleClearDateRange = () => {
    if (onstartDateRangeChange) onstartDateRangeChange("");
    if (onendDateRangeChange) onendDateRangeChange("");
    if (onDateRangeSearch) onDateRangeSearch();
  };

  return (
    <div className="table-container">
      <div className="table-controls">
        <div
          className="search-container"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
                  {showDateRange && (
          <DateRangePicker
            startDateRange={startDateRange}
            endDateRange={endDateRange}
            onstartDateRangeChange={onstartDateRangeChange}
            onendDateRangeChange={onendDateRangeChange}
            onSearch={handleDateRangeSearch}
            onClear={handleClearDateRange}
          />
        )}
          {searchFields.length > 0 && (
            <select
              value={currentSearchField}
              onChange={(e) => onSearchFieldChange?.(e.target.value)}
              style={{
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "black",
                minWidth: "150px",
              }}
            >
              {searchFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
          )}
        {showSearch && (

          <div style={{ position: "relative", flex: 1 }}>
            <FiSearch 
              className="search-icon" 
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6c757d",
                zIndex: 1,
              }}
            />
            <input
              type="text"
              placeholder={`Search by ${currentSearchField}...`}
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (onSearch) {
                  onSearch(value);
                } else {
                  if (onPageChange) onPageChange(1);
                  else setInternalPage(1);
                }
              }}
              className="search-input"
              style={{ 
                paddingLeft: "35px",
                width: "100%",
              }}
            />
          </div>
        )}
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
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {expandable && <th className="table-header expand-header"></th>}
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  onClick={() => handleSort(col.accessor)}
                  className={`table-header ${
                    sortBy === col.accessor ? "active" : ""
                  }`}
                >
                  <div className="header-content">
                    {col.Header}
                    {sortBy === col.accessor && (
                      <span className="sort-icon">
                        {sortOrder === "asc" ? (
                          <FiChevronUp />
                        ) : (
                          <FiChevronDown />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onView || onApprove || onEdit || onDelete) && (
                <th className="table-header">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={columns.length + 1 + (expandable ? 1 : 0)}>
                    <div className="empty-state">
                      {isLoading ? (
                          <div className="flex items-center justify-center gap-2 p-4">
                            {/* Option A - More explicit Tailwind */}
                            <div
                                className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                            {/*<span className="text-gray-600">Loading data...</span>*/}
                            <div className="dot-spinner">
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                              <div className="dot-spinner__dot"></div>
                            </div>
                          </div>

                      ) : (
                          "No data found"
                      )}
                    </div>
                  </td>
                </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const computedRowId = (row && (row.id ?? row._id ?? row.uuid ?? row.ID)) ?? ((page - 1) * pageSize + idx);
                const isExpanded = expandedRows[computedRowId] || false;
                const hasSubComponent = expandable && renderRowSubComponent;

                return (
                  <React.Fragment key={computedRowId}>
                    <tr className={`table-row ${isExpanded ? "expanded" : ""}`}>
                      {expandable && (
                        <td className="table-cell expand-cell">
                          {hasSubComponent && (
                            <button
                              className="expand-button"
                              onClick={() => toggleRowExpansion(computedRowId)}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <FiChevronDown />
                              ) : (
                                <FiChevronRight />
                              )}
                            </button>
                          )}
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.accessor} className="table-cell">
                          {row[col.accessor]}
                        </td>
                      ))}
                      {(onView || onApprove || onEdit || onDelete) && (
                        <td className="table-cell actions-cell">
                          <div className="action-buttons">
                            {onView &&
                              hasPermission(actionPermissions.view) && (
                                <button
                                  className="action-btn view-btn"
                                  onClick={() => onView(row)}
                                  title="View"
                                >
                                  <FiEye className="action-icon" />
                                </button>
                              )}
                            {onApprove &&
                              hasPermission(actionPermissions.approve) && (
                                <button
                                  className="action-btn approve-btn"
                                  onClick={() => onApprove(row)}
                                  title="Approve"
                                >
                                  <FiCheckCircle className="action-icon" />
                                </button>
                              )}
                            {onEdit &&
                              hasPermission(actionPermissions.edit) && (
                                <button
                                  className="action-btn edit-btn"
                                  onClick={() => onEdit(row)}
                                  title="Edit"
                                >
                                  <FiEdit2 className="action-icon" />
                                </button>
                              )}
                            {onDelete &&
                              hasPermission(actionPermissions.delete) && (
                                <button
                                  className="action-btn delete-btn"
                                  onClick={() => onDelete(row)}
                                  title="Delete"
                                >
                                  <FiTrash2 className="action-icon" />
                                </button>
                              )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {hasSubComponent && isExpanded && (
                      <tr className="expanded-content-row">
                        <td colSpan={columns.length + 1 + (expandable ? 1 : 0)}>
                          {renderRowSubComponent({ row })}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="pagination-info">
          {isLoading
            ? "Loading…"
            : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                page * pageSize,
                totalRows
              )} of ${totalRows} entries`}
        </div>
        <div className="pagination-buttons">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 10) {
                // Show all pages if total pages is 10 or less
                pageNum = i + 1;
              } else if (page <= 5) {
                // Show first 10 pages when near start
                pageNum = i + 1;
              } else if (page >= totalPages - 4) {
                // Show last 10 pages when near end
                pageNum = totalPages - 9 + i;
              } else {
                // Show 5 pages before and 4 after current page (total 10)
                pageNum = page - 5 + i;
              }

              // Ensure pageNum doesn't exceed totalPages
              pageNum = Math.min(pageNum, totalPages);

              return (
                  <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`pagination-button ${
                          page === pageNum ? "active" : ""
                      }`}
                  >
                    {pageNum}
                  </button>
              );
            })}

            {/* Show ellipsis and last page when there are more pages and we're not at the end */}
            {totalPages > 10 && page < totalPages - 5 && (
                <>
                  <span className="ellipsis">...</span>
                  <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={isLoading}
                      className={`pagination-button ${
                          page === totalPages ? "active" : ""
                      }`}
                  >
                    {totalPages}
                  </button>
                </>
            )}
          </div>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages || isLoading}
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