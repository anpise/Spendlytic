import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchBills } from '../services/api';

interface BillItem {
  id: number;
  description: string;
  price: string;
  quantity: number;
  category?: string;
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
  const [filter, setFilter] = useState<'yearly' | 'monthly' | 'weekly'>('monthly');
  const [activeTab, setActiveTab] = useState<'table' | 'analytics'>('table');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchBills()
      .then(res => {
        if (res.data && Array.isArray(res.data.bills)) {
          setBills(res.data.bills as Bill[]);
          // Dispatch a custom event to update bill count in Navbar
          window.dispatchEvent(new CustomEvent('updateBillCount', { detail: (res.data.bills as Bill[]).length }));
          if ((res.data.bills as Bill[]).length === 0) {
            navigate('/upload');
          }
        } else {
          setBills([]);
          window.dispatchEvent(new CustomEvent('updateBillCount', { detail: 0 }));
          navigate('/upload');
        }
      })
      .catch(err => {
        setBills([]);
        setError('Failed to fetch bills');
        window.dispatchEvent(new CustomEvent('updateBillCount', { detail: 0 }));
        navigate('/upload');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const toggleExpand = (id: number) => {
    setExpandedBillId(expandedBillId === id ? null : id);
  };

  // --- Analytics Data Aggregation ---
  function getYearlyData() {
    const yearlyTotals: { [key: string]: number } = {};
    bills.forEach(bill => {
      if (!bill.date) return;
      const date = new Date(bill.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}`;
      yearlyTotals[key] = (yearlyTotals[key] || 0) + parseFloat(bill.total_amount);
    });
    return Object.entries(yearlyTotals)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([key, total]) => ({
        label: key,
        total: Number(total.toFixed(2)),
      }));
  }

  function getMonthlyData() {
    const monthlyTotals: { [key: string]: number } = {};
    bills.forEach(bill => {
      if (!bill.date) return;
      const date = new Date(bill.date);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // e.g. '2025-4'
      monthlyTotals[key] = (monthlyTotals[key] || 0) + parseFloat(bill.total_amount);
    });
    // Sort by date
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([key, total]) => {
        const [year, month] = key.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return {
          label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          total: Number(total.toFixed(2)),
        };
      });
  }

  function getWeeklyData() {
    const weeklyTotals: { [key: string]: number } = {};
    bills.forEach(bill => {
      if (!bill.date) return;
      const date = new Date(bill.date);
      if (isNaN(date.getTime())) return;
      // Get ISO week number
      const year = date.getFullYear();
      const firstJan = new Date(date.getFullYear(), 0, 1);
      const days = Math.floor((date.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
      const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
      const key = `${year}-W${week}`;
      weeklyTotals[key] = (weeklyTotals[key] || 0) + parseFloat(bill.total_amount);
    });
    // Sort by week
    return Object.entries(weeklyTotals)
      .sort(([a], [b]) => new Date(a.split('-W')[0]).getTime() - new Date(b.split('-W')[0]).getTime() || Number(a.split('-W')[1]) - Number(b.split('-W')[1]))
      .map(([key, total]) => {
        const [year, week] = key.split('-W');
        return {
          label: `W${week} ${year}`,
          total: Number(total.toFixed(2)),
        };
      });
  }

  let chartData: { label: string; total: number }[] = [];
  if (filter === 'yearly') chartData = getYearlyData();
  else if (filter === 'monthly') chartData = getMonthlyData();
  else chartData = getWeeklyData();

  return (
    <div className="dashboard-root" style={{ padding: '2.5rem 1rem', maxWidth: 1000, margin: '100px auto 0 auto' }}>
      <div className="dashboard-scroll">
        <h1 className="dashboard-title" style={{ color: '#bfdbfe', fontWeight: 700, fontSize: '2rem', marginBottom: '2.2rem', textAlign: 'center', letterSpacing: '0.01em' }}>
          Analytics Dashboard
        </h1>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@500;700&display=swap');
          .dashboard-root, .dashboard-root * {
            font-family: 'Inter', 'Montserrat', Arial, sans-serif;
            color: #bfdbfe;
          }
          .dashboard-tabs {
            display: flex;
            gap: 1.5rem;
            margin-bottom: 2.2rem;
          }
          .dashboard-tab-btn {
            background: none;
            border: none;
            color: #bfdbfe;
            font-size: 1.15rem;
            font-weight: 700;
            padding: 0.7rem 1.5rem 0.7rem 1.5rem;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            transition: color 0.2s;
            opacity: 0.8;
          }
          .dashboard-tab-btn.active, .dashboard-tab-btn:focus {
            color: #bfdbfe;
            opacity: 1;
            border-bottom: 2px solid #60a5fa;
          }
          .analytics-filter-btns {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.2rem;
          }
          .analytics-filter-btn {
            background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%);
            color: #bfdbfe;
            font-weight: 600;
            border: none;
            border-radius: 5px;
            padding: 0.5rem 1.2rem;
            font-size: 1rem;
            cursor: pointer;
            transition: color 0.3s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(59,130,246,0.08);
          }
          .analytics-filter-btn.active, .analytics-filter-btn:focus {
            color: #e0e7ef;
          }
          .analytics-chart-card {
            background: rgba(30,58,138,0.10);
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(30,58,138,0.08);
            padding: 1.5rem;
            margin-bottom: 2.5rem;
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
            background: rgba(30,58,138,0.18);
            border-radius: 16px;
            box-shadow: 0 2px 12px rgba(30,58,138,0.10);
            padding: 1.3rem 1.5rem 1.1rem 1.5rem;
            margin: 0.7rem 0 1.1rem 0;
          }
          .bill-items-card h4 {
            color: #3b82f6;
            margin-bottom: 1.1rem;
            font-size: 1.13rem;
            font-family: 'Montserrat', 'Inter', Arial, sans-serif;
            font-weight: 700;
            letter-spacing: 0.01em;
          }
          .bill-item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(59,130,246,0.13);
            font-size: 1.04rem;
            transition: background 0.18s;
          }
          .bill-item-row:last-child {
            border-bottom: none;
          }
          .bill-item-desc {
            color: #bfdbfe;
            font-weight: 500;
            font-family: 'Montserrat', 'Inter', Arial, sans-serif;
            flex: 1;
            word-break: break-word;
          }
          .bill-item-meta {
            color: #7dd3fc;
            font-size: 1.04rem;
            font-family: 'Inter', 'Montserrat', Arial, sans-serif;
            font-weight: 600;
            min-width: 110px;
            text-align: right;
            letter-spacing: 0.01em;
          }
          .dashboard-title {
            font-family: 'Montserrat', 'Inter', Arial, sans-serif;
            color: #7dd3fc;
          }
          th {
            color: #7dd3fc !important;
          }
          .bill-item-category {
            display: inline-block;
            margin-left: 0.7em;
            background: #233e5c;
            color: #7dd3fc;
            font-size: 0.85em;
            font-weight: 600;
            border-radius: 6px;
            padding: 0.13em 0.7em 0.13em 0.7em;
            vertical-align: middle;
            letter-spacing: 0.02em;
          }
        `}</style>
        {/* --- Tabs --- */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab-btn${activeTab === 'table' ? ' active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            Bills Table
          </button>
          <button
            className={`dashboard-tab-btn${activeTab === 'analytics' ? ' active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
        {/* --- End Tabs --- */}
        {activeTab === 'analytics' && (
          <div className="analytics-chart-card">
            <div className="analytics-filter-btns">
              <button
                className={`analytics-filter-btn${filter === 'yearly' ? ' active' : ''}`}
                onClick={() => setFilter('yearly')}
              >
                Yearly
              </button>
              <button
                className={`analytics-filter-btn${filter === 'monthly' ? ' active' : ''}`}
                onClick={() => setFilter('monthly')}
              >
                Monthly
              </button>
              <button
                className={`analytics-filter-btn${filter === 'weekly' ? ' active' : ''}`}
                onClick={() => setFilter('weekly')}
              >
                Weekly
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#233e5c" />
                <XAxis dataKey="label" stroke="#7dd3fc" fontSize={14} tickLine={false} axisLine={false} />
                <YAxis stroke="#7dd3fc" fontSize={14} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`}/>
                <Tooltip contentStyle={{ background: '#1e3357', border: 'none', borderRadius: 8, color: '#7dd3fc' }} labelStyle={{ color: '#7dd3fc' }} formatter={v => [`$${v}`, 'Total']} />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fill: '#7dd3fc', fontWeight: 700, formatter: (v: number) => `$${v}` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === 'table' && (
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
                                <span className="bill-item-desc">
                                  {item.description}
                                  {item.category && (
                                    <span className="bill-item-category">{item.category}</span>
                                  )}
                                </span>
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
        {loading && <div className="loader"><div className="loader-spinner"></div></div>}
        {error && <div className="upload-status error">{error}</div>}
      </div>
    </div>
  );
};

export default Dashboard; 