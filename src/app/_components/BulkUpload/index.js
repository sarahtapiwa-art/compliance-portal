import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import '../../../styles/CreateForm.css';
import { apiClient } from '../../_utils/apiClient';

const BulkUpload = ({
  endpoint,
  productId,
  onSuccess,
  onError,
  onCancel,
  title = 'Bulk Upload',
}) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadErrors, setUploadErrors] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setSuccess(null);
    setUploadErrors(null);
    setShowErrorDetails(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadErrors(null);
    setShowErrorDetails(false);
    
    try {
      const url = productId ? endpoint.replace('{productId}', productId) : endpoint;
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.postMultipart(url, formData);
      
      if (response && typeof response === 'object') {
        if (response.failedCount > 0) {
          setUploadErrors(response);
          setShowErrorDetails(true);
          const message = `Bulk upload completed with ${response.successfulCount} successful and ${response.failedCount} failed records`;
          setSuccess(message);
          if (onSuccess) onSuccess();
        } else {
          setSuccess('Bulk upload successful!');
          setFile(null);
          if (onSuccess) onSuccess();
        }
      } else {
        setSuccess('Bulk upload successful!');
        setFile(null);
        if (onSuccess) onSuccess();
      }
      
    } catch (err) {      
      let errorMessage = 'Upload failed';
      let structuredErrors = null;

      if (err.data) {
        const errorData = err.data;
        
        if (errorData.failedCount !== undefined && errorData.errors !== undefined) {
          structuredErrors = errorData;
          setUploadErrors(structuredErrors);
          setShowErrorDetails(true);
          errorMessage = `Bulk upload completed with ${errorData.failedCount} error(s) out of ${errorData.totalProcessed} records`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } 
      else if (err.response && err.response.data) {
        const errorData = err.response.data;
        
        if (errorData.failedCount !== undefined && errorData.errors !== undefined) {
          structuredErrors = errorData;
          setUploadErrors(structuredErrors);
          setShowErrorDetails(true);
          errorMessage = `Bulk upload completed with ${errorData.failedCount} error(s) out of ${errorData.totalProcessed} records`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      
      if (onError) {
        if (structuredErrors) {
          onError(structuredErrors);
        } else {
          onError(errorMessage);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const renderErrorDetails = () => {
    if (!uploadErrors || !uploadErrors.errors || !Array.isArray(uploadErrors.errors)) {
      return null;
    }

    return (
      <div className="error-details">
        <div className="error-summary">
          <h4>Upload Summary:</h4>
          <div className="summary-stats">
            <span>Total Processed: <strong>{uploadErrors.totalProcessed || 0}</strong></span>
            <span>Successful: <strong className="success-text">{uploadErrors.successfulCount || 0}</strong></span>
            <span>Failed: <strong className="error-text">{uploadErrors.failedCount || 0}</strong></span>
          </div>
        </div>
        
        <div className="error-list">
          <h4>Error Details:</h4>
          {uploadErrors.errors.map((errorItem, index) => (
            <div key={index} className="error-item">
              <div className="error-header">
                <span className="error-index">Row {errorItem.index + 1}</span>
                {errorItem.title && (
                  <span className="error-title">{errorItem.title}</span>
                )}
              </div>
              <div className="error-message">
                <strong>{errorItem.field || 'Error'}:</strong> {errorItem.error || 'Unknown error'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          {onCancel && (
            <button className="close-button" onClick={onCancel}>
              <FiX size={20} />
            </button>
          )}
        </div>
        <form onSubmit={handleUpload} className="modal-form">
          <div className="form-fields">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Select File<span className="required-asterisk">*</span></label>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="form-input"
                  required
                />
                <small className="file-help">
                  Supported formats: Excel (.xlsx, .xls), CSV
                </small>
              </div>
            </div>
            
            {error && !showErrorDetails && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                {success}
              </div>
            )}
            
            {showErrorDetails && uploadErrors && (
              <div className="upload-errors-section">
                {renderErrorDetails()}
              </div>
            )}
          </div>
          <div className="form-actions">
            {onCancel && (
              <button type="button" onClick={onCancel} className="cancel-button">
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className="submit-button" 
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkUpload;