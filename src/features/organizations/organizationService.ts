import { supabase } from '../../lib/supabase'
import type { CreateOrgWithStoreParams, CreateOrgWithStoreResult, Organization, OrganizationMembership } from '../../types/database'

export const organizationService = {
  async getMyOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')
    if (error) throw error
    return data || []
  },

  async getMyMemberships(): Promise<OrganizationMembership[]> {
    const { data, error } = await supabase
      .from('organization_memberships')
      .select('*')
    if (error) throw error
    return data || []
  },

  async createOrganizationWithStore(params: CreateOrgWithStoreParams): Promise<CreateOrgWithStoreResult> {
    const { data, error } = await supabase.rpc('create_organization_with_store', {
      p_org_name: params.orgName,
      p_org_slug: params.orgSlug,
      p_store_name: params.storeName,
      p_store_code: params.storeCode,
      p_store_address: params.storeAddress || null,
      p_store_phone: params.storePhone || null,
    })
    if (error) throw error
    return data as CreateOrgWithStoreResult
  },
}
