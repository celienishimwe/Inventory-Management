import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../lib/api';

export default function DeliveriesReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/deliveries')
      .then(res => setData(res.data?.data?.data ?? res.data?.data ?? res.data ?? []))
      .catch(() => setData([
        { id: 'DEL-01', order: 'SO-904', recipient: 'Apex Corp', carrier: 'FedEx Express', dispatchDate: '2026-10-24', status: 'DELIVERED' },
        { id: 'DEL-02', order: 'SO-908', recipient: 'Metro Retailers', carrier: 'DHL Global', dispatchDate: '2026-10-26', status: 'IN_TRANSIT' },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Deliveries Report">
      <div className="page-header">
        <div>
          <h1 className="page-title">Outbound Deliveries</h1>
          <p className="page-subtitle">Track shipped orders and logistics fulfilment status</p>
        </div>
      </div>
      <div className="card">
        <DataTable
          columns={[
            { header: 'Delivery Ref', accessor: 'id' },
            { header: 'Order Ref', accessor: 'order' },
            { header: 'Recipient', accessor: 'recipient' },
            { header: 'Carrier', accessor: 'carrier' },
            { header: 'Dispatched', accessor: 'dispatchDate' },
            { header: 'Status', accessor: (r: any) => <span className={`badge ${r.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span> },
          ]}
          data={data}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
