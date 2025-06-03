import React, { useEffect, useState } from 'react';

interface BillItem {
  id: number;
  description: string;
  price: string;
  quantity: number;
}

interface Bill {
  id: number;
  merchant_name: string;
  total_amount: string;
  date: string;
  created_at: string;
  items: BillItem[];
}

// Helper to format date as '26th May 2025'
function formatPrettyDate(dateStr: string) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  // Get ordinal suffix
  const j = day % 10, k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';
  return `${day}${suffix} ${month} ${year}`;
}

const Dashboard: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBillId, setExpandedBillId] = useState<number | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5000/api/bills', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setBills(data.bills || []);
        } else {
          const data = await res.json();
          setError(data.message || 'Failed to fetch bills');
        }
      } catch (err) {
        setError('Failed to fetch bills');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedBillId(expandedBillId === id ? null : id);
  };

  return (
    <div className="dashboard-root" style={{ padding: '2.5rem 1rem', maxWidth: 1000, margin: '100px auto 0 auto' }}>
      <h1 className="dashboard-title" style={{ color: '#3b82f6', fontWeight: 700, fontSize: '2rem', marginBottom: '2rem' }}>
        Your Bills
      </h1>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@500;700&display=swap');
        .dashboard-root, .dashboard-root * {
          font-family: 'Inter', 'Montserrat', Arial, sans-serif;
          color: #f3f6fa;
        }
        .bill-row {
          transition: background 0.18s;
        }
        .bill-row:hover {
          background: rgba(59,130,246,0.13);
        }
        .dropdown-arrow {
          display: inline-block;
          margin-right: 10px;
          transition: transform 0.25s cubic-bezier(.4,2,.6,1);
          font-size: 1.1rem;
          color: #60a5fa;
        }
        .dropdown-arrow.expanded {
          transform: rotate(90deg);
        }
        .bill-items-card {
          background: rgba(59,130,246,0.10);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(59,130,246,0.08);
          padding: 1.1rem 1.2rem 1rem 2.2rem;
          margin: 0.5rem 0 0.7rem 0;
        }
        .bill-items-card h4 {
          color: #7dd3fc;
          margin-bottom: 0.7rem;
          font-size: 1.08rem;
          font-family: 'Montserrat', 'Inter', Arial, sans-serif;
        }
        .bill-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.35rem 0;
          border-bottom: 1px solid rgba(59,130,246,0.08);
          font-size: 1rem;
        }
        .bill-item-row:last-child {
          border-bottom: none;
        }
        .bill-item-desc {
          color: #f3f6fa;
          font-weight: 500;
          font-family: 'Montserrat', 'Inter', Arial, sans-serif;
        }
        .bill-item-meta {
          color: #7dd3fc;
          font-size: 0.98rem;
          font-family: 'Inter', 'Montserrat', Arial, sans-serif;
        }
        .dashboard-title {
          font-family: 'Montserrat', 'Inter', Arial, sans-serif;
          color: #7dd3fc;
        }
        th {
          color: #7dd3fc !important;
        }
      `}</style>
      {loading && <div className="loader"><div className="loader-spinner"></div></div>}
      {error && <div className="upload-status error">{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX: 'auto', background: 'rgba(30,58,138,0.10)', borderRadius: 16, boxShadow: '0 2px 12px rgba(30,58,138,0.08)', padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
            <thead>
              <tr style={{ background: 'rgba(59,130,246,0.12)' }}>
                <th style={{ padding: '0.7rem', textAlign: 'left', color: '#3b82f6', fontWeight: 700, width: 40 }}></th>
                <th style={{ padding: '0.7rem', textAlign: 'left', color: '#3b82f6', fontWeight: 700 }}>Merchant</th>
                <th style={{ padding: '0.7rem', textAlign: 'left', color: '#3b82f6', fontWeight: 700 }}>Amount</th>
                <th style={{ padding: '0.7rem', textAlign: 'left', color: '#3b82f6', fontWeight: 700 }}>Transaction Date</th>
                <th style={{ padding: '0.7rem', textAlign: 'left', color: '#3b82f6', fontWeight: 700 }}>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#b6baff', padding: '1.5rem' }}>No bills found.</td></tr>
              )}
              {bills.map(bill => (
                <React.Fragment key={bill.id}>
                  <tr className="bill-row" onClick={() => toggleExpand(bill.id)} style={{ borderBottom: '1px solid #233e5c', cursor: 'pointer' }}>
                    <td style={{ padding: '0.7rem', width: 40 }}>
                      <span className={`dropdown-arrow${expandedBillId === bill.id ? ' expanded' : ''}`}>▶</span>
                    </td>
                    <td style={{ padding: '0.7rem', fontWeight: 500 }}>{bill.merchant_name}</td>
                    <td style={{ padding: '0.7rem' }}>${bill.total_amount}</td>
                    <td style={{ padding: '0.7rem' }}>{bill.date ? formatPrettyDate(bill.date) : 'N/A'}</td>
                    <td style={{ padding: '0.7rem' }}>{bill.created_at ? formatPrettyDate(bill.created_at) : 'N/A'}</td>
                  </tr>
                  {expandedBillId === bill.id && bill.items && bill.items.length > 0 && (
                    <tr>
                      <td colSpan={5} style={{ border: 'none', padding: 0 }}>
                        <div className="bill-items-card">
                          <h4>Items:</h4>
                          {bill.items.map((item) => (
                            <div key={item.id} className="bill-item-row">
                              <span className="bill-item-desc">{item.description}</span>
                              <span className="bill-item-meta">${item.price} × {item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 