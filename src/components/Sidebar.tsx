import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, ShoppingBag, BarChart2,
  Settings, LogOut, ChevronDown, ChevronRight,
  Users, Warehouse, RefreshCcw, ClipboardList, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (name: string) => {
    setExpandedSection(prev => prev === name ? null : name);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const displayName = user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') || user?.name || user?.email?.split('@')[0] || '';
  const displayEmail = user?.email || '';
  const initial = displayName ? displayName.charAt(0).toUpperCase() : (displayEmail ? displayEmail.charAt(0).toUpperCase() : 'U');

  return (
    <aside className="sidebar">
      {/* User profile */}
      <div className="sidebar-profile">
        <div className="sidebar-avatar">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              // fallback if offline
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#193849' }}>
            {initial}
          </span>
        </div>
        {displayName && <div className="sidebar-name">{displayName}</div>}
        <div className="sidebar-email">{displayEmail}</div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </NavLink>

        {/* Products */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('products')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/products') || location.pathname.startsWith('/categories') || location.pathname.startsWith('/units') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Package size={17} />
              <span>Products</span>
            </span>
            {expandedSection === 'products' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'products' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                All Products
              </NavLink>
              <NavLink to="/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Categories
              </NavLink>
              <NavLink to="/units" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Units
              </NavLink>
            </div>
          )}
        </div>

        {/* Orders (Sales) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('orders')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/sales') || location.pathname.startsWith('/customers') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShoppingCart size={17} />
              <span>Orders</span>
            </span>
            {expandedSection === 'orders' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'orders' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/sales-orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Sales Orders
              </NavLink>
              <NavLink to="/customers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Customers
              </NavLink>
            </div>
          )}
        </div>

        {/* Purchase */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('purchase')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/purchase') || location.pathname.startsWith('/suppliers') || location.pathname.startsWith('/goods-receipts') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShoppingBag size={17} />
              <span>Purchase</span>
            </span>
            {expandedSection === 'purchase' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'purchase' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/purchase-orders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Purchase Orders
              </NavLink>
              <NavLink to="/goods-receipts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Goods Receipts
              </NavLink>
              <NavLink to="/suppliers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Suppliers
              </NavLink>
            </div>
          )}
        </div>

        {/* Inventory Management Group */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('inventory')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/inventory') || location.pathname.startsWith('/transfers') || location.pathname.startsWith('/returns') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Warehouse size={17} />
              <span>Inventory</span>
            </span>
            {expandedSection === 'inventory' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'inventory' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/inventory/balances" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Stock Balances
              </NavLink>
              <NavLink to="/inventory/movements" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Movements Ledger
              </NavLink>
              <NavLink to="/inventory/receive" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Receive Stock
              </NavLink>
              <NavLink to="/inventory/adjustments" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Adjustments
              </NavLink>
              <NavLink to="/transfers" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Transfers
              </NavLink>
              <NavLink to="/returns" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Returns
              </NavLink>
              <NavLink to="/warehouses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Warehouses
              </NavLink>
            </div>
          )}
        </div>

        {/* Reporting */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('reporting')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/reports') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChart2 size={17} />
              <span>Reporting</span>
            </span>
            {expandedSection === 'reporting' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'reporting' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/reports/inventory-valuation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Inventory Valuation
              </NavLink>
              <NavLink to="/reports/low-stock" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Low Stock Alert
              </NavLink>
              <NavLink to="/reports/movements" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Movements Report
              </NavLink>
              <NavLink to="/reports/deliveries" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Deliveries
              </NavLink>
              <NavLink to="/reports/imports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Imports POs
              </NavLink>
            </div>
          )}
        </div>

        {/* Support / Admin */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('support')}
            className={`sidebar-link w-full ${location.pathname.startsWith('/users') || location.pathname.startsWith('/roles') || location.pathname.startsWith('/audit-logs') ? 'active' : ''}`}
            style={{ justifyContent: 'space-between', border: 'none', background: 'transparent' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HelpCircle size={17} />
              <span>Support</span>
            </span>
            {expandedSection === 'support' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSection === 'support' && (
            <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Users Management
              </NavLink>
              <NavLink to="/roles" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Role Permissions
              </NavLink>
              <NavLink to="/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '7px 12px' }}>
                Audit Logs
              </NavLink>
            </div>
          )}
        </div>

        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={17} />
          <span>Settings</span>
        </NavLink>
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={{ width: '100%', color: '#fca5a5', border: 'none', background: 'transparent' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
