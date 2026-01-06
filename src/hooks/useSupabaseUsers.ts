
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }
      
      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData) => {
    try {
      console.log('Adding user:', userData);
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...userData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding user:', error);
        toast.error('Failed to add user: ' + error.message);
        throw error;
      }
      
      console.log('User added successfully:', data);
      toast.success('User added successfully');
      await fetchUsers();
      return data;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      console.log('Updating user:', id, updates);
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating user:', error);
        toast.error('Failed to update user: ' + error.message);
        throw error;
      }
      
      console.log('User updated successfully:', data);
      toast.success('User updated successfully');
      await fetchUsers();
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      console.log('Deleting user:', id);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user: ' + error.message);
        throw error;
      }
      
      console.log('User deleted successfully');
      toast.success('User deleted successfully');
      await fetchUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  return { users, loading, addUser, updateUser, deleteUser, refetch: fetchUsers };
};
