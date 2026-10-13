// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { Dashboard } from './Dashboard'
import type { Organization, Store } from '../types/database'

describe('Dashboard Component', () => {
  afterEach(() => {
    cleanup()
  })

  const mockOrgs: Organization[] = [
    {
      id: 'org-1',
      name: 'Apex Mobiles',
      slug: 'apex-mobiles',
      created_by: 'user-1',
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    {
      id: 'org-2',
      name: 'Star Cellular',
      slug: 'star-cellular',
      created_by: 'user-2',
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
  ]

  const mockStores: Store[] = [
    {
      id: 'store-1',
      organization_id: 'org-1',
      name: 'Apex Downtown',
      code: 'APEX-DT',
      address: '12 MG Road',
      phone: '+918012345678',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
    {
      id: 'store-2',
      organization_id: 'org-1',
      name: 'Apex West',
      code: 'APEX-WST',
      address: '45 Indiranagar',
      phone: '+918012345679',
      is_active: true,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
  ]

  it('renders organization and store selectors with accessible labels', () => {
    const handleSelectOrg = vi.fn()
    const handleSelectStore = vi.fn()

    render(
      <Dashboard
        organizations={mockOrgs}
        activeOrganization={mockOrgs[0]}
        stores={mockStores}
        activeStore={mockStores[0]}
        onSelectOrganization={handleSelectOrg}
        onSelectStore={handleSelectStore}
      />
    )

    const orgSelect = screen.getByLabelText(/active organization/i) as HTMLSelectElement
    expect(orgSelect).toBeDefined()
    expect(orgSelect.value).toBe('org-1')

    const storeSelect = screen.getByLabelText(/active store/i) as HTMLSelectElement
    expect(storeSelect).toBeDefined()
    expect(storeSelect.value).toBe('store-1')

    expect(screen.getByRole('heading', { level: 1, name: 'Apex Mobiles' })).toBeDefined()
    expect(screen.getAllByText(/Apex Downtown/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/APEX-DT/i).length).toBeGreaterThan(0)
  })

  it('calls onSelectStore when switching store', () => {
    const handleSelectOrg = vi.fn()
    const handleSelectStore = vi.fn()

    render(
      <Dashboard
        organizations={mockOrgs}
        activeOrganization={mockOrgs[0]}
        stores={mockStores}
        activeStore={mockStores[0]}
        onSelectOrganization={handleSelectOrg}
        onSelectStore={handleSelectStore}
      />
    )

    const switchBtn = screen.getByRole('button', { name: /switch store/i })
    fireEvent.click(switchBtn)

    expect(handleSelectStore).toHaveBeenCalledWith('store-2')
  })

  it('calls onSelectOrganization when organization dropdown changes', () => {
    const handleSelectOrg = vi.fn()
    const handleSelectStore = vi.fn()

    render(
      <Dashboard
        organizations={mockOrgs}
        activeOrganization={mockOrgs[0]}
        stores={mockStores}
        activeStore={mockStores[0]}
        onSelectOrganization={handleSelectOrg}
        onSelectStore={handleSelectStore}
      />
    )

    const orgSelect = screen.getByLabelText(/active organization/i)
    fireEvent.change(orgSelect, { target: { value: 'org-2' } })

    expect(handleSelectOrg).toHaveBeenCalledWith('org-2')
  })
})
