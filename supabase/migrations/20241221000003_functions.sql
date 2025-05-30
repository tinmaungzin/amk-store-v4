-- Function to safely update credit balance
CREATE OR REPLACE FUNCTION update_credit_balance(
  user_id UUID,
  amount_change DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET 
    credit_balance = credit_balance + amount_change,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Ensure balance doesn't go negative
  UPDATE profiles 
  SET credit_balance = 0 
  WHERE id = user_id AND credit_balance < 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available game codes count for a product
CREATE OR REPLACE FUNCTION get_available_codes_count(product_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM game_codes
    WHERE product_id = $1 AND is_sold = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve game codes for an order
CREATE OR REPLACE FUNCTION reserve_game_codes(
  p_product_id UUID,
  p_quantity INTEGER,
  p_order_id UUID
)
RETURNS TABLE(code_id UUID) AS $$
BEGIN
  RETURN QUERY
  UPDATE game_codes
  SET 
    is_sold = true,
    sold_at = NOW(),
    order_id = p_order_id
  WHERE id IN (
    SELECT gc.id
    FROM game_codes gc
    WHERE gc.product_id = p_product_id 
    AND gc.is_sold = false
    LIMIT p_quantity
  )
  RETURNING id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order total
CREATE OR REPLACE FUNCTION get_order_total(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_items
    WHERE order_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_credit_balance(UUID, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_codes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reserve_game_codes(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_total(UUID) TO authenticated; 