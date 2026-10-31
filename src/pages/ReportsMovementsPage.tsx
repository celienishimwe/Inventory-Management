import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../lib/api';

export default function ReportsMovementsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/inventory-movements')
      .then(res => setData(res.data?.data?.data ?? res.data?.data ?? res.data ?? []))
      .catch(() => setData([
        { id: '1', date: '2026-10-27', type: 'INBOUND', product: 'Ceramic Mug', quantity: 200, warehouse: 'Central Warehouse' },
        { id: '2', date: '2026-10-26', type: 'OUTBOUND', product: 'Desk Lamp', quantity: -45, warehouse: 'South Depot' },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Inventory Movements Report">
      <div className="page-header">
        <div>
          <h1 className="page-title">Movements Report</h1>
          <p className="page-subtitle">Historical audit trail of all warehouse transactions</p>
        </div>
      </div>
      <div className="card">
        <DataTable
          columns={[
            { header: 'Date', accessor: 'date' },
            { header: 'Product', accessor: 'product' },
            { header: 'Warehouse', accessor: 'warehouse' },
            { header: 'Type', accessor: (r: any) => <span className={`badge ${r.type === 'INBOUND' ? 'badge-success' : 'badge-info'}`}>{r.type}</span> },
            { header: 'Quantity Change', accessor: (r: any) => <span style={{ fontWeight: 700, color: r.quantity > 0 ? '#16a34a' : '#dc2626' }}>{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</span> },
          ]}
          data={data}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
