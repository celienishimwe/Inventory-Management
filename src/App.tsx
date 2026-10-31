import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import UnitsPage from './pages/UnitsPage';
import SuppliersPage from './pages/SuppliersPage';
import CustomersPage from './pages/CustomersPage';
import WarehousesPage from './pages/WarehousesPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import GoodsReceiptsPage from './pages/GoodsReceiptsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import InventoryBalancesPage from './pages/InventoryBalancesPage';
import InventoryMovementsPage from './pages/InventoryMovementsPage';
import ReceiveStockPage from './pages/ReceiveStockPage';
import InventoryAdjustmentsPage from './pages/InventoryAdjustmentsPage';
import TransfersPage from './pages/TransfersPage';
import ReturnsPage from './pages/ReturnsPage';
import LowStockReportPage from './pages/LowStockReportPage';
import InventoryValuationPage from './pages/InventoryValuationPage';
import ReportsMovementsPage from './pages/ReportsMovementsPage';
import DeliveriesReportPage from './pages/DeliveriesReportPage';
import ImportsReportPage from './pages/ImportsReportPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/goods-receipts" element={<GoodsReceiptsPage />} />
        <Route path="/sales-orders" element={<SalesOrdersPage />} />
        <Route path="/inventory/balances" element={<InventoryBalancesPage />} />
        <Route path="/inventory/movements" element={<InventoryMovementsPage />} />
        <Route path="/inventory/receive" element={<ReceiveStockPage />} />
        <Route path="/inventory/adjustments" element={<InventoryAdjustmentsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="/reports/inventory-valuation" element={<InventoryValuationPage />} />
        <Route path="/reports/low-stock" element={<LowStockReportPage />} />
        <Route path="/reports/movements" element={<ReportsMovementsPage />} />
        <Route path="/reports/deliveries" element={<DeliveriesReportPage />} />
        <Route path="/reports/imports" element={<ImportsReportPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
