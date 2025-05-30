import React, { useEffect, useState } from 'react';
import { fetchBills, fetchBillItems } from '../services/api';

interface Bill {
  id: string;
  merchant_name: string;
  date: string;
  total_amount: number;
}

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

const Dashboard: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [itemsMap, setItemsMap] = useState<{ [key: string]: BillItem[] }>({});
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchBills().then(res => setBills(res.data.bills));
  }, []);

  const toggleBillItems = async (billId: string) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null); // collapse
    } else {
      if (!itemsMap[billId]) {
        const res = await fetchBillItems(billId);
        setItemsMap(prev => ({ ...prev, [billId]: res.data.items }));
      }
      setExpandedBillId(billId);
    }
  };

  return (
    <div className="container">
      <h2>All Receipts</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {bills.map(b => (
          <li key={b.id} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{b.merchant_name} ({b.date.split('T')[0]}) - ${b.total_amount}</span>
              <button
                style={{
                  fontSize: '0.875rem',
                  padding: '4px 10px',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  minWidth: 'fit-content',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
                onClick={() => toggleBillItems(b.id)}
              >
                {expandedBillId === b.id ? 'Hide Items' : 'View Items'}
              </button>
            </div>

            {expandedBillId === b.id && itemsMap[b.id] && (
              <ul style={{ marginTop: '0.75rem' }}>
                <strong>Items:</strong>
                {itemsMap[b.id].map(i => (
                  <li key={i.id}>{i.description} x{i.quantity} - ${i.price}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard; 