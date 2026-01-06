
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductManagementStatsProps {
  totalProducts: number;
}

const ProductManagementStats = ({ totalProducts }: ProductManagementStatsProps) => {
  return (
    <Card className="border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-900 to-black text-white">
        <CardTitle className="text-xl">Product Management - Total: {totalProducts}</CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ProductManagementStats;
