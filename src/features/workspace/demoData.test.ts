import { describe, expect, it } from 'vitest'
import {
  DEMO_DATA_IS_AUTHORITATIVE,
  DEMO_DATA_DISCLAIMER,
  demoWorkspaceData,
  deriveDashboardMetrics,
  formatInr,
  getStockStatus,
} from './demoData'

describe('workspace demo data', () => {
  it('exposes a clearly non-authoritative fixture for each workspace slice', () => {
    expect(DEMO_DATA_IS_AUTHORITATIVE).toBe(false)
    expect(DEMO_DATA_DISCLAIMER.toLowerCase()).toContain('non-authoritative')
    expect(demoWorkspaceData.products.length).toBeGreaterThan(0)
    expect(demoWorkspaceData.inventory.length).toBeGreaterThan(0)
    expect(demoWorkspaceData.recentSales.length).toBeGreaterThan(0)
    expect(demoWorkspaceData.recentActivity.length).toBeGreaterThan(0)
    expect(demoWorkspaceData.repairs.length).toBeGreaterThan(0)
    expect(demoWorkspaceData.dashboardMetrics.revenueInr).toBeGreaterThan(0)
  })

  it('derives dashboard totals from sales, inventory, and open repairs', () => {
    const metrics = deriveDashboardMetrics({
      inventory: [
        {
          id: 'inventory-1',
          productId: 'product-1',
          productName: 'Demo Phone',
          sku: 'DEMO-1',
          quantityOnHand: 2,
          reorderPoint: 3,
          unitPriceInr: 100,
          location: 'Front counter',
        },
        {
          id: 'inventory-2',
          productId: 'product-2',
          productName: 'Demo Cable',
          sku: 'DEMO-2',
          quantityOnHand: 5,
          reorderPoint: 2,
          unitPriceInr: 200,
          location: 'Accessory wall',
        },
      ],
      recentSales: [
        {
          id: 'sale-1',
          invoiceNumber: 'INV-0001',
          customerName: 'Test Customer',
          itemSummary: 'Demo Phone',
          itemCount: 1,
          totalInr: 1000,
          paymentMethod: 'UPI',
          status: 'completed',
          soldAt: '2026-10-13T10:00:00+05:30',
        },
        {
          id: 'sale-2',
          invoiceNumber: 'INV-0002',
          customerName: 'Another Customer',
          itemSummary: 'Demo Cable × 2',
          itemCount: 2,
          totalInr: 500,
          paymentMethod: 'Cash',
          status: 'completed',
          soldAt: '2026-10-13T11:00:00+05:30',
        },
      ],
      repairs: [
        {
          id: 'repair-1',
          ticketNumber: 'REP-0001',
          customerName: 'Test Customer',
          device: 'Demo Phone',
          issue: 'Screen replacement',
          status: 'diagnosing',
          technician: 'Demo Technician',
          estimateInr: 800,
          receivedAt: '2026-10-12T10:00:00+05:30',
          updatedAt: '2026-10-13T10:00:00+05:30',
        },
        {
          id: 'repair-2',
          ticketNumber: 'REP-0002',
          customerName: 'Closed Customer',
          device: 'Demo Cable',
          issue: 'Connector replacement',
          status: 'delivered',
          technician: 'Demo Technician',
          estimateInr: 300,
          receivedAt: '2026-10-11T10:00:00+05:30',
          updatedAt: '2026-10-12T10:00:00+05:30',
        },
      ],
    })

    expect(metrics).toEqual({
      revenueInr: 1500,
      salesCount: 2,
      averageOrderValueInr: 750,
      inventoryValueInr: 1200,
      lowStockCount: 1,
      openRepairCount: 1,
    })
  })

  it('classifies stock at, below, and above the reorder point', () => {
    expect(getStockStatus(0, 2)).toBe('out-of-stock')
    expect(getStockStatus(2, 2)).toBe('low-stock')
    expect(getStockStatus(3, 2)).toBe('in-stock')
  })

  it('formats Indian rupee amounts for dashboard display', () => {
    expect(formatInr(123456)).toBe('₹1,23,456')
    expect(formatInr(1499.5)).toBe('₹1,499.50')
  })
})
