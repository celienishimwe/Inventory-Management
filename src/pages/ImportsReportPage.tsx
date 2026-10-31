import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import DataTable from '../components/DataTable';
import api from '../lib/api';

export default function ImportsReportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/imports')
      .then(res => setData(res.data?.data?.data ?? res.data?.data ?? res.data ?? []))
      .catch(() => setData([
        { id: 'IMP-201', poNumber: 'PO-771', supplier: 'Shenzhen Tech Supplies', port: 'Rotterdam Gateway', eta: '2026-11-04', customsStatus: 'CLEARED' },
        { id: 'IMP-202', poNumber: 'PO-779', supplier: 'Nordic Forest Paper', port: 'Hamburg Terminal', eta: '2026-11-12', customsStatus: 'IN_INSPECTION' },
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Import POs Report">
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Purchase Orders</h1>
          <p className="page-subtitle">Track cross-border procurement and customs clearance</p>
        </div>
      </div>
      <div className="card">
        <DataTable
          columns={[
            { header: 'Import #', accessor: 'id' },
            { header: 'PO Ref', accessor: 'poNumber' },
            { header: 'Supplier', accessor: 'supplier' },
            { header: 'Port of Entry', accessor: 'port' },
            { header: 'Est. Arrival', accessor: 'eta' },
            { header: 'Customs Status', accessor: (r: any) => <span className={`badge ${r.customsStatus === 'CLEARED' ? 'badge-success' : 'badge-info'}`}>{r.customsStatus}</span> },
          ]}
          data={data}
          loading={loading}
        />
      </div>
    </DashboardLayout>
  );
}
