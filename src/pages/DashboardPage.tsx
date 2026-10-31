import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Package, Store, TrendingUp, AlertCircle, Users, MoreVertical } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api from '../lib/api';
import { DashboardData } from '../types';

// Fallback exact data from reference screenshot
const mockDashboard: DashboardData = {
  totalProducts: 483,
  totalOrders: 2059,
  totalStock: 480,
  outOfStock: 20,
  totalCustomers: 582000,
  inventoryValue: '2450000',
  lowStockItems: 12,
  pendingPurchaseOrders: 7,
  pendingSalesOrders: 14,
};

// Expense vs Profit monthly trend
const expenseProfitData = [
  { month: 'Mar', expense: 38, profit: 25 },
  { month: 'Apr', expense: 28, profit: 34 },
  { month: 'May', expense: 42, profit: 48 },
  { month: 'Jun', expense: 52, profit: 46 }, // loss peak
  { month: 'Jul', expense: 32, profit: 62 }, // gain peak
  { month: 'Aug', expense: 26, profit: 54 },
  { month: 'Sep', expense: 30, profit: 58 },
];

// Top 10 stores from reference design
const topStoresList = [
  { name: 'Gateway 21', pct: 82 },
  { name: 'The Rover Bar', pct: 77 },
  { name: 'Snap Hut', pct: 64 },
  { name: 'Red Robin', pct: 55 },
  { name: 'Urban Scoop', pct: 50 },
  { name: 'Old Tavern', pct: 38 },
  { name: 'Grand Stand', pct: 24 },
  { name: 'Brewhouse', pct: 18 },
  { name: 'Overcast', pct: 12 },
];

const pieData = [
  { name: 'Sales units', value: 30, color: '#88afc2' },
  { name: 'Total units', value: 70, color: '#21495e' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(mockDashboard);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data: res }) => {
        const d = res.data ?? res;
        setData({
          totalProducts: d.totalProducts ?? mockDashboard.totalProducts,
          totalOrders: d.totalOrders ?? d.totalSalesOrders ?? mockDashboard.totalOrders,
          totalStock: d.totalStock ?? mockDashboard.totalStock,
          outOfStock: d.outOfStock ?? d.outOfStockCount ?? mockDashboard.outOfStock,
          totalCustomers: d.totalCustomers ?? mockDashboard.totalCustomers,
          inventoryValue: d.inventoryValue ?? d.totalInventoryValue ?? mockDashboard.inventoryValue,
          lowStockItems: d.lowStockItems ?? d.lowStockCount ?? mockDashboard.lowStockItems,
          pendingPurchaseOrders: d.pendingPurchaseOrders ?? mockDashboard.pendingPurchaseOrders,
          pendingSalesOrders: d.pendingSalesOrders ?? mockDashboard.pendingSalesOrders,
        });
      })
      .catch(() => {
        // Use default mockup data smoothly
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* ── Quick View Section ────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#163140', marginBottom: 12 }}>
          Quick View
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {/* Card 1: Total Products */}
          <div className="quick-view-card">
            <div className="quick-view-icon" style={{ background: '#e6f7f2', color: '#10b981' }}>
              <Package size={22} />
            </div>
            <div>
              <div className="quick-view-value">${data.totalProducts}</div>
              <div className="quick-view-label">Total Products</div>
            </div>
          </div>

          {/* Card 2: Orders */}
          <div className="quick-view-card">
            <div className="quick-view-icon" style={{ background: '#e0f7f6', color: '#14b8a6' }}>
              <Store size={22} />
            </div>
            <div>
              <div className="quick-view-value">{data.totalOrders}</div>
              <div className="quick-view-label">Orders</div>
            </div>
          </div>

          {/* Card 3: Total Sales */}
          <div className="quick-view-card">
            <div className="quick-view-icon" style={{ background: '#e6f7ed', color: '#22c55e' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div className="quick-view-value">${data.totalStock}</div>
              <div className="quick-view-label">Total Sales</div>
            </div>
          </div>

          {/* Card 4: Out of Stock (peach card) */}
          <div className="quick-view-card card-peach">
            <div className="quick-view-icon" style={{ background: '#fde4de', color: '#f06a55' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="quick-view-value">{data.outOfStock}</div>
              <div className="quick-view-label">Out of Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard 2-Column Grid ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Left Column (No of users + Inventory Values + Expense vs Profit) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Users & Inventory Values side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: 16 }}>
            {/* No of users */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#163140' }}>No of users</span>
                <MoreVertical size={15} color="#94a3b8" style={{ cursor: 'pointer' }} />
              </div>

              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '12px 0 8px',
              }}>
                <Users size={22} color="#0284c7" />
              </div>

              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#163140', lineHeight: 1.2 }}>
                  582 K
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Total Customers
                </div>
              </div>
            </div>

            {/* Inventory Values Donut */}
            <div className="card">
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#163140', marginBottom: 6 }}>
                Inventory Values
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 140 }}>
                <div style={{ width: 140, height: 140, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={58}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Overlay labels */}
                  <div style={{
                    position: 'absolute', top: '24%', right: '18%',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                  }}>
                    30%
                  </div>
                  <div style={{
                    position: 'absolute', bottom: '26%', left: '22%',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    70%
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: '#88afc2' }} />
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Sales units</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: '#21495e' }} />
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Total units</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Expense vs Profit Area Chart */}
          <div className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#163140' }}>
                Expense vs Profit
              </h3>
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                Last 6 months
              </span>
            </div>

            {/* Float Markers matching reference screenshot */}
            <div style={{ position: 'relative', width: '100%', height: 210 }}>
              {/* Loss label */}
              <div style={{
                position: 'absolute', top: '18%', left: '50%',
                background: '#eb6a56', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4, zIndex: 10,
                boxShadow: '0 2px 6px rgba(235, 106, 86, 0.4)',
              }}>
                Loss (-$230)
              </div>
              {/* Gain label */}
              <div style={{
                position: 'absolute', top: '8%', left: '68%',
                background: '#10b981', color: '#fff', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 4, zIndex: 10,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
              }}>
                Gain (+$540)
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expenseProfitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${val}%`}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                    formatter={(val: any) => [`${val}%`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#eb6a56"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                    dot={{ r: 3, fill: '#eb6a56' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Top 10 Stores by sales */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#163140', marginBottom: 16 }}>
            Top 10 Stores by sales
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1, justifyContent: 'space-around' }}>
            {topStoresList.map((store) => (
              <div key={store.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Store Name */}
                <div style={{
                  fontSize: 11.5,
                  color: '#475569',
                  fontWeight: 500,
                  width: 95,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flexShrink: 0,
                }}>
                  {store.name}
                </div>

                {/* Progress bar track */}
                <div style={{
                  flex: 1,
                  height: 9,
                  background: '#dce6ec',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${store.pct}%`,
                    height: '100%',
                    background: '#21495e',
                    borderRadius: 6,
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                {/* Percentage */}
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#163140',
                  width: 32,
                  textAlign: 'right',
                  flexShrink: 0,
                }}>
                  {store.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
