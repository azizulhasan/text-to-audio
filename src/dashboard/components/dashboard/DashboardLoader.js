import React from 'react';

export default function DashboardLoader() {
    return (
        <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
            <div className="text-center">
                <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading...</p>
            </div>
        </div>
    );
}
