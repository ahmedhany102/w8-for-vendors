
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { checkVendorStatus, checkAdminStatus } from "@/utils/secureAuth";

interface RequireVendorAuthProps {
  children?: JSX.Element;
}

export const RequireVendorAuth = ({ children }: RequireVendorAuthProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();
  const [vendorCheckLoading, setVendorCheckLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Server-side vendor and admin verification
  useEffect(() => {
    if (user && !loading) {
      setVendorCheckLoading(true);
      
      // Check both vendor and admin status
      Promise.all([
        checkVendorStatus(user.id),
        checkAdminStatus(user.id)
      ])
        .then(([canManageVendor, isAdmin]) => {
          setIsVendor(canManageVendor);
          setIsSuperAdmin(isAdmin);
          setVendorCheckLoading(false);
        })
        .catch(() => {
          setIsVendor(false);
          setIsSuperAdmin(false);
          setVendorCheckLoading(false);
        });
    } else if (!loading && !user) {
      setVendorCheckLoading(false);
    }
  }, [user, loading]);

  console.log('🏪 RequireVendorAuth - Auth State:', {
    user: user?.email || 'No user',
    session: !!session,
    loading,
    vendorCheckLoading,
    isVendor,
    isSuperAdmin,
    location: location.pathname
  });

  // Show loading spinner while auth is being determined
  if (loading || vendorCheckLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800 font-medium">جاري التحقق من صلاحيات البائع...</p>
          <p className="mt-2 text-sm text-gray-600">
            Session: {session ? '✅' : '❌'} | User: {user ? '✅' : '❌'} | Vendor Check: {vendorCheckLoading ? '⏳' : isVendor ? '✅' : '❌'}
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user || !session) {
    console.log('❌ User not authenticated, redirecting to login');
    toast.error("يرجى تسجيل الدخول للوصول إلى لوحة تحكم البائع");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super admin should go to admin dashboard, not vendor dashboard
  if (isSuperAdmin) {
    console.log('👑 Super admin detected, redirecting to admin dashboard');
    return <Navigate to="/admin" replace />;
  }

  // Check vendor permissions using server-side verification
  if (!isVendor) {
    console.log('⛔ Vendor access required but user is not vendor', { isVendor });
    toast.error("ليس لديك صلاحية الوصول إلى لوحة تحكم البائع");
    return <Navigate to="/" replace />;
  }

  // Authentication successful
  console.log('✅ Vendor authentication successful, rendering vendor content');
  return children ? children : <Outlet />;
};
