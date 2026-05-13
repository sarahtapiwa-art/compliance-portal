"use client";
import { useState, useEffect } from 'react';
import { apiClient } from '../../_utils/apiClient';

export default function RiskPage() {
    const [risks, setRisks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchRisks();
    }, []);

    const fetchRisks = async () => {
        setIsLoading(true);
        try {
            const data = await apiClient.get('/api/v1/risk/submissions');
            setRisks(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load risk assessments');
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = filter === 'ALL' ? risks : risks.filter(r => r.riskLevel === filter);

    const counts = {
        HIGH: risks.filter(r => r.riskLevel === 'HIGH').length,
        MEDIUM: risks.filter(r => r.riskLevel === 'MEDIUM').length,
        LOW: risks.filter(r => r.riskLevel === 'LOW').length,
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Risk Assessment</h1>
                <p style={{ color: '#6b7280', marginTop: '4px' }}>ML-powered deadline risk prediction</p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>HIGH RISK</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{counts.HIGH}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Immediate attention needed</p>
                </div>
                <div style={{ backgroundColor: '#fffbeb', borderRadius: '8px', padding: '16px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>MEDIUM RISK</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{counts.MEDIUM}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>Monitor closely</p>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '16px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>LOW RISK</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>{counts.LOW}</p>
                    <p style={{ color: '#6b7280', fontSize: '12px' }}>On track</p>
                </div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                        backgroundColor: filter === f ? '#166534' : '#e5e7eb',
                        color: filter === f ? 'white' : '#374151', fontWeight: '500', fontSize: '14px'
                    }}>{f}</button>
                ))}
                <button onClick={fetchRisks} style={{
                    marginLeft: 'auto', padding: '6px 16px', borderRadius: '6px',
                    backgroundColor: '#166534', color: 'white', border: 'none', cursor: 'pointer'
                }}>Refresh</button>
            </div>

            {/* Risk Table */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading risk assessments...</div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444' }}>{error}</div>
            ) : (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SUBMISSION</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DEPARTMENT</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>STATUS</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>DAYS LEFT</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>RISK SCORE</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>RISK LEVEL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>No submissions found</td></tr>
                            ) : filtered.map((risk, index) => (
                                <tr key={risk.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                                    <td style={{ padding: '12px 16px', fontWeight: '500', color: '#1f2937' }}>{risk.title}</td>
                                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{risk.department}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e5e7eb', color: '#374151' }}>
                                            {risk.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: risk.daysRemaining < 0 ? '#ef4444' : risk.daysRemaining <= 3 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                                        {risk.daysRemaining < 0 ? `${Math.abs(risk.daysRemaining)} days overdue` : `${risk.daysRemaining} days`}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                                                <div style={{ width: `${risk.riskScore * 100}%`, backgroundColor: risk.color, borderRadius: '4px', height: '8px' }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#6b7280' }}>{(risk.riskScore * 100).toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{ backgroundColor: risk.color, color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                                            {risk.riskLevel}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}