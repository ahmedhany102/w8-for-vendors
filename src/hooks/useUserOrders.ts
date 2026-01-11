
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useUserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchUserOrders = async () => {
    if (!user?.id || !session) {
      console.log('No authenticated user available for fetching orders');
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching orders for authenticated user:', {
        id: user.id,
        email: user.email
      });

      // Combined query: Find orders by user_id OR email in customer_info
      // Using a single query instead of two to reduce egress
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('id, customer_info, items, status, created_at')
        .or(`customer_info->>user_id.eq.${user.id},customer_info->>email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .range(0, 19); // Limit to 20 orders per user to reduce egress

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load your orders');
        setOrders([]);
        return;
      }

      // Deduplicate results (in case both conditions match same order)
      const uniqueOrders = allOrders?.filter((order, index, self) =>
        index === self.findIndex(o => o.id === order.id)
      ) || [];

      console.log('Successfully found user orders:', uniqueOrders);
      setOrders(uniqueOrders);

    } catch (error) {
      console.error('Exception while fetching user orders:', error);
      toast.error('Failed to load your orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && session) {
      console.log('User authenticated, fetching orders for:', user.id);
      fetchUserOrders();
    } else {
      console.log('No authenticated user, clearing orders');
      setLoading(false);
      setOrders([]);
    }
  }, [user?.id, user?.email, session]);

  const cancelOrder = async (orderId: string) => {
    if (!user?.id || !session) {
      toast.error('Please log in to cancel orders');
      return false;
    }

    try {
      setCancelling(orderId);
      console.log('🚫 Cancelling order:', orderId);

      const { data, error } = await supabase.rpc('cancel_user_order', {
        order_id: orderId
      });

      if (error) {
        console.error('❌ Error cancelling order:', error);
        toast.error('Failed to cancel order');
        return false;
      }

      if (data) {
        toast.success('Order cancelled successfully');
        await fetchUserOrders(); // Refresh orders
        return true;
      } else {
        toast.error('Cannot cancel this order - it may already be shipped');
        return false;
      }
    } catch (error) {
      console.error('💥 Exception cancelling order:', error);
      toast.error('Failed to cancel order');
      return false;
    } finally {
      setCancelling(null);
    }
  };

  return {
    orders,
    loading,
    cancelling,
    refetch: fetchUserOrders,
    cancelOrder
  };
};
