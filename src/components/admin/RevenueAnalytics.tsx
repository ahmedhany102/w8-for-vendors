import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Users, Package, Percent, Edit2, BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VendorAnalytics {
  vendor_id: string;
  vendor_name: string;
  commission_rate: number;
  total_orders: number;
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  platform_commission: number;
  vendor_payout: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

const RevenueAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<VendorAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorAnalytics | null>(null);
  const [showCommissionDialog, setShowCommissionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [newCommissionRate, setNewCommissionRate] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_vendor_analytics');

      if (error) throw error;
      setAnalytics((data as VendorAnalytics[]) || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async (vendorId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_vendor_top_products', {
        _vendor_id: vendorId,
        _limit: 5
      });

      if (error) throw error;
      setTopProducts((data as TopProduct[]) || []);
    } catch (error: any) {
      console.error('Error fetching top products:', error);
      setTopProducts([]);
    }
  };

  const handleUpdateCommission = async () => {
    if (!selectedVendor) return;
    
    const rate = parseFloat(newCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('update_vendor_commission', {
        _vendor_id: selectedVendor.vendor_id,
        _commission_rate: rate
      });

      if (error) throw error;

      toast.success('Commission rate updated successfully');
      setShowCommissionDialog(false);
      setSelectedVendor(null);
      setNewCommissionRate('');
      fetchAnalytics();
    } catch (error: any) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission rate: ' + error.message);
    }
  };

  const openCommissionDialog = (vendor: VendorAnalytics) => {
    setSelectedVendor(vendor);
    setNewCommissionRate(vendor.commission_rate.toString());
    setShowCommissionDialog(true);
  };

  const openDetailsDialog = async (vendor: VendorAnalytics) => {
    setSelectedVendor(vendor);
    await fetchTopProducts(vendor.vendor_id);
    setShowDetailsDialog(true);
  };

  // Calculate totals
  const totals = analytics.reduce((acc, v) => ({
    totalRevenue: acc.totalRevenue + (v.total_revenue || 0),
    totalCommission: acc.totalCommission + (v.platform_commission || 0),
    totalOrders: acc.totalOrders + (v.total_orders || 0),
    todayRevenue: acc.todayRevenue + (v.today_revenue || 0),
    weekRevenue: acc.weekRevenue + (v.week_revenue || 0),
    monthRevenue: acc.monthRevenue + (v.month_revenue || 0),
  }), {
    totalRevenue: 0,
    totalCommission: 0,
    totalOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Revenue & Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Monitor vendor performance and manage commission rates.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Platform Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totals.monthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Vendors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length}</div>
            <p className="text-xs text-muted-foreground">With sales data</p>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Today's Revenue</p>
              <p className="text-3xl font-bold text-blue-600">${totals.todayRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-3xl font-bold text-purple-600">${totals.weekRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold text-green-600">{totals.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Vendor Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No vendor sales data yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Commission %</TableHead>
                  <TableHead className="text-right">Platform Earnings</TableHead>
                  <TableHead className="text-right">Vendor Payout</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.map((vendor) => (
                  <TableRow key={vendor.vendor_id}>
                    <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                    <TableCell className="text-right">{vendor.total_orders}</TableCell>
                    <TableCell className="text-right">${vendor.total_revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1 text-orange-600 font-medium">
                        {vendor.commission_rate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${vendor.platform_commission.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      ${vendor.vendor_payout.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDetailsDialog(vendor)}
                          title="View Details"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openCommissionDialog(vendor)}
                          title="Edit Commission"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commission Edit Dialog */}
      <Dialog open={showCommissionDialog} onOpenChange={setShowCommissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Commission Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Vendor: <strong>{selectedVendor?.vendor_name}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Current Rate: <strong>{selectedVendor?.commission_rate}%</strong>
              </p>
            </div>
            <div>
              <Label>New Commission Rate (%)</Label>
              <Input 
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                placeholder="e.g. 10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a value between 0 and 100
              </p>
            </div>
            <Button onClick={handleUpdateCommission} className="w-full">
              Update Commission Rate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vendor Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedVendor?.vendor_name} - Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Revenue Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-lg font-bold">${selectedVendor?.today_revenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-lg font-bold">${selectedVendor?.week_revenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className="text-lg font-bold">${selectedVendor?.month_revenue.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold">{selectedVendor?.total_orders}</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <div>
              <h4 className="font-medium mb-2">Top Selling Products</h4>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center gap-3 p-2 bg-muted rounded">
                      <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_sold} sold • ${product.total_revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RevenueAnalytics;
