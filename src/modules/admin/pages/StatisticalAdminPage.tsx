"use client";

import React from "react";
import TotalPost from "@/modules/admin/statistical/components/TotalPost";
import TotalCategoriesPost from "@/modules/admin/statistical/components/TotalCategoriesPost";

const StatisticalAdminPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Thống kê hệ thống</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TotalPost />
        <TotalCategoriesPost />
        {/* Có thể thêm các thống kê khác ở đây */}
      </div>
    </div>
  );
};

export default StatisticalAdminPage;
