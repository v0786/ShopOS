export type OrgRole = 'owner' | 'admin' | 'staff' | 'technician'
export type MembershipStatus = 'active' | 'deactivated'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OrganizationMembership {
  id: string
  organization_id: string
  user_id: string
  role: OrgRole
  status: MembershipStatus
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  organization_id: string
  name: string
  code: string
  address: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreAssignment {
  id: string
  organization_id: string
  store_id: string
  user_id: string
  created_at: string
}

export interface PlatformAdmin {
  id: string
  user_id: string
  created_at: string
}

export interface CreateOrgWithStoreParams {
  orgName: string
  orgSlug: string
  storeName: string
  storeCode: string
  storeAddress?: string
  storePhone?: string
}

export interface CreateOrgWithStoreResult {
  organization_id: string
  organization_name: string
  organization_slug: string
  store_id: string
  store_name: string
  store_code: string
}
