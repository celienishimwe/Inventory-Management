// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  role?: string;
  organizationId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  organizationSlug: string;
}

export interface RegisterPayload {
  organizationName: string;
  organizationSlug: string;
  fullName: string;
  email: string;
  password: string;
}

// ─── Generic API ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PageMeta;
}

// ─── Organization ─────────────────────────────────────────────────────────────
export interface OrganizationSettings {
  id?: string;
  businessName?: string;
  name?: string;
  organizationSlug?: string;
  currency?: string;
  baseCurrency?: string;
  address?: string;
  logoUrl?: string;
  timezone?: string;
  allowNegativeStock?: boolean;
  requirePurchaseApproval?: boolean;
  requireSeparationOfDuties?: boolean;
  phone?: string;
  email?: string;
  taxNumber?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Unit ────────────────────────────────────────────────────────────────────
export interface Unit {
  id: string;
  name: string;
  symbol: string;
  abbreviation?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  brand?: string;
  categoryId?: string;
  category?: Category;
  unitId?: string;
  unit?: Unit;
  purchaseCost?: string;
  costPrice?: string;
  sellingPrice: string;
  wholesalePrice?: string;
  reorderLevel: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Supplier / Customer ─────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  contactName?: string;
  contactPerson?: string; // legacy alias
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  contactName?: string;
  contactPerson?: string; // legacy alias
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Warehouse ───────────────────────────────────────────────────────────────
export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  locations: WarehouseLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  warehouseId: string;
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryBalance {
  productId: string;
  product: Product;
  warehouseId: string;
  warehouse: Warehouse;
  locationId: string;
  onHand: string;
  reserved: string;
  available: string;
}

export interface InventoryMovement {
  id: string;
  type: string;
  productId: string;
  product?: Product;
  quantity: string;
  reference?: string;
  createdAt: string;
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────
export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RECEIVED';

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  product?: Product;
  quantity: string;
  unitCost: string;
  totalCost: string;
}

export interface PurchaseOrder {
  id: string;
  referenceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  orderType: 'LOCAL' | 'IMPORT';
  lines: PurchaseOrderLine[];
  subtotal: string;
  totalAmount: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Sales Orders ────────────────────────────────────────────────────────────
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'RESERVED' | 'DISPATCHED' | 'CANCELLED';

export interface SalesOrderLine {
  id: string;
  productId: string;
  product?: Product;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
}

export interface SalesOrder {
  id: string;
  referenceNumber: string;
  customerId: string;
  customer?: Customer;
  warehouseId: string;
  warehouse?: Warehouse;
  status: SalesOrderStatus;
  lines: SalesOrderLine[];
  subtotal: string;
  totalAmount: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Transfers ───────────────────────────────────────────────────────────────
export type TransferStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';

export interface Transfer {
  id: string;
  referenceNumber: string;
  sourceWarehouseId: string;
  sourceWarehouse?: Warehouse;
  destinationWarehouseId: string;
  destinationWarehouse?: Warehouse;
  status: TransferStatus;
  lines: TransferLine[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferLine {
  id: string;
  productId: string;
  product?: Product;
  quantity: string;
  receivedQuantity?: string;
}

// ─── Returns ─────────────────────────────────────────────────────────────────
export type ReturnStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';
export type ReturnType = 'CUSTOMER' | 'SUPPLIER';

export interface Return {
  id: string;
  referenceNumber: string;
  type: ReturnType;
  status: ReturnStatus;
  lines: ReturnLine[];
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnLine {
  id: string;
  productId: string;
  product?: Product;
  quantity: string;
}

// ─── Adjustment Requests ─────────────────────────────────────────────────────
export type AdjustmentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED' | 'CANCELLED';

export interface AdjustmentRequest {
  id: string;
  referenceNumber: string;
  status: AdjustmentStatus;
  lines: AdjustmentLine[];
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentLine {
  id: string;
  productId: string;
  product?: Product;
  delta: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalStock: number;
  outOfStock: number;
  totalCustomers: number;
  inventoryValue: string;
  lowStockItems: number;
  pendingPurchaseOrders: number;
  pendingSalesOrders: number;
  recentSalesOrders?: SalesOrder[];
  recentPurchaseOrders?: PurchaseOrder[];
}

// ─── Users & Roles ───────────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isCustom: boolean;
  createdAt: string;
}

export interface OrgUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  role?: Role;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  userEmail?: string;
  changes?: Record<string, unknown>;
  createdAt: string;
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface InventoryValuationItem {
  productId: string;
  product: Product;
  onHand: string;
  averageCost: string;
  totalValue: string;
}

export interface LowStockItem {
  productId: string;
  product: Product;
  warehouseId: string;
  warehouse: Warehouse;
  available: string;
  reorderLevel: number;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  status: 'DRAFT' | 'POSTED';
  lines: GoodsReceiptLine[];
  createdAt: string;
}

export interface GoodsReceiptLine {
  productId: string;
  quantity: string;
}
