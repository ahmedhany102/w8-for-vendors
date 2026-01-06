
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders from Supabase...');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
        return;
      }
      
      console.log('Successfully fetched orders:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Exception while fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const addOrder = async (orderData) => {
    try {
      console.log('Adding order to database:', orderData);
      
      // Strict validation for required fields
      if (!orderData.customer_info?.name) {
        const errorMsg = 'Customer name is required';
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!orderData.customer_info?.email) {
        const errorMsg = 'Customer email is required';
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
      }
      
      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        const errorMsg = 'Order must contain at least one item';
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!orderData.total_amount || orderData.total_amount <= 0) {
        const errorMsg = 'Valid order total is required';
        console.error('Validation error:', errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Fetch vendor_id (vendors.id) for each product
      const productIds = orderData.items.map(item => item.productId);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, vendor_id, main_image, image_url')
        .in('id', productIds);

      if (productsError) {
        console.error('Error fetching product vendors:', productsError);
      }

      // Create a map of product_id -> vendor_id (vendors.id)
      const productVendorMap: Record<string, { vendor_id: string; image: string }> = {};
      (products || []).forEach(p => {
        productVendorMap[p.id] = {
          vendor_id: p.vendor_id, // This is vendors.id, NOT user_id
          image: p.main_image || p.image_url || ''
        };
      });
      
      // Ensure proper data structure for database insert
      const cleanOrderData = {
        order_number: orderData.order_number || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_info: {
          user_id: orderData.customer_info.user_id || null,
          name: orderData.customer_info.name.trim(),
          email: orderData.customer_info.email.trim(),
          phone: orderData.customer_info.phone?.trim() || '',
          address: {
            street: orderData.customer_info.address?.street?.trim() || '',
            city: orderData.customer_info.address?.city?.trim() || '',
            zipCode: orderData.customer_info.address?.zipCode?.trim() || ''
          }
        },
        items: orderData.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: parseInt(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          totalPrice: parseFloat(item.totalPrice) || 0,
          imageUrl: item.imageUrl || '',
          color: item.color || '-',
          size: item.size || '-'
        })),
        total_amount: parseFloat(orderData.total_amount),
        status: orderData.status || 'PENDING',
        payment_status: orderData.payment_status || 'PENDING',
        payment_info: orderData.payment_info || { method: 'CASH' },
        notes: orderData.notes?.trim() || '',
        coupon_info: orderData.coupon_info || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Cleaned order data for database insert:', cleanOrderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([cleanOrderData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase order insert error:', error);
        toast.error('Failed to create order: ' + error.message);
        throw error;
      }
      
      if (!data) {
        const errorMsg = 'No data returned from order insert';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Create order_items for multi-vendor tracking
      const orderItems = orderData.items.map(item => {
        const productInfo = productVendorMap[item.productId] || { vendor_id: null, image: '' };
        return {
          order_id: data.id,
          product_id: item.productId,
          vendor_id: productInfo.vendor_id,
          product_name: item.productName,
          product_image: item.imageUrl || productInfo.image || '',
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unitPrice) || 0,
          total_price: parseFloat(item.totalPrice) || 0,
          size: item.size !== '-' ? item.size : null,
          color: item.color !== '-' ? item.color : null,
          status: 'pending'
        };
      }).filter(item => item.vendor_id); // Only create items with valid vendor_id

      if (orderItems.length > 0) {
        console.log('Creating order_items for multi-vendor tracking:', orderItems);
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order_items:', itemsError);
          // Don't fail the order, just log the error
        } else {
          console.log('✅ Order items created successfully for vendor tracking');
        }

        // Decrement stock for each item
        for (const item of orderData.items) {
          const color = item.color && item.color !== '-' ? item.color : null;
          const size = item.size && item.size !== '-' ? item.size : null;
          
          if (color && size) {
            try {
              const { error: stockError } = await supabase.rpc('decrement_product_stock', {
                p_product_id: item.productId,
                p_color: color,
                p_size: size,
                p_quantity: parseInt(item.quantity) || 1
              });

              if (stockError) {
                console.warn('Stock decrement warning for product:', item.productId, stockError.message);
                // Continue with order even if stock decrement fails
              } else {
                console.log('✅ Stock decremented for:', item.productName, color, size);
              }
            } catch (stockErr) {
              console.warn('Stock decrement error:', stockErr);
            }
          }
        }
      }
      
      console.log('Order successfully created in database:', data);
      toast.success('Order created successfully!');
      
      // Refresh orders from database
      await fetchOrders();
      return data;
      
    } catch (error) {
      console.error('Exception in addOrder:', error);
      throw error;
    }
  };

  const updateOrder = async (id, updates) => {
    try {
      console.log('Updating order in database:', id, updates);
      
      if (!id) {
        const errorMsg = 'Order ID is required for update';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const cleanUpdates = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      console.log('Cleaned order updates:', cleanUpdates);
      
      const { data, error } = await supabase
        .from('orders')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase order update error:', error);
        toast.error('Failed to update order: ' + error.message);
        throw error;
      }
      
      if (!data) {
        const errorMsg = 'No data returned from order update';
        console.error(errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log('Order successfully updated in database:', data);
      toast.success('Order updated successfully');
      
      // Refresh orders from database
      await fetchOrders();
      return data;
      
    } catch (error) {
      console.error('Exception in updateOrder:', error);
      throw error;
    }
  };

  return { 
    orders, 
    loading, 
    addOrder, 
    updateOrder, 
    refetch: fetchOrders 
  };
};
