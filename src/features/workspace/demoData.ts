export const DEMO_DATA_IS_AUTHORITATIVE = false

export const DEMO_DATA_DISCLAIMER =
  'Demo data only: non-authoritative presentation data for workspace preview.'

export interface DemoInventoryItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantityOnHand: number
  reorderPoint: number
  unitPriceInr: number
  location: string
}

export interface DemoSale {
  id: string
  invoiceNumber: string
  customerName: string
  itemSummary: string
  itemCount: number
  totalInr: number
  paymentMethod: string
  status: string
  soldAt: string
}

export interface DemoRepair {
  id: string
  ticketNumber: string
  customerName: string
  device: string
  issue: string
  status: 'intake' | 'diagnosing' | 'in_progress' | 'waiting_parts' | 'ready' | 'delivered' | 'cancelled'
  technician: string
  estimateInr: number
  receivedAt: string
  updatedAt: string
}

export interface DashboardMetricsInput {
  inventory: DemoInventoryItem[]
  recentSales: DemoSale[]
  repairs: DemoRepair[]
}

export interface DashboardMetrics {
  revenueInr: number
  salesCount: number
  averageOrderValueInr: number
  inventoryValueInr: number
  lowStockCount: number
  openRepairCount: number
}

export function getStockStatus(quantityOnHand: number, reorderPoint: number): 'out-of-stock' | 'low-stock' | 'in-stock' {
  if (quantityOnHand <= 0) return 'out-of-stock'
  if (quantityOnHand <= reorderPoint) return 'low-stock'
  return 'in-stock'
}

export function formatInr(amount: number): string {
  const parts = amount.toFixed(2).split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Indian number grouping: rightmost 3 digits, then groups of 2 digits
  let lastThree = integerPart.slice(-3)
  const remaining = integerPart.slice(0, -3)

  if (remaining !== '') {
    lastThree = ',' + lastThree
  }
  const formattedInteger = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree

  if (decimalPart === '00') {
    return `₹${formattedInteger}`
  }
  return `₹${formattedInteger}.${decimalPart}`
}

export function deriveDashboardMetrics(input: DashboardMetricsInput): DashboardMetrics {
  const salesCount = input.recentSales.length
  const revenueInr = input.recentSales.reduce((acc, sale) => acc + sale.totalInr, 0)
  const averageOrderValueInr = salesCount > 0 ? Math.round(revenueInr / salesCount) : 0

  const inventoryValueInr = input.inventory.reduce(
    (acc, item) => acc + item.quantityOnHand * item.unitPriceInr,
    0
  )

  const lowStockCount = input.inventory.filter(
    (item) => item.quantityOnHand <= item.reorderPoint
  ).length

  const openRepairCount = input.repairs.filter(
    (repair) => repair.status !== 'delivered' && repair.status !== 'cancelled'
  ).length

  return {
    revenueInr,
    salesCount,
    averageOrderValueInr,
    inventoryValueInr,
    lowStockCount,
    openRepairCount,
  }
}

export const demoWorkspaceData = {
  products: [
    { id: 'prod-1', name: 'Redmi Note 13 Pro', brand: 'Xiaomi', category: 'Smartphones' },
    { id: 'prod-2', name: 'Samsung Galaxy A15', brand: 'Samsung', category: 'Smartphones' },
    { id: 'prod-3', name: 'USB-C Fast Charging Cable', brand: 'Boat', category: 'Accessories' },
  ],
  inventory: [
    {
      id: 'inv-1',
      productId: 'prod-1',
      productName: 'Redmi Note 13 Pro (8/256GB)',
      sku: 'REDMI-N13P-256',
      quantityOnHand: 4,
      reorderPoint: 2,
      unitPriceInr: 21999,
      location: 'Display Cabinet A',
    },
    {
      id: 'inv-2',
      productId: 'prod-2',
      productName: 'Samsung Galaxy A15 5G',
      sku: 'SAM-A15-128',
      quantityOnHand: 1,
      reorderPoint: 3,
      unitPriceInr: 15499,
      location: 'Display Cabinet B',
    },
    {
      id: 'inv-3',
      productId: 'prod-3',
      productName: 'Boat 65W Fast Charger',
      sku: 'BOAT-65W-CHG',
      quantityOnHand: 8,
      reorderPoint: 5,
      unitPriceInr: 899,
      location: 'Accessory Shelf',
    },
  ],
  recentSales: [
    {
      id: 'sale-1',
      invoiceNumber: 'INV-2026-001',
      customerName: 'Rahul Verma',
      itemSummary: 'Redmi Note 13 Pro (IMEI: 869123456789012)',
      itemCount: 1,
      totalInr: 21999,
      paymentMethod: 'UPI',
      status: 'completed',
      soldAt: '2026-10-13T14:30:00+05:30',
    },
    {
      id: 'sale-2',
      invoiceNumber: 'INV-2026-002',
      customerName: 'Pooja Sharma',
      itemSummary: 'Boat 65W Fast Charger × 1',
      itemCount: 1,
      totalInr: 899,
      paymentMethod: 'Cash',
      status: 'completed',
      soldAt: '2026-10-13T15:15:00+05:30',
    },
  ],
  recentActivity: [
    { id: 'act-1', text: 'Invoice INV-2026-001 created by Rajesh Sharma', time: '14:30' },
    { id: 'act-2', text: 'Repair ticket REP-2026-001 marked diagnosing by Amit Kumar', time: '13:00' },
  ],
  repairs: [
    {
      id: 'rep-1',
      ticketNumber: 'REP-2026-001',
      customerName: 'Deepak Patel',
      device: 'OnePlus Nord CE 3',
      issue: 'Broken display glass and touch unresponsive',
      status: 'diagnosing' as const,
      technician: 'Amit Kumar',
      estimateInr: 3500,
      receivedAt: '2026-10-13T11:00:00+05:30',
      updatedAt: '2026-10-13T13:00:00+05:30',
    },
  ],
  dashboardMetrics: {
    revenueInr: 22898,
    salesCount: 2,
    averageOrderValueInr: 11449,
    inventoryValueInr: 110688,
    lowStockCount: 1,
    openRepairCount: 1,
  },
}
