
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { checkAdminStatus } from "@/utils/secureAuth";

interface RequireAuthProps {
  adminOnly?: boolean;
  children?: JSX.Element;
}

export const RequireAuth = ({ adminOnly = false, children }: RequireAuthProps) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();
  const [adminCheckLoading, setAdminCheckLoading] = useState(adminOnly);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Server-side admin verification
  useEffect(() => {
    if (adminOnly && user && !loading) {
      setAdminCheckLoading(true);
      checkAdminStatus(user.id)
        .then(isAdmin => {
          setIsUserAdmin(isAdmin);
          setAdminCheckLoading(false);
        })
        .catch(() => {
          setIsUserAdmin(false);
          setAdminCheckLoading(false);
        });
    }
  }, [adminOnly, user, loading]);

  console.log('🛡️ RequireAuth - Auth State:', {
    user: user?.email || 'No user',
    session: !!session,
    loading,
    adminOnly,
    adminCheckLoading,
    isUserAdmin,
    location: location.pathname
  });

  // Show loading spinner while auth is being determined
  if (loading || (adminOnly && adminCheckLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800 font-medium">جاري التحقق من المصادقة...</p>
          <p className="mt-2 text-sm text-gray-600">
            Session: {session ? '✅' : '❌'} | User: {user ? '✅' : '❌'}
            {adminOnly && ` | Admin Check: ${adminCheckLoading ? '⏳' : isUserAdmin ? '✅' : '❌'}`}
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user || !session) {
    console.log('❌ User not authenticated, redirecting to login');
    toast.error("يرجى تسجيل الدخول للوصول إلى هذه الصفحة");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin permissions using server-side verification
  if (adminOnly && !isUserAdmin) {
    console.log('⛔ Admin access required but user is not admin', {
      isUserAdmin,
      adminOnly
    });
    toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
    return <Navigate to="/" replace />;
  }

  // Authentication successful
  console.log('✅ Authentication successful, rendering protected content');
  return children ? children : <Outlet />;
};
