"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '../../../_utils/apiClient';
import Notification from '../../../_components/Notifications/page';
import '../../../globals.css';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiClock,
  FiPaperclip,
  FiCheckCircle,
  FiSend,
  FiEye,
  FiDownload,
FiFile
} from 'react-icons/fi';
import '../../../../styles/Submissions.css';

const SubmissionViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;
  
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [emailCredentials, setEmailCredentials] = useState({
    username: '',
    password: '',
    subject: '',
    cc: []
  });
  const [ccInput, setCcInput] = useState('');
  const [attachingPersonEmail, setAttachingPersonEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [documentId, setDocumentId] = useState();

  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'CLOSED';
  const hasFiles = submission?.status === 'UPLOADED';
  const hasApprovedFile = submission?.files?.some(file => file.status === 'APPROVED');
  const hasPendingFile = submission?.files?.some(file => file.status === 'PENDING');



  const fetchSubmission = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/submissions/${submissionId}`);
      setSubmission(res);
      setAttachingPersonEmail(res.returnDefinition.department.responsiblePersonEmail || '');
      const id = res.returnDefinition.documentId
      setDocumentId(id)
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchSubmission();
    };
    loadData();
  }, [submissionId]);
  
  useEffect(() => {
    if (submission?.returnDefinition?.documentId) {
      console.log(submission?.returnDefinition?.documentId)
      viewFile();
    }
  }, [submission]);
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        setShowNotification(true);
        return;
      }
      setAttachedFile(file);
    }
  };

  const handleAttachFile = async () => {
    if (!attachedFile) {
      setError('Please select a file to attach');
      setShowNotification(true);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', attachedFile);
      formData.append('attachingPersonEmail', attachingPersonEmail);

      await apiClient.postMultipart(
        `/api/v1/submissions/${submissionId}/attach`,
        formData
      );

      setSuccessMessage('File attached successfully! Waiting for verification.');
      setShowSuccessNotification(true);
      setAttachedFile(null);
      document.getElementById('file-input').value = '';
      
      await fetchSubmission();
    } catch (err) {
      setError(err.message || 'Failed to attach file');
      setShowNotification(true);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyFile = async (fileId, approve = true) => {
    setVerifying(true);
    setError(null);

    try {
      const endpoint = approve 
        ? `/api/v1/submissions/${submissionId}/files/${fileId}/approve`
        : `/api/v1/submissions/${submissionId}/files/${fileId}/reject`;

      await apiClient.post(endpoint);

      setSuccessMessage(`File ${approve ? 'approved' : 'rejected'} successfully!`);
      setShowSuccessNotification(true);
      
      await fetchSubmission();
    } catch (err) {
      setError(err.message || `Failed to ${approve ? 'approve' : 'reject'} file`);
      setShowNotification(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleSendSubmission = async () => {
    if (!emailCredentials.username || !emailCredentials.password) {
      setError('Email credentials are required');
      setShowNotification(true);
      return;
    }

    setSending(true);
    setError(null);

    try {
      let url = `/api/v1/submissions/${submissionId}/send`;
      
      if (emailCredentials.cc.length > 0) {
        const queryParams = emailCredentials.cc
          .map(email => `cc=${encodeURIComponent(email)}`)
          .join('&');
        url += `?${queryParams}`;
      }

      await apiClient.post(
        url,
        {
          username: emailCredentials.username,
          password: emailCredentials.password,
          subject: emailCredentials.subject
        }
      );

      setSuccessMessage('Submission sent successfully!');
      setShowSuccessNotification(true);
      
      await fetchSubmission();
    } catch (err) {
      setError(err.message || 'Failed to send submission');
      setShowNotification(true);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCcInputChange = (e) => {
    setCcInput(e.target.value);
  };

  const addCcEmail = () => {
    if (ccInput.trim() && isValidEmail(ccInput.trim())) {
      setEmailCredentials(prev => ({
        ...prev,
        cc: [...prev.cc, ccInput.trim()]
      }));
      setCcInput('');
    }
  };

  const removeCcEmail = (index) => {
    setEmailCredentials(prev => ({
      ...prev,
      cc: prev.cc.filter((_, i) => i !== index)
    }));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewFile = async () => {
    console.log("📌 viewFile() triggered");
    try {
      const id = submission?.returnDefinition?.documentId;
      if (!id) return;
  
      const response = await apiClient.get(
        `/api/v1/documents/${id}/view`,
        { responseType: 'arraybuffer' } // ✅ REQUIRED
      );
    
      const blob = new Blob([response]);
      const blobUrl = URL.createObjectURL(blob);
  
      console.log("✅ Document URL:", blobUrl);
      setViewingFile({ url: blobUrl});
    } catch (err) {
      console.log(err);
      setError('Failed to view file');
      setShowNotification(true);
    }
  };
  

  const downloadFile = async (fileId, fileName) => {
    try {
      const file = submission.files.find(f => f.id === fileId);
      if (!file || !file.documentId) {
        setError('Document ID not found for this file');
        setShowNotification(true);
        return;
      }

      const response = await apiClient.get(`/document/${file.documentId}/view`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download file');
      setShowNotification(true);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading submission details...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="back-button" style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => router.back()} 
          className="back-button"
          type="button"
        >
          <FiArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Submissions
        </button>
      </div>
      <div className="product-header">
        <div>
          <div className="product-title">{submission.returnDefinition?.title || 'Unknown Report'}</div>
        </div>
        <span className={`status-badge ${submission.status === true ? 'status-active' : 'status-inactive'}`}>
          {submission.status}
        </span>
      </div>

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

      <div className="info-grid">
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiPackage style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Description</div>
              <div className="info-value">{submission.returnDefinition?.description || 'No description available.'}</div>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiPackage style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Regulatory Body</div>
              <div className="info-value"> {submission.returnDefinition?.regulatoryBody || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiPackage style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Department</div>
              <div className="info-value"> {submission.returnDefinition?.department?.departmentName || 'N/A'}</div>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiClock style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Period Start</div>
              <div className="info-value"> {formatDate(submission.periodStart)}</div>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiClock style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Period End</div>
              <div className="info-value">  {formatDate(submission.periodEnd)}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="info-grid">
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiClock style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Due Date</div>
              <div className="info-value"> {formatDate(submission.dueAt)} </div>
            </div>
          </div>
        </div>
        <div className="info-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>{<FiPackage style={{ color: '#006834' }} />}</div>
            <div>
              <div className="info-title">Frequency</div>
              <div className="info-value">{submission.returnDefinition?.frequency || 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Section - Show only when no files exist */}
      {!hasFiles && (
        <div className="action-card">
          <div className="action-header">
            <FiPaperclip className="action-icon" />
            <h3>Attach File</h3>
          </div>
          
          <div className="form-group">
            <label className="form-label">Owner Email:</label>
            <input
              type="email"
              value={attachingPersonEmail}
              onChange={(e) => setAttachingPersonEmail(e.target.value)}
              className="form-input"
              placeholder="Enter owner email"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Select File (Max 10MB):</label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="form-input"
            />
            {attachedFile && (
              <div className="file-selected">
                Selected: {attachedFile.name} ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
          
          <button
            onClick={handleAttachFile}
            disabled={uploading || !attachedFile || !attachingPersonEmail}
            className={`action-button ${uploading ? 'loading' : ''}`}
          >
            {uploading ? 'Uploading...' : 'Attach File'}
          </button>
        </div>
      )}

      {/* File Verification Section - Show when files exist but none are approved */}
      {hasFiles && !hasApprovedFile && !isSubmitted && (
        <div className="action-card">
          <div className="action-header">
            <FiEye className="action-icon" />
            <h3>Verify Attached Files</h3>
          </div>
          
          <div className="files-list">
            {/* {submission.files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.fileName}</div>
                  <div className={`file-status status-${file.status.toLowerCase()}`}>
                    {file.status}
                  </div>
                  <div className="file-uploaded">
                    Uploaded: {formatDate(file.uploadedAt)}
                  </div>
                  {file.documentId && (
                    <div className="file-document-id">
                      Document ID: {file.documentId}
                    </div>
                  )}
                </div>
                
                <div className="file-actions">
                  <button
                    onClick={() => viewFile(file.id, file.fileName)}
                    disabled={viewingFile === file.id || !file.documentId}
                    className="action-button secondary"
                    title="View File"
                  >
                    {viewingFile === file.id ? 'Opening...' : <FiEye />}
                  </button>
                  
                  <button
                    onClick={() => downloadFile(file.id, file.fileName)}
                    className="action-button secondary"
                    title="Download File"
                    disabled={!file.documentId}
                  >
                    <FiDownload />
                  </button>
                  
                  {file.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleVerifyFile(file.id, true)}
                        disabled={verifying}
                        className="action-button success"
                      >
                        {verifying ? 'Verifying...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleVerifyFile(file.id, false)}
                        disabled={verifying}
                        className="action-button danger"
                      >
                        {verifying ? 'Verifying...' : 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))} */}
          </div>
          
          <p className="action-description">
            Please review and verify the attached files before proceeding with submission.
          </p>

          <div className='stand-container'>
          {viewingFile ? (
  viewingFile.type.includes('pdf') ? (
    <iframe
      src={viewingFile.url}
      className="document-iframe"
      title="Document Viewer"
      width="100%"
      height="600px"
    />
  ) : viewingFile.type.startsWith('image/') ? (
    <img
      src={viewingFile.url}
      alt="Uploaded Document"
      style={{ width: '100%', maxHeight: '600px', objectFit: 'contain' }}
    />
  ) : (
    <p>Unsupported file format</p>
  )
) : (
  <div className="no-document">
    <FiFile size={48} style={{ color: '#bdc3c7', marginBottom: '1rem' }} />
    <h3>Document not available</h3>
    <p>Unable to load the document for preview.</p>
  </div>
)}

        </div>
        </div>
      )}

      {/* Send Submission Section - Show only when there's an approved file */}
      {hasApprovedFile && !isSubmitted && (
        <div className="action-card">
          <div className="action-header">
            <FiSend className="action-icon" />
            <h3>Send Submission</h3>
          </div>
          
          <div className="status-card success">
            <FiCheckCircle className="status-icon" />
            <div>
              <h4>File Approved</h4>
              <p>Your file has been verified and approved. You can now send the submission.</p>
            </div>
          </div>
          
          <p className="action-description">
            Fill in the email credentials to send this submission to the regulatory body.
          </p>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username:</label>
              <input
                type="text"
                name="username"
                value={emailCredentials.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Email username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password:</label>
              <input
                type="password"
                name="password"
                value={emailCredentials.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Email password"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject:</label>
            <input
              type="text"
              name="subject"
              value={emailCredentials.subject}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Email subject"
            />
          </div>

          <div className="form-group">
            <label className="form-label">CC Emails:</label>
            
            <div className="cc-input-group">
              <input
                type="text"
                value={ccInput}
                onChange={handleCcInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCcEmail();
                  }
                }}
                className="form-input"
                placeholder="Enter CC email and press Enter or click Add"
              />
              <button
                onClick={addCcEmail}
                disabled={!ccInput.trim() || !isValidEmail(ccInput.trim())}
                className="add-cc-button"
              >
                Add
              </button>
            </div>

            {emailCredentials.cc.length > 0 && (
              <div className="cc-recipients">
                <div className="cc-label">CC Recipients:</div>
                {emailCredentials.cc.map((email, index) => (
                  <div key={index} className="cc-tag">
                    {email}
                    <button
                      onClick={() => removeCcEmail(index)}
                      className="remove-cc-button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendSubmission}
            disabled={sending}
            className={`action-button primary ${sending ? 'loading' : ''}`}
          >
            {sending ? 'Sending...' : 'Send Submission'}
          </button>
        </div>
      )}

      {/* Completed Submission */}
      {isSubmitted && (
        <div className="status-card success">
          <FiCheckCircle className="status-icon" />
          <div>
            <h3>Submission Completed</h3>
            <p>This submission has been successfully submitted and cannot be modified.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionViewPage;