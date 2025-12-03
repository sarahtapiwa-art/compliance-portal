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
  FiEyeOff,
  FiDownload,
  FiFile, FiExternalLink
} from 'react-icons/fi';
import '../../../../styles/Submissions.css';
import {jwtDecode} from "jwt-decode";

const SubmissionViewPage = () => {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
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
  const [rejecting, setRejecting] = useState(false);
  const [viewingFile, setViewingFile] = useState(null);
  const [documentId, setDocumentId] = useState();
  const [fileType, setFileType] = useState(null); // 'pdf', 'image', 'unknown'

  const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'CLOSED';
  const hasFiles = submission?.status === 'UPLOADED'
  const isOverDue = submission?.status === 'OVERDUE';
  const isOverDueUploaded = submission?.status === 'UPLOADED_OVERDUE';
  const hasApprovedFile = document?.status === 'VERIFIED';
  const hasPendingFile = submission?.files?.some(file => file.status === 'PENDING');
  const pendingVerification = document?.status === 'PENDING_VERIFICATION';
  const [userRole, setUserRole] = useState('');
  const [decodedToken, setDecodedToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const fetchSubmission = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/submissions/${submissionId}`);
      setSubmission(res);
      setAttachingPersonEmail(res.returnDefinition.department.responsiblePersonEmail || '');
      const id = res.returnDefinition.documentId
      setDocumentId(id)
      // Fetching Document
      if (id){
          try {
            const res = await apiClient.get(`/api/v1/documents/${id}`);
            console.log('res', res);
            setDocument(res);

          } catch (err) {
            setError(err.message);
            setShowNotification(true);
          } finally {
            setLoading(false);
          }

      }

    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

  const needsVerification =
      !hasApprovedFile &&
      !isSubmitted &&
      pendingVerification &&
      userRole === 'ROLE_ADMIN' &&
      (isOverDueUploaded || hasFiles);


  const fetchData = async () => {
    try {
      const response = await apiClient.getAccessToken();
      if (response) {
        const tokenData = jwtDecode(response);
        setDecodedToken(tokenData);
        setUserRole(tokenData?.roles[0])
        console.log('Decoded Token: ', tokenData);

      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
    };
  }, []);

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
      // document.getElementById('file-input').value = '';
      
      await fetchSubmission();
    } catch (err) {
      setError(err.message || 'Failed to attach file');
      setShowNotification(true);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyDocument = async (documentId, approve) => {
    setVerifying(true);
    setError(null);

    try {
      const endpoint =  `/api/v1/documents/${documentId}?documentStatus=${approve}`;

      await apiClient.patch(endpoint,{});

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
  const handleRejectDocument = async (documentId, approve) => {
    setRejecting(true);
    setError(null);

    try {
      const endpoint =  `/api/v1/documents/${documentId}?documentStatus=${approve}`;

      await apiClient.patch(endpoint,{});

      setSuccessMessage(`File ${approve ? 'approved' : 'rejected'} successfully!`);
      setShowSuccessNotification(true);

      await fetchSubmission();
    } catch (err) {
      setError(err.message || `Failed to ${approve ? 'approve' : 'reject'} file`);
      setShowNotification(true);
    } finally {
      setRejecting(false);
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
    try {
      const id = submission?.returnDefinition?.documentId;
      if (!id) return;

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) throw new Error("Missing authentication token");

      const response = await fetch(`http://192.168.3.88:18000/api/v1/documents/${id}/view`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get content type from response headers
      const contentType = response.headers.get('content-type') || '';
      const contentDisposition = response.headers.get('content-disposition') || '';

      console.log('Content-Type:', contentType);
      console.log('Content-Disposition:', contentDisposition);

      const fileData = await response.arrayBuffer();

      if (!fileData || fileData.byteLength === 0) {
        throw new Error("Received empty file data");
      }

      // Determine file type and create appropriate blob
      let fileType = 'application/octet-stream';
      let fileCategory = 'unknown';

      // Map content types to categories
      if (contentType.includes('pdf')) {
        fileType = 'application/pdf';
        fileCategory = 'pdf';
      } else if (contentType.includes('image')) {
        fileType = contentType;
        fileCategory = 'image';
      } else if (
          contentType.includes('msword') ||
          contentType.includes('wordprocessingml') ||
          contentType.includes('officedocument.wordprocessingml')
      ) {
        fileType = contentType;
        fileCategory = 'word';
      } else if (
          contentType.includes('ms-excel') ||
          contentType.includes('spreadsheetml') ||
          contentType.includes('officedocument.spreadsheetml') ||
          contentType.includes('opendocument.spreadsheet')
      ) {
        fileType = contentType;
        fileCategory = 'excel';
      } else {
        // Fallback: try to determine from filename in content-disposition
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          const filename = filenameMatch[1].toLowerCase();
          if (filename.endsWith('.pdf')) {
            fileType = 'application/pdf';
            fileCategory = 'pdf';
          } else if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
            fileType = `image/${filename.split('.').pop()}`;
            fileCategory = 'image';
          } else if (filename.match(/\.(doc|docx)$/)) {
            fileType = 'application/msword';
            fileCategory = 'word';
          } else if (filename.match(/\.(xls|xlsx|ods)$/)) {
            fileType = 'application/vnd.ms-excel';
            fileCategory = 'excel';
          }
        }
      }

      const blob = new Blob([fileData], { type: fileType });
      const blobUrl = URL.createObjectURL(blob);

      console.log('File type detected:', { fileType, fileCategory });
      console.log('Blob URL created:', blobUrl);

      // Set state with file info
      setViewingFile(blobUrl);
      setDocumentUrl(blobUrl);
      setFileType(fileCategory);

    } catch (err) {
      console.error("Failed to load file:", err);
      setError(`Failed to view file: ${err.message}`);
      setShowNotification(true);
      setViewingFile(null);
      setFileType(null);
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
      {!hasFiles && !isOverDueUploaded && !pendingVerification && !hasApprovedFile &&(
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
      {needsVerification && (
        <div className="action-card">
          <div className="action-header">
            <FiEye className="action-icon" />
            <h3>Verify Attached Files</h3>
          </div>


          
          <p className="action-description">
            Please review and verify the attached files before proceeding with submission.
          </p>

          <div className='stand-container'>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>

              <a
                  href={viewingFile}
                  download="document"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#006834',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
              >
                <FiDownload style={{ marginRight: '0.5rem' }} />
                Download
              </a>
            </div>

            {viewingFile ? (
                <div className="file-preview-container">
                  {fileType === 'pdf' ? (
                      // PDF Viewer
                      <div className="pdf-viewer">
                        <iframe
                            src={`${viewingFile}#view=fitH`}
                            title="PDF Document Viewer"
                            width="100%"
                            height="600px"
                            style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                            onLoad={() => console.log('PDF loaded successfully')}
                            onError={() => {
                              console.error('PDF failed to load');
                              setError('Failed to display PDF document');
                            }}
                        />
                      </div>
                  ) : fileType === 'image' ? (
                      // Image Viewer
                      <div className="image-viewer">
                        <img
                            src={viewingFile}
                            alt="Document Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '600px',
                              display: 'block',
                              margin: '0 auto',
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onLoad={() => console.log('Image loaded successfully')}
                            onError={() => {
                              console.error('Image failed to load');
                              setError('Failed to display image');
                            }}
                        />
                      </div>
                  ) : fileType === 'word' || fileType === 'excel' ? (
                      // Office Documents - Show download option with preview message
                      <div className="office-document-viewer">
                        <div className="office-document-placeholder">
                          <FiFile size={64} style={{ color: '#006834', marginBottom: '1rem' }} />
                          <h3>Office Document</h3>
                          <p>
                            {fileType === 'word'
                                ? 'Word document cannot be previewed in browser.'
                                : 'Excel spreadsheet cannot be previewed in browser.'
                            }
                          </p>
                          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                            Please download the file to view its contents.
                          </p>
                          <div className="office-document-actions">
                            <a
                                href={viewingFile}
                                download={`document.${fileType === 'word' ? 'docx' : 'xlsx'}`}
                                className="download-button primary"
                                style={{
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: '#006834',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontWeight: '500'
                                }}
                            >
                              <FiDownload />
                              Download {fileType === 'word' ? 'Word Document' : 'Excel Spreadsheet'}
                            </a>
                            <button
                                onClick={() => window.open(viewingFile, '_blank')}
                                className="open-external-button"
                                style={{
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: 'transparent',
                                  color: '#006834',
                                  border: '1px solid #006834',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontWeight: '500',
                                  cursor: 'pointer'
                                }}
                            >
                              <FiExternalLink />
                              Open in New Tab
                            </button>
                          </div>
                        </div>
                      </div>
                  ) : (
                      // Fallback for unknown file types
                      <div className="unknown-file-type">
                        <FiFile size={48} style={{ color: '#e74c3c', marginBottom: '1rem' }} />
                        <h3>Unsupported File Type</h3>
                        <p>This file type cannot be previewed in the browser.</p>
                        <div className="file-actions">
                          <a
                              href={viewingFile}
                              download="document"
                              className="download-button"
                              style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#006834',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontWeight: '500'
                              }}
                          >
                            <FiDownload />
                            Download File
                          </a>
                        </div>
                      </div>
                  )}

                  {/* Common actions for all file types */}
                  <div className="viewer-actions" style={{ marginTop: '1rem', padding: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <a
                          href={viewingFile}
                          download="document"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#006834',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                      >
                        <FiDownload />
                        Download
                      </a>

                      {document?.status === 'PENDING_VERIFICATION' && userRole === 'ROLE_ADMIN' && (
                          <>
                            <button
                                onClick={() => handleVerifyDocument(document.id, 'VERIFIED')}
                                disabled={verifying}
                                className="action-button success"
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#006834',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  cursor: 'pointer'
                                }}
                            >
                              <FiCheckCircle />
                              {verifying ? 'Verifying...' : 'Approve'}
                            </button>
                            <button
                                onClick={() => handleRejectDocument(document.id, 'REJECTED')}
                                disabled={rejecting}
                                className="action-button danger"
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  cursor: 'pointer'
                                }}
                            >
                              {rejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                      )}
                    </div>
                  </div>
                </div>
            ) : (
                // No document available
                <div className="no-document">
                  <FiFile size={48} style={{ color: '#bdc3c7', marginBottom: '1rem' }} />
                  <h3>Document not available</h3>
                  <p>Unable to load the document for preview.</p>
                </div>
            )}


          </div>
        </div>
      )}

      {!hasApprovedFile && !isSubmitted && isOverDue && userRole === 'ROLE_ADMIN' && (
          <div className="action-card">
            <div className="action-header">
              <FiEye className="action-icon" />
              <h3>Verify Attached Files</h3>
            </div>



            <p className="action-description">
              Please review and verify the attached files before proceeding with submission.
            </p>

            <div className='stand-container'>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>

                <a
                    href={viewingFile}
                    download="document"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#006834',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      display: 'inline-block',
                    }}
                >
                  <FiDownload style={{ marginRight: '0.5rem' }} />
                  Download
                </a>
              </div>

              {viewingFile ? (
                  <div className="file-preview-container">
                    {fileType === 'pdf' ? (
                        // PDF Viewer
                        <div className="pdf-viewer">
                          <iframe
                              src={`${viewingFile}#view=fitH`}
                              title="PDF Document Viewer"
                              width="100%"
                              height="600px"
                              style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                              onLoad={() => console.log('PDF loaded successfully')}
                              onError={() => {
                                console.error('PDF failed to load');
                                setError('Failed to display PDF document');
                              }}
                          />
                        </div>
                    ) : fileType === 'image' ? (
                        // Image Viewer
                        <div className="image-viewer">
                          <img
                              src={viewingFile}
                              alt="Document Preview"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '600px',
                                display: 'block',
                                margin: '0 auto',
                                borderRadius: '4px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }}
                              onLoad={() => console.log('Image loaded successfully')}
                              onError={() => {
                                console.error('Image failed to load');
                                setError('Failed to display image');
                              }}
                          />
                        </div>
                    ) : fileType === 'word' || fileType === 'excel' ? (
                        // Office Documents - Show download option with preview message
                        <div className="office-document-viewer">
                          <div className="office-document-placeholder">
                            <FiFile size={64} style={{ color: '#006834', marginBottom: '1rem' }} />
                            <h3>Office Document</h3>
                            <p>
                              {fileType === 'word'
                                  ? 'Word document cannot be previewed in browser.'
                                  : 'Excel spreadsheet cannot be previewed in browser.'
                              }
                            </p>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                              Please download the file to view its contents.
                            </p>
                            <div className="office-document-actions">
                              <a
                                  href={viewingFile}
                                  download={`document.${fileType === 'word' ? 'docx' : 'xlsx'}`}
                                  className="download-button primary"
                                  style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#006834',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '500'
                                  }}
                              >
                                <FiDownload />
                                Download {fileType === 'word' ? 'Word Document' : 'Excel Spreadsheet'}
                              </a>
                              <button
                                  onClick={() => window.open(viewingFile, '_blank')}
                                  className="open-external-button"
                                  style={{
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: 'transparent',
                                    color: '#006834',
                                    border: '1px solid #006834',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                  }}
                              >
                                <FiExternalLink />
                                Open in New Tab
                              </button>
                            </div>
                          </div>
                        </div>
                    ) : (
                        // Fallback for unknown file types
                        <div className="unknown-file-type">
                          <FiFile size={48} style={{ color: '#e74c3c', marginBottom: '1rem' }} />
                          <h3>Unsupported File Type</h3>
                          <p>This file type cannot be previewed in the browser.</p>
                          <div className="file-actions">
                            <a
                                href={viewingFile}
                                download="document"
                                className="download-button"
                                style={{
                                  padding: '0.75rem 1.5rem',
                                  backgroundColor: '#006834',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  fontWeight: '500'
                                }}
                            >
                              <FiDownload />
                              Download File
                            </a>
                          </div>
                        </div>
                    )}

                    {/* Common actions for all file types */}
                    <div className="viewer-actions" style={{ marginTop: '1rem', padding: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <a
                            href={viewingFile}
                            download="document"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#006834',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                        >
                          <FiDownload />
                          Download
                        </a>

                        {document?.status === 'PENDING_VERIFICATION' && userRole === 'ROLE_ADMIN' && (
                            <>
                              <button
                                  onClick={() => handleVerifyDocument(document.id, 'VERIFIED')}
                                  disabled={verifying}
                                  className="action-button success"
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#006834',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                  }}
                              >
                                <FiCheckCircle />
                                {verifying ? 'Verifying...' : 'Approve'}
                              </button>
                              <button
                                  onClick={() => handleRejectDocument(document.id, 'REJECTED')}
                                  disabled={rejecting}
                                  className="action-button danger"
                                  style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer'
                                  }}
                              >
                                {rejecting ? 'Rejecting...' : 'Reject'}
                              </button>
                            </>
                        )}
                      </div>
                    </div>
                  </div>
              ) : (
                  // No document available
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
      {hasApprovedFile && !isSubmitted && userRole === 'ROLE_USER' && (
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
                <div className="password-input-container">
                  <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={emailCredentials.password}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Email password"
                  />
                  <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
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
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#006834',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}
                className={`action-button primary ${sending ? 'loading' : ''}`}
            >
              {sending ? 'Sending...' : 'Send Submission'}
            </button>
          </div>
      )}
      {/* Completed Submission */}
      {hasApprovedFile && !isSubmitted && userRole === 'ROLE_ADMIN' &&(
          <div className="status-card success">
            <FiCheckCircle className="status-icon" />
            <div>
              <h3>File Verified</h3>
              <p>File has been successfully verified.</p>
            </div>
          </div>
      )}
      {pendingVerification  && userRole === 'ROLE_USER' &&(
          <div className="status-card success">
            <FiCheckCircle className="status-icon" />
            <div>
              <h3>File Uploaded</h3>
              <p>File is pending verification.</p>
            </div>
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