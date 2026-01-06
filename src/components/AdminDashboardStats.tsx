
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface AdminDashboardStatsProps {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  loading: boolean;
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({
  totalProducts,
  totalUsers,
  totalOrders,
  loading
}) => {
  const stats = [
    {
      title: 'Total Products',
      value: loading ? '...' : totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Users',
      value: loading ? '...' : totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : totalOrders,
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Revenue',
      value: loading ? '...' : 'EGP 0',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? 'Loading...' : 'Real-time data'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AdminDashboardStats;
