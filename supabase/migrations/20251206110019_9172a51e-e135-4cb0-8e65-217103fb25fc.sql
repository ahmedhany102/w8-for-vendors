-- Phase 4: Create order_items table for multi-vendor order splitting

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  product_name text NOT NULL,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  size text,
  color text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_vendor_id ON public.order_items(vendor_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_items

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items"
ON public.order_items
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Vendors can view their own order items
CREATE POLICY "Vendors can view their order items"
ON public.order_items
FOR SELECT
USING (vendor_id = auth.uid());

-- Vendors can update their own order item status (for shipping updates)
CREATE POLICY "Vendors can update their order item status"
ON public.order_items
FOR UPDATE
USING (vendor_id = auth.uid())
WITH CHECK (vendor_id = auth.uid());

-- Users can view order items from their orders
CREATE POLICY "Users can view their order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_items.order_id 
    AND (
      (o.customer_info->>'user_id')::uuid = auth.uid()
      OR o.customer_info->>'email' = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get vendor orders (orders containing items for a specific vendor)
CREATE OR REPLACE FUNCTION public.get_vendor_orders(_vendor_id uuid DEFAULT NULL, _status_filter text DEFAULT NULL)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  order_status text,
  order_date timestamp with time zone,
  customer_name text,
  customer_email text,
  customer_phone text,
  item_count bigint,
  vendor_total numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_vendor_id uuid;
BEGIN
  -- If admin and no vendor specified, show all. Otherwise use current user or specified vendor
  IF is_admin(auth.uid()) AND _vendor_id IS NOT NULL THEN
    effective_vendor_id := _vendor_id;
  ELSIF is_admin(auth.uid()) AND _vendor_id IS NULL THEN
    effective_vendor_id := NULL; -- Admin sees all
  ELSE
    effective_vendor_id := auth.uid(); -- Vendor sees only their own
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id AS order_id,
    o.order_number,
    o.status AS order_status,
    o.created_at AS order_date,
    o.customer_info->>'name' AS customer_name,
    o.customer_info->>'email' AS customer_email,
    o.customer_info->>'phone' AS customer_phone,
    COUNT(oi.id) AS item_count,
    SUM(oi.total_price) AS vendor_total
  FROM public.orders o
  INNER JOIN public.order_items oi ON oi.order_id = o.id
  WHERE 
    (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id)
    AND (_status_filter IS NULL OR _status_filter = 'all' OR o.status = _status_filter)
  GROUP BY o.id, o.order_number, o.status, o.created_at, o.customer_info
  ORDER BY o.created_at DESC;
END;
$$;

-- Function to get vendor order details (items for a specific vendor in an order)
CREATE OR REPLACE FUNCTION public.get_vendor_order_items(_order_id uuid, _vendor_id uuid DEFAULT NULL)
RETURNS TABLE (
  item_id uuid,
  product_id uuid,
  product_name text,
  product_image text,
  quantity integer,
  unit_price numeric,
  total_price numeric,
  size text,
  color text,
  item_status text,
  vendor_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_vendor_id uuid;
BEGIN
  -- If admin, can see all items. Otherwise filter to current user's items
  IF is_admin(auth.uid()) THEN
    effective_vendor_id := _vendor_id; -- Admin can optionally filter
  ELSE
    effective_vendor_id := auth.uid(); -- Vendor sees only their items
  END IF;
  
  RETURN QUERY
  SELECT 
    oi.id AS item_id,
    oi.product_id,
    oi.product_name,
    oi.product_image,
    oi.quantity,
    oi.unit_price,
    oi.total_price,
    oi.size,
    oi.color,
    oi.status AS item_status,
    oi.vendor_id
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
    AND (effective_vendor_id IS NULL OR oi.vendor_id = effective_vendor_id)
  ORDER BY oi.created_at;
END;
$$;

-- Function to update vendor order item status
CREATE OR REPLACE FUNCTION public.update_order_item_status(_item_id uuid, _new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate status
  IF _new_status NOT IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status. Must be pending, processing, shipped, delivered, or cancelled';
  END IF;
  
  -- Check if user can update (vendor or admin)
  IF NOT is_admin(auth.uid()) THEN
    -- Verify vendor owns this item
    IF NOT EXISTS (
      SELECT 1 FROM public.order_items 
      WHERE id = _item_id AND vendor_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized to update this order item';
    END IF;
  END IF;
  
  -- Update status
  UPDATE public.order_items
  SET status = _new_status, updated_at = now()
  WHERE id = _item_id;
  
  RETURN FOUND;
END;
$$;