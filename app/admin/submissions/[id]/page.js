"use client"
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '../../../_utils/apiClient';
import Notification from '../../../_components/Notifications/page';
import '../../../globals.css';
import { 
  FiArrowLeft, 
  FiPackage, 
  FiMapPin, 
  FiPercent, 
  FiClock,
  FiGrid,
} from 'react-icons/fi';

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
  const [ownerEmail, setOwnerEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [submissionId]);

  const fetchSubmission = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/submissions/${submissionId}`);
      setSubmission(res);
      setOwnerEmail(res.returnDefinition?.department?.email || '');
    } catch (err) {
      setError(err.message);
      setShowNotification(true);
    } finally {
      setLoading(false);
    }
  };

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
      formData.append('ownerEmail', ownerEmail);

      await apiClient.postMultipart(
        `/api/v1/submissions/${submissionId}/attach`,
        formData
      );

      setSuccessMessage('File attached successfully!');
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

  const handleSendSubmission = async () => {
    if (!emailCredentials.username || !emailCredentials.password) {
      setError('Email credentials are required');
      setShowNotification(true);
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Build the URL with encoded CC parameters
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

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: '#ffc107',
      UPLOADED: '#17a2b8',
      SUBMITTED: '#28a745',
      OVERDUE: '#dc3545',
      CLOSED: '#6c757d'
    };
    
    return (
      <span 
        style={{
          padding: '4px 12px',
          borderRadius: '20px',
          backgroundColor: statusColors[status] || '#6c757d',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading submission details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ color: '#dc3545', marginBottom: '20px' }}>Error: {error}</div>
        <button 
          onClick={() => router.back()} 
          className="back-button"
          type="button"
        >
          <FiArrowLeft style={{ marginRight: '0.5rem' }} /> Back to Submissions
        </button>
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
        <span className={`status-badge ${submission.status === true ? 'status-active' : 'status-inactive'}`}>{getStatusBadge(submission.status)}</span>

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

        <>
          <div className="info-grid">

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
                <div>{<FiMapPin style={{ color: '#006834' }} />}</div>
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
            <div className="info-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div>{<FiPackage style={{ color: '#006834' }} />}</div>
                <div>
                  <div className="info-title">Description</div>
                  <div className="info-value">{submission.returnDefinition?.description || 'No description available.'}</div>
                </div>
              </div>
            </div>



          </div>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Attach File</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Owner Email:
          </label>
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter owner email"
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Select File (Max 10MB):
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {attachedFile && (
            <div style={{ marginTop: '10px', fontStyle: 'italic' }}>
              Selected: {attachedFile.name} ({(attachedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>
        
        <button
          onClick={handleAttachFile}
          disabled={uploading || !attachedFile || !ownerEmail}
          style={{
            padding: '10px 20px',
            backgroundColor: uploading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: uploading || !attachedFile || !ownerEmail ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? 'Uploading...' : 'Attach File'}
        </button>
      </div>

{/* Send Submission Section */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        padding: '20px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>Send Submission</h3>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Fill in the email credentials to send this submission to the regulatory body.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Username:
            </label>
            <input
              type="text"
              name="username"
              value={emailCredentials.username}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Email username"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Password:
            </label>
            <input
              type="password"
              name="password"
              value={emailCredentials.password}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Email password"
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Subject:
          </label>
          <input
            type="text"
            name="subject"
            value={emailCredentials.subject}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Email subject"
          />
        </div>

        {/* CC Emails Section */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            CC Emails:
          </label>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
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
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="Enter CC email and press Enter or click Add"
            />
            <button
              onClick={addCcEmail}
              disabled={!ccInput.trim() || !isValidEmail(ccInput.trim())}
              style={{
                padding: '10px 15px',
                backgroundColor: !ccInput.trim() || !isValidEmail(ccInput.trim()) ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !ccInput.trim() || !isValidEmail(ccInput.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              Add
            </button>
          </div>

          {emailCredentials.cc.length > 0 && (
            <div style={{ 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              padding: '10px',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>CC Recipients:</div>
              {emailCredentials.cc.map((email, index) => (
                <div
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#e9ecef',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    margin: '4px',
                    fontSize: '14px'
                  }}
                >
                  {email}
                  <button
                    onClick={() => removeCcEmail(index)}
                    style={{
                      marginLeft: '8px',
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
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
          disabled={sending || submission.status === 'SUBMITTED' || submission.status === 'CLOSED'}
          style={{
            padding: '10px 20px',
            backgroundColor: sending || submission.status === 'SUBMITTED' || submission.status === 'CLOSED' ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: sending || submission.status === 'SUBMITTED' || submission.status === 'CLOSED' ? 'not-allowed' : 'pointer'
          }}
        >
          {sending ? 'Sending...' : submission.status === 'SUBMITTED' || submission.status === 'CLOSED' ? 'Already Submitted' : 'Send Submission'}
        </button>
        
        {(submission.status === 'SUBMITTED' || submission.status === 'CLOSED') && (
          <p style={{ color: '#28a745', marginTop: '10px', fontWeight: 'bold' }}>
            This submission has already been submitted and cannot be sent again.
          </p>
        )}
      </div>
    </>
</div>
  );
};

export default SubmissionViewPage;