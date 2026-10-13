-- ==============================================================================
-- ShopOS Phase 1 Seed Data
-- Two organizations (Apex Mobiles, Star Cellular) with multiple stores,
-- staff assignments, active/deactivated memberships, and platform administration.
-- ==============================================================================

-- 1. Create Mock Auth Users
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'apex_owner@shopos.local'),
  ('00000000-0000-0000-0000-000000000002', 'apex_admin@shopos.local'),
  ('00000000-0000-0000-0000-000000000003', 'apex_staff1@shopos.local'),
  ('00000000-0000-0000-0000-000000000004', 'apex_staff2@shopos.local'),
  ('00000000-0000-0000-0000-000000000005', 'apex_deactivated@shopos.local'),
  ('00000000-0000-0000-0000-000000000006', 'star_owner@shopos.local'),
  ('00000000-0000-0000-0000-000000000007', 'star_admin@shopos.local'),
  ('00000000-0000-0000-0000-000000000008', 'star_staff@shopos.local'),
  ('00000000-0000-0000-0000-000000000009', 'platform_admin@shopos.local')
ON CONFLICT (id) DO NOTHING;

-- 2. User Profiles
INSERT INTO public.profiles (id, full_name, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rajesh Sharma (Apex Owner)', '+919876543210'),
  ('00000000-0000-0000-0000-000000000002', 'Priya Patel (Apex Admin)', '+919876543211'),
  ('00000000-0000-0000-0000-000000000003', 'Amit Kumar (Apex Downtown Staff)', '+919876543212'),
  ('00000000-0000-0000-0000-000000000004', 'Sunita Rao (Apex West Staff)', '+919876543213'),
  ('00000000-0000-0000-0000-000000000005', 'Rohan Gupta (Apex Deactivated)', '+919876543214'),
  ('00000000-0000-0000-0000-000000000006', 'Vikram Singh (Star Owner)', '+919876543215'),
  ('00000000-0000-0000-0000-000000000007', 'Ananya Roy (Star Admin)', '+919876543216'),
  ('00000000-0000-0000-0000-000000000008', 'Deepak Verma (Star Staff)', '+919876543217'),
  ('00000000-0000-0000-0000-000000000009', 'Super Admin (ShopOS Platform)', '+919876543218')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 3. Organizations (Apex Mobiles & Star Cellular)
INSERT INTO public.organizations (id, name, slug, created_by) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Apex Mobiles', 'apex-mobiles', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000001', 'Star Cellular', 'star-cellular', '00000000-0000-0000-0000-000000000006')
ON CONFLICT (id) DO NOTHING;

-- 4. Organization Memberships
INSERT INTO public.organization_memberships (id, organization_id, user_id, role, status) VALUES
  -- Apex Mobiles members
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner', 'active'),
  ('11000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin', 'active'),
  ('11000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'staff', 'active'),
  ('11000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'staff', 'active'),
  ('11000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'staff', 'deactivated'),
  -- Star Cellular members
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'owner', 'active'),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'admin', 'active'),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'staff', 'active')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 5. Stores (Multiple per organization)
INSERT INTO public.stores (id, organization_id, name, code, address, phone, is_active) VALUES
  -- Apex Mobiles Stores
  ('12000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Apex Downtown', 'APEX-DT', '12 MG Road, Bengaluru', '+918012345678', true),
  ('12000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Apex West', 'APEX-WST', '45 Indiranagar, Bengaluru', '+918012345679', true),
  -- Star Cellular Stores
  ('22000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Star Central', 'STAR-CTR', '78 Linking Road, Mumbai', '+912212345678', true),
  ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Star Express', 'STAR-EXP', '99 Andheri West, Mumbai', '+912212345679', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Store Assignments
INSERT INTO public.store_assignments (id, organization_id, store_id, user_id) VALUES
  -- Apex Staff 1 assigned to Apex Downtown ONLY
  ('13000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'),
  -- Apex Staff 2 assigned to Apex West ONLY
  ('13000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '12000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004'),
  -- Star Staff assigned to Star Central ONLY
  ('23000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008')
ON CONFLICT (store_id, user_id) DO NOTHING;

-- 7. Platform Administrators
INSERT INTO public.platform_admins (id, user_id) VALUES
  ('99000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009')
ON CONFLICT (user_id) DO NOTHING;
