import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { fetchBills, deleteBill, fetchBillPreviewUrl } from '../services/api';

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
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; billId: number | null; merchantName: string; date: string; amount: string }>({
    show: false,
    billId: null,
    merchantName: '',
    date: '',
    amount: ''
  });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [previewModal, setPreviewModal] = useState<{ show: boolean; imageUrl: string; merchantName: string }>({ show: false, imageUrl: '', merchantName: '' });
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

  const handleDeleteBill = (billId: number, merchantName: string, date: string, amount: string) => {
    setDeleteModal({
      show: true,
      billId,
      merchantName,
      date,
      amount
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.billId) return;
    
    try {
      await deleteBill(deleteModal.billId);
      // Remove the bill from the local state
      setBills(prevBills => prevBills.filter(bill => bill.id !== deleteModal.billId));
      // Update bill count
      window.dispatchEvent(new CustomEvent('updateBillCount', { detail: bills.length - 1 }));
      // If no bills left, redirect to upload
      if (bills.length - 1 === 0) {
        navigate('/upload');
      }
      // Close modal
      setDeleteModal({ show: false, billId: null, merchantName: '', date: '', amount: '' });
      setToast({ show: true, message: `Bill deleted successfully!`, type: 'success' });
      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      console.error('Failed to delete bill:', error);
      setToast({ show: true, message: 'Failed to delete bill. Please try again.', type: 'error' });
      // Auto-hide error toast after 4 seconds
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, billId: null, merchantName: '', date: '', amount: '' });
  };

  const handleViewBill = async (billId: number, merchantName: string) => {
    try {
      const res = await fetchBillPreviewUrl(billId);
      setPreviewModal({ show: true, imageUrl: res.data.signed_url, merchantName });
    } catch (error) {
      console.error('Failed to fetch preview URL:', error);
      setToast({ show: true, message: 'Failed to load bill preview. Please try again.', type: 'error' });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };
  const closePreviewModal = () => setPreviewModal({ show: false, imageUrl: '', merchantName: '' });

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
                <Tooltip 
                  contentStyle={{ background: 'rgba(35, 62, 92, 0.95)', border: 'none', borderRadius: 8, color: '#7dd3fc' }} 
                  labelStyle={{ color: '#7dd3fc' }} 
                  formatter={v => [`$${v}`, 'Total']} 
                  cursor={{ fill: 'none' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={40} label={{ position: 'top', fill: '#7dd3fc', fontWeight: 700, formatter: (v: number) => `$${v}` }} activeBar={false} />
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
                  <th style={{ padding: '0.7rem', textAlign: 'center', color: '#3b82f6', fontWeight: 700, width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#b6baff', padding: '1.5rem' }}>No bills found.</td></tr>
                )}
                {bills.map(bill => (
                  <React.Fragment key={bill.id}>
                    <tr className="bill-row" style={{ borderBottom: '1px solid #233e5c' }}>
                      <td style={{ padding: '0.7rem', width: 40, cursor: 'pointer' }} onClick={() => toggleExpand(bill.id)}>
                        <span className={`dropdown-arrow${expandedBillId === bill.id ? ' expanded' : ''}`}>▶</span>
                      </td>
                      <td style={{ padding: '0.7rem', fontWeight: 500, cursor: 'pointer' }} onClick={() => toggleExpand(bill.id)}>{bill.merchant_name}</td>
                      <td style={{ padding: '0.7rem', cursor: 'pointer' }} onClick={() => toggleExpand(bill.id)}>${bill.total_amount}</td>
                      <td style={{ padding: '0.7rem', cursor: 'pointer' }} onClick={() => toggleExpand(bill.id)}>{bill.date ? formatPrettyDate(bill.date) : 'N/A'}</td>
                      <td style={{ padding: '0.7rem', cursor: 'pointer' }} onClick={() => toggleExpand(bill.id)}>{bill.created_at ? formatPrettyDate(bill.created_at) : 'N/A'}</td>
                      <td style={{ padding: '0.7rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBill(bill.id, bill.merchant_name, bill.date || 'N/A', bill.total_amount);
                          }}
                          style={{
                            background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                            marginRight: '0.5rem'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewBill(bill.id, bill.merchant_name);
                          }}
                          style={{
                            background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)';
                          }}
                        >
                          View
                        </button>
                        {/* Future button goes here */}
                        </div>
                      </td>
                    </tr>
                    {expandedBillId === bill.id && bill.items && bill.items.length > 0 && (
                      <tr>
                        <td colSpan={6} style={{ border: 'none', padding: 0 }}>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(71, 85, 105, 0.3)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
                         <div style={{
               textAlign: 'center',
               marginBottom: '1.5rem'
             }}>
               <h3 style={{
                 color: '#ffffff',
                 fontSize: '1.25rem',
                 fontWeight: '700',
                 marginBottom: '0.5rem',
                 fontFamily: 'Montserrat, Inter, Arial, sans-serif'
               }}>
                 Delete Bill
               </h3>
               <p style={{
                 color: '#cbd5e1',
                 fontSize: '1rem',
                 lineHeight: '1.5',
                 margin: 0
               }}>
                 Are you sure you want to delete this bill?
               </p>
              
                             <div style={{
                 background: 'rgba(51, 65, 85, 0.3)',
                 borderRadius: '8px',
                 padding: '1rem',
                 margin: '1rem 0',
                 border: '1px solid rgba(71, 85, 105, 0.2)'
               }}>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   marginBottom: '0.5rem'
                 }}>
                   <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Merchant:</span>
                   <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500' }}>
                     {deleteModal.merchantName}
                   </span>
                 </div>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center',
                   marginBottom: '0.5rem'
                 }}>
                   <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Date:</span>
                   <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500' }}>
                     {deleteModal.date ? formatPrettyDate(deleteModal.date) : 'N/A'}
                   </span>
                 </div>
                 <div style={{
                   display: 'flex',
                   justifyContent: 'space-between',
                   alignItems: 'center'
                 }}>
                   <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Amount:</span>
                   <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '500' }}>
                     ${deleteModal.amount}
                   </span>
                 </div>
               </div>
              
              <p style={{
                color: '#94a3b8',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                fontStyle: 'italic'
              }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
                             <button
                 onClick={cancelDelete}
                 style={{
                   background: 'rgba(71, 85, 105, 0.2)',
                   color: '#cbd5e1',
                   border: '1px solid rgba(71, 85, 105, 0.4)',
                   borderRadius: '8px',
                   padding: '0.75rem 1.5rem',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   minWidth: '100px'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.background = 'rgba(71, 85, 105, 0.3)';
                   e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.6)';
                   e.currentTarget.style.color = '#e2e8f0';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.background = 'rgba(71, 85, 105, 0.2)';
                   e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.4)';
                   e.currentTarget.style.color = '#cbd5e1';
                 }}
               >
                 Cancel
               </button>
               <button
                 onClick={confirmDelete}
                 style={{
                   background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                   color: '#ffffff',
                   border: 'none',
                   borderRadius: '8px',
                   padding: '0.75rem 1.5rem',
                   fontSize: '0.875rem',
                   fontWeight: '600',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease',
                   minWidth: '100px',
                   boxShadow: '0 4px 8px rgba(220, 38, 38, 0.2)'
                 }}
                 onMouseOver={(e) => {
                   e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
                   e.currentTarget.style.transform = 'translateY(-1px)';
                   e.currentTarget.style.boxShadow = '0 6px 12px rgba(220, 38, 38, 0.3)';
                 }}
                 onMouseOut={(e) => {
                   e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                   e.currentTarget.style.transform = 'translateY(0)';
                   e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.2)';
                 }}
               >
                 Delete
               </button>
            </div>
          </div>
        </div>
      )}

             {/* Toast Notification */}
       {toast.show && (
                  <div style={{
           position: 'fixed',
           top: '100px',
           right: '20px',
           backgroundColor: toast.type === 'success' ? '#4CAF50' : '#F44336',
           color: '#ffffff',
           padding: '15px 25px',
           borderRadius: '8px',
           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
           zIndex: 10000,
           display: 'flex',
           alignItems: 'center',
           gap: '10px',
           opacity: 0.9,
           animation: 'toastSlideIn 0.5s ease-out',
           fontWeight: '500'
         }}>
           <span style={{ color: '#ffffff' }}>{toast.message}</span>
           <button onClick={() => setToast({ ...toast, show: false })} style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
         </div>
      )}

      {/* Bill Preview Modal */}
      {previewModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 0
        }}>
          <div style={{
            background: '#1e3a8a',
            borderRadius: '10px',
            padding: '0.3rem 8px 0.7rem 8px',
            maxWidth: '98vw',
            maxHeight: '98vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              margin: '0.3rem 0 0.3rem 0'
            }}>
              <div style={{ flex: 1, textAlign: 'center', color: '#bfdbfe', fontSize: '1.08rem', fontWeight: 600 }}>
                {previewModal.merchantName} Bill
              </div>
              <button
                onClick={closePreviewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  lineHeight: 1
                }}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              minWidth: 0
            }}>
              {previewModal.imageUrl ? (
                <img
                  src={previewModal.imageUrl}
                  alt="Bill Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(30,58,138,0.10)'
                  }}
                  onError={() => console.error('Image failed to load:', previewModal.imageUrl)}
                />
              ) : (
                <p style={{ color: '#bfdbfe', textAlign: 'center' }}>Loading preview...</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 0.9;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 