-- AMK Store v4 Database Seed Data
-- This file contains sample data for development and testing

-- ============================================================================
-- ADMIN USERS
-- ============================================================================
-- Create super admin user (manually for initial setup)
-- Note: In production, admin roles should be assigned after email confirmation

-- Insert or update profiles for admin users
-- These IDs should match actual auth.users entries created via signup
INSERT INTO public.profiles 
  (id, email, full_name, credit_balance, role, created_at, updated_at)
VALUES 
  -- Super Admin (replace with actual UUID from auth.users)
  ('00000000-0000-0000-0000-000000000001', 'admin@amkstore.dev', 'Super Admin', 0.00, 'super_admin', NOW(), NOW()),
  -- Regular Admin  
  ('00000000-0000-0000-0000-000000000002', 'manager@amkstore.dev', 'Store Manager', 0.00, 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- ============================================================================
-- SAMPLE PRODUCTS
-- ============================================================================

-- PlayStation 5 Games
INSERT INTO public.products 
  (name, description, platform, price, image_url, is_active, created_at, updated_at)
VALUES 
  ('Spider-Man 2 PS5', 'The latest Spider-Man adventure for PlayStation 5. Digital download code.', 'PS5', 69.99, '/images/spiderman2-ps5.jpg', true, NOW(), NOW()),
  ('God of War Ragnarök PS5', 'Epic Norse mythology adventure continues. Digital code for PS5.', 'PS5', 59.99, '/images/god-of-war-ragnarok.jpg', true, NOW(), NOW()),
  ('Horizon Forbidden West PS5', 'Explore a beautiful post-apocalyptic world. PS5 digital edition.', 'PS5', 49.99, '/images/horizon-forbidden-west.jpg', true, NOW(), NOW()),
  ('Gran Turismo 7 PS5', 'The ultimate racing simulator for PlayStation 5.', 'PS5', 39.99, '/images/gran-turismo-7.jpg', true, NOW(), NOW()),
  ('Ratchet & Clank: Rift Apart PS5', 'Interdimensional adventure showcasing PS5 capabilities.', 'PS5', 34.99, '/images/ratchet-clank-rift-apart.jpg', true, NOW(), NOW()),

-- Xbox Games  
  ('Forza Horizon 5 Xbox', 'Open world racing in Mexico. Xbox digital download.', 'Xbox', 59.99, '/images/forza-horizon-5.jpg', true, NOW(), NOW()),
  ('Halo Infinite Xbox', 'Master Chief returns in this epic sci-fi shooter.', 'Xbox', 49.99, '/images/halo-infinite.jpg', true, NOW(), NOW()),
  ('Microsoft Flight Simulator Xbox', 'Realistic flight simulation experience.', 'Xbox', 44.99, '/images/flight-simulator.jpg', true, NOW(), NOW()),
  ('Gears 5 Xbox', 'Intense third-person shooter action.', 'Xbox', 29.99, '/images/gears-5.jpg', true, NOW(), NOW()),
  ('Age of Empires IV Xbox', 'Real-time strategy at its finest.', 'Xbox', 39.99, '/images/age-of-empires-4.jpg', true, NOW(), NOW()),

-- Roblox Gift Cards
  ('Roblox Gift Card $10', 'Add $10 worth of Robux to your Roblox account.', 'Roblox', 10.00, '/images/roblox-10.jpg', true, NOW(), NOW()),
  ('Roblox Gift Card $25', 'Add $25 worth of Robux to your Roblox account.', 'Roblox', 25.00, '/images/roblox-25.jpg', true, NOW(), NOW()),
  ('Roblox Gift Card $50', 'Add $50 worth of Robux to your Roblox account.', 'Roblox', 50.00, '/images/roblox-50.jpg', true, NOW(), NOW()),

-- PC/Steam Games
  ('Cyberpunk 2077 PC', 'Futuristic RPG in Night City. Steam download code.', 'PC', 39.99, '/images/cyberpunk-2077.jpg', true, NOW(), NOW()),
  ('Elden Ring PC', 'From Software''s epic dark fantasy adventure.', 'PC', 54.99, '/images/elden-ring.jpg', true, NOW(), NOW()),
  ('Counter-Strike 2 PC', 'The legendary FPS returns with updated graphics.', 'PC', 0.00, '/images/cs2.jpg', true, NOW(), NOW()),
  ('Baldur''s Gate 3 PC', 'Epic D&D RPG adventure with friends.', 'PC', 59.99, '/images/baldurs-gate-3.jpg', true, NOW(), NOW()),
  ('Palworld PC', 'Creature collection and survival game.', 'PC', 29.99, '/images/palworld.jpg', true, NOW(), NOW());

-- ============================================================================
-- SAMPLE GAME CODES (Encrypted)
-- ============================================================================
-- Note: In production, these would be properly encrypted using AES-256-GCM
-- For development, we're using simple placeholder "encrypted" codes

-- Get product IDs for code generation
DO $$
DECLARE
    ps5_spiderman_id UUID;
    ps5_god_of_war_id UUID;
    xbox_forza_id UUID;
    roblox_10_id UUID;
    pc_elden_ring_id UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO ps5_spiderman_id FROM public.products WHERE name = 'Spider-Man 2 PS5';
    SELECT id INTO ps5_god_of_war_id FROM public.products WHERE name = 'God of War Ragnarök PS5';
    SELECT id INTO xbox_forza_id FROM public.products WHERE name = 'Forza Horizon 5 Xbox';
    SELECT id INTO roblox_10_id FROM public.products WHERE name = 'Roblox Gift Card $10';
    SELECT id INTO pc_elden_ring_id FROM public.products WHERE name = 'Elden Ring PC';

    -- Insert sample game codes
    INSERT INTO public.game_codes 
      (product_id, encrypted_code, is_sold, created_at)
    VALUES 
      -- Spider-Man 2 PS5 codes
      (ps5_spiderman_id, 'ENC_SPIDERMAN2_CODE_001', false, NOW()),
      (ps5_spiderman_id, 'ENC_SPIDERMAN2_CODE_002', false, NOW()),
      (ps5_spiderman_id, 'ENC_SPIDERMAN2_CODE_003', false, NOW()),
      
      -- God of War Ragnarök codes
      (ps5_god_of_war_id, 'ENC_GODOFWAR_CODE_001', false, NOW()),
      (ps5_god_of_war_id, 'ENC_GODOFWAR_CODE_002', false, NOW()),
      
      -- Forza Horizon 5 codes
      (xbox_forza_id, 'ENC_FORZA_CODE_001', false, NOW()),
      (xbox_forza_id, 'ENC_FORZA_CODE_002', false, NOW()),
      (xbox_forza_id, 'ENC_FORZA_CODE_003', false, NOW()),
      
      -- Roblox $10 gift cards
      (roblox_10_id, 'ENC_ROBLOX10_CODE_001', false, NOW()),
      (roblox_10_id, 'ENC_ROBLOX10_CODE_002', false, NOW()),
      (roblox_10_id, 'ENC_ROBLOX10_CODE_003', false, NOW()),
      (roblox_10_id, 'ENC_ROBLOX10_CODE_004', false, NOW()),
      (roblox_10_id, 'ENC_ROBLOX10_CODE_005', false, NOW()),
      
      -- Elden Ring PC codes
      (pc_elden_ring_id, 'ENC_ELDENRING_CODE_001', false, NOW()),
      (pc_elden_ring_id, 'ENC_ELDENRING_CODE_002', false, NOW());
END $$;

-- ============================================================================
-- TEST CUSTOMER USERS
-- ============================================================================
-- Create test customer profiles with different credit balances
INSERT INTO public.profiles 
  (id, email, full_name, credit_balance, role, created_at, updated_at)
VALUES 
  ('10000000-0000-0000-0000-000000000001', 'customer1@test.dev', 'John Gaming', 150.00, 'customer', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000002', 'customer2@test.dev', 'Sarah Player', 75.50, 'customer', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000003', 'customer3@test.dev', 'Mike Gamer', 0.00, 'customer', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000004', 'customer4@test.dev', 'Lisa Console', 250.00, 'customer', NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000005', 'customer5@test.dev', 'Alex Streamer', 25.99, 'customer', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  credit_balance = EXCLUDED.credit_balance,
  updated_at = NOW();

-- ============================================================================
-- SAMPLE CREDIT REQUESTS
-- ============================================================================
INSERT INTO public.credit_requests 
  (user_id, amount, payment_proof_url, status, admin_notes, reviewed_by, reviewed_at, created_at)
VALUES 
  -- Approved credit requests
  ('10000000-0000-0000-0000-000000000001', 100.00, '/uploads/payment-proof-1.jpg', 'approved', 'Payment verified via bank transfer', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000002', 50.00, '/uploads/payment-proof-2.jpg', 'approved', 'PayPal payment confirmed', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
  
  -- Pending credit requests
  ('10000000-0000-0000-0000-000000000003', 75.00, '/uploads/payment-proof-3.jpg', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '1 hour'),
  ('10000000-0000-0000-0000-000000000005', 40.00, '/uploads/payment-proof-4.jpg', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '30 minutes'),
  
  -- Rejected credit request
  ('10000000-0000-0000-0000-000000000004', 500.00, '/uploads/payment-proof-5.jpg', 'rejected', 'Payment proof unclear, please resubmit with clearer image', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days');

-- ============================================================================
-- SAMPLE ORDERS AND ORDER ITEMS
-- ============================================================================
DO $$
DECLARE
    customer1_id UUID := '10000000-0000-0000-0000-000000000001';
    customer2_id UUID := '10000000-0000-0000-0000-000000000002';
    customer4_id UUID := '10000000-0000-0000-0000-000000000004';
    
    order1_id UUID;
    order2_id UUID;
    order3_id UUID;
    
    ps5_spiderman_id UUID;
    roblox_10_id UUID;
    xbox_forza_id UUID;
    pc_elden_ring_id UUID;
    
    code1_id UUID;
    code2_id UUID;
    code3_id UUID;
    code4_id UUID;
BEGIN
    -- Get product IDs
    SELECT id INTO ps5_spiderman_id FROM public.products WHERE name = 'Spider-Man 2 PS5';
    SELECT id INTO roblox_10_id FROM public.products WHERE name = 'Roblox Gift Card $10';
    SELECT id INTO xbox_forza_id FROM public.products WHERE name = 'Forza Horizon 5 Xbox';
    SELECT id INTO pc_elden_ring_id FROM public.products WHERE name = 'Elden Ring PC';

    -- Create sample orders
    INSERT INTO public.orders 
      (user_id, total_amount, payment_method, status, created_at)
    VALUES 
      (customer1_id, 69.99, 'credit', 'completed', NOW() - INTERVAL '5 days'),
      (customer2_id, 10.00, 'credit', 'completed', NOW() - INTERVAL '3 days'),
      (customer4_id, 114.98, 'credit', 'completed', NOW() - INTERVAL '1 day')
    RETURNING * INTO order1_id, order2_id, order3_id;

    -- Get the actual order IDs
    SELECT id INTO order1_id FROM public.orders WHERE user_id = customer1_id AND total_amount = 69.99;
    SELECT id INTO order2_id FROM public.orders WHERE user_id = customer2_id AND total_amount = 10.00;
    SELECT id INTO order3_id FROM public.orders WHERE user_id = customer4_id AND total_amount = 114.98;

    -- Get available game codes for orders
    SELECT id INTO code1_id FROM public.game_codes WHERE product_id = ps5_spiderman_id AND is_sold = false LIMIT 1;
    SELECT id INTO code2_id FROM public.game_codes WHERE product_id = roblox_10_id AND is_sold = false LIMIT 1;
    SELECT id INTO code3_id FROM public.game_codes WHERE product_id = xbox_forza_id AND is_sold = false LIMIT 1;
    SELECT id INTO code4_id FROM public.game_codes WHERE product_id = pc_elden_ring_id AND is_sold = false LIMIT 1;

    -- Create order items
    INSERT INTO public.order_items 
      (order_id, product_id, game_code_id, quantity, unit_price, created_at)
    VALUES 
      (order1_id, ps5_spiderman_id, code1_id, 1, 69.99, NOW() - INTERVAL '5 days'),
      (order2_id, roblox_10_id, code2_id, 1, 10.00, NOW() - INTERVAL '3 days'),
      (order3_id, xbox_forza_id, code3_id, 1, 59.99, NOW() - INTERVAL '1 day'),
      (order3_id, pc_elden_ring_id, code4_id, 1, 54.99, NOW() - INTERVAL '1 day');

    -- Mark game codes as sold
    UPDATE public.game_codes 
    SET is_sold = true, sold_at = NOW() - INTERVAL '5 days', order_id = order1_id
    WHERE id = code1_id;

    UPDATE public.game_codes 
    SET is_sold = true, sold_at = NOW() - INTERVAL '3 days', order_id = order2_id
    WHERE id = code2_id;

    UPDATE public.game_codes 
    SET is_sold = true, sold_at = NOW() - INTERVAL '1 day', order_id = order3_id
    WHERE id = code3_id;

    UPDATE public.game_codes 
    SET is_sold = true, sold_at = NOW() - INTERVAL '1 day', order_id = order3_id
    WHERE id = code4_id;

END $$;

-- ============================================================================
-- UPDATE CUSTOMER CREDIT BALANCES BASED ON TRANSACTIONS
-- ============================================================================
-- Deduct amounts for completed orders
UPDATE public.profiles 
SET credit_balance = credit_balance - 69.99, updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE public.profiles 
SET credit_balance = credit_balance - 10.00, updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE public.profiles 
SET credit_balance = credit_balance - 114.98, updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000004';

-- ============================================================================
-- VERIFICATION QUERIES (for development testing)
-- ============================================================================
-- These are just for reference, not executed

/*
-- Verify admin users
SELECT id, email, full_name, role FROM public.profiles WHERE role IN ('admin', 'super_admin');

-- Verify products
SELECT COUNT(*) as total_products, platform, AVG(price) as avg_price 
FROM public.products 
GROUP BY platform;

-- Verify game codes
SELECT p.platform, COUNT(gc.*) as total_codes, COUNT(CASE WHEN gc.is_sold THEN 1 END) as sold_codes
FROM public.products p
LEFT JOIN public.game_codes gc ON p.id = gc.product_id
GROUP BY p.platform;

-- Verify customers
SELECT COUNT(*) as total_customers, SUM(credit_balance) as total_credits 
FROM public.profiles 
WHERE role = 'customer';

-- Verify orders
SELECT COUNT(*) as total_orders, SUM(total_amount) as total_revenue 
FROM public.orders 
WHERE status = 'completed';

-- Verify credit requests by status
SELECT status, COUNT(*) as count, SUM(amount) as total_amount 
FROM public.credit_requests 
GROUP BY status;
*/

-- ============================================================================
-- SEED COMPLETION
-- ============================================================================
-- Insert a completion marker
INSERT INTO public.profiles 
  (id, email, full_name, credit_balance, role, created_at, updated_at)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'seed@amkstore.system', 'Database Seed Completed', 0.00, 'customer', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET updated_at = NOW(); 