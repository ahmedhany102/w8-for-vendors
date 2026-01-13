
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash, Shield, Ban, CheckCircle } from 'lucide-react';
import { useSupabaseUsers } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { assignUserRole, updateUserStatus, deleteUserAccount, type UserRole } from '@/services/userManagementService';
import { useAuth } from '@/contexts/AuthContext';

const UsersPanel = () => {
  const { users, loading, updateUser, deleteUser, refetch } = useSupabaseUsers();
  const { user: currentUser } = useAuth();
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userToModify, setUserToModify] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Determine if current user is super admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!currentUser?.id) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      setIsSuperAdmin(!!data);
    };

    checkSuperAdmin();
  }, [currentUser]);

  const toggleBanUser = async (userId: string, currentStatus: string) => {
    if (!userId) return;

    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const success = await updateUserStatus(userId, newStatus);

    if (success) {
      toast.success(`تم ${newStatus === 'banned' ? 'حظر' : 'إلغاء حظر'} المستخدم بنجاح`);
      refetch();
    }
  };

  const handleChangeRole = (user: any) => {
    setUserToModify(user);
    // Determine current role from user_roles
    setSelectedRole(
      user.is_super_admin ? 'super_admin' : (user.is_admin ? 'admin' : 'user')
    );
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!userToModify || !selectedRole) return;

    const success = await assignUserRole(userToModify.id, selectedRole);

    if (success) {
      toast.success('تم تحديث الدور بنجاح');
      setShowRoleDialog(false);
      setUserToModify(null);
      refetch();
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const success = await deleteUserAccount(userToDelete.id);

    if (success) {
      toast.success('تم حذف المستخدم بنجاح');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      refetch();
    } else {
      setShowDeleteDialog(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();

    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }

    try {
      // Create admin user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            name: newAdmin.name
          }
        }
      });

      if (authError) {
        console.error('Error creating admin user:', authError);
        toast.error('حدث خطأ أثناء إنشاء حساب المسؤول');
        return;
      }

      // Assign admin role using secure function
      if (authData.user) {
        const success = await assignUserRole(authData.user.id, 'admin');

        if (success) {
          toast.success('تم إنشاء حساب المسؤول بنجاح');
          setShowAddAdminDialog(false);
          setNewAdmin({ name: '', email: '', password: '' });
          refetch();
        }
      }

    } catch (error) {
      console.error('Error creating admin user:', error);
      toast.error('حدث خطأ أثناء إنشاء حساب المسؤول');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
        <Button
          onClick={() => setShowAddAdminDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة مسؤول جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>المستخدمين - Total: {users.length}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      لا يوجد مستخدمين حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.name}
                          {user.is_vendor && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800 flex items-center gap-1">
                              🏪 Vendor
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.email}
                          {user.is_vendor && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                              Vendor
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_super_admin
                          ? 'مدير أعلى'
                          : (user.is_admin ? 'مدير' : 'مستخدم')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${user.status === 'banned'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                          }`}>
                          {user.status === 'banned' ? 'محظور' : 'نشط'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!user.is_super_admin && (
                            <>
                              {/* Change Role (Super Admin only) */}
                              {isSuperAdmin && (
                                <Button
                                  onClick={() => handleChangeRole(user)}
                                  variant="outline"
                                  size="sm"
                                  title="تغيير الدور"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Ban/Unban */}
                              <Button
                                onClick={() => toggleBanUser(user.id, user.status)}
                                variant={user.status === 'banned' ? "outline" : "destructive"}
                                size="sm"
                                title={user.status === 'banned' ? 'إلغاء الحظر' : 'حظر'}
                              >
                                {user.status === 'banned' ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <Ban className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Delete */}
                              <Button
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteDialog(true);
                                }}
                                variant="destructive"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                                title="حذف"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إضافة مسؤول جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المسؤول الجديد. سوف يتمكن من الوصول إلى لوحة التحكم.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAdmin}>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  name="name"
                  value={newAdmin.name}
                  onChange={handleInputChange}
                  placeholder="اسم المسؤول"
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={handleInputChange}
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={handleInputChange}
                  placeholder="******"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تغيير دور المستخدم</DialogTitle>
            <DialogDescription>
              اختر الدور الجديد للمستخدم: {userToModify?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role">الدور</Label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">مستخدم عادي</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                {isSuperAdmin && (
                  <SelectItem value="super_admin" disabled>
                    مدير أعلى (غير متاح)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRoleDialog(false)} variant="outline">
              إلغاء
            </Button>
            <Button onClick={handleSaveRole} className="bg-primary">
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تأكيد حذف المستخدم</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من أنك تريد حذف {userToDelete?.name} بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleDeleteUser}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              حذف نهائياً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPanel;
