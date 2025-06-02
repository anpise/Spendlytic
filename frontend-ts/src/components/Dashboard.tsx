import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div style={{ padding: '2.5rem 1rem', maxWidth: 900, margin: '80px auto 0 auto' }}>
      <h1 style={{ color: '#764ba2', fontWeight: 700, fontSize: '2rem', marginBottom: '2rem' }}>
        Welcome to your Dashboard
      </h1>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, minWidth: 220, background: 'linear-gradient(135deg, #a78bfa 0%, #667eea 100%)', borderRadius: 16, color: '#fff', padding: '1.5rem', boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>Total Spent</div>
          <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>$2,350</div>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: 'linear-gradient(135deg, #764ba2 0%, #a78bfa 100%)', borderRadius: 16, color: '#fff', padding: '1.5rem', boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>Bills Uploaded</div>
          <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>12</div>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, color: '#fff', padding: '1.5rem', boxShadow: '0 2px 12px rgba(102, 126, 234, 0.08)' }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 8 }}>AI Insights</div>
          <div style={{ fontWeight: 700, fontSize: '1.5rem' }}>3</div>
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(102, 126, 234, 0.06)', padding: '1.5rem', minHeight: 200 }}>
        <h2 style={{ color: '#764ba2', fontWeight: 600, fontSize: '1.2rem', marginBottom: '1rem' }}>Recent Transactions</h2>
        <div style={{ color: '#888', fontStyle: 'italic' }}>
          (Your recent transactions will appear here.)
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 