"use client";
import React from "react";
import { Category } from "../models/post.model";
import { GoChevronDown, GoChevronRight } from "react-icons/go";

interface PostCategoryTreeProps {
  categories: Category[];
  selectedCategoryNames?: string[]; // Make optional with default value
  handleCategoryChange: (category: Category, checked: boolean) => void;
}

// 🧹 Hàm lọc trùng theo _id
const filterUniqueById = (list: Category[]) => {
  const seen = new Set<string>();
  return list.filter((cat) => {
    if (seen.has(cat._id)) return false;
    seen.add(cat._id);
    return true;
  });
};

const PostCategoryTree: React.FC<PostCategoryTreeProps> = ({
  categories,
  selectedCategoryNames = [], // Provide default empty array
  handleCategoryChange,
}) => {
  // Hàm đệ quy hiển thị node
  const renderNode = (category: Category): React.ReactNode => {
    // 🧩 Tìm các children theo parent ID
    const rawChildren = categories.filter(
      (cat) => cat.parent === category._id && cat.level === category.level + 1
    );
    const children = filterUniqueById(rawChildren); // 🔍 Lọc trùng

    const hasChildren = children.length > 0;
    const isSelected = selectedCategoryNames?.includes(category.name) || false; // Add null check

    const arrowIcon = hasChildren ? (
      isSelected ? (
        <GoChevronDown className="text-gray-600" />
      ) : (
        <GoChevronRight className="text-gray-600" />
      )
    ) : null;

    return (
      <div key={category._id} className="mb-2">
        {/* Hàng chứa checkbox, tên danh mục và icon (nếu có) */}
        <div className="flex items-center gap-1">
          <label
            htmlFor={`cat-${category._id}`}
            className="flex items-center gap-1 cursor-pointer"
          >
            <input
              type="checkbox"
              id={`cat-${category._id}`}
              checked={isSelected}
              onChange={(e) =>
                handleCategoryChange(category, e.target.checked)
              }
              className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-gray-700">{category.name}</span>
          </label>
          {hasChildren && arrowIcon}
        </div>

        {/* Render danh mục con nếu node được mở */}
        {hasChildren && isSelected && (
          <div className="ml-6 mt-1">
            {children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  // 📂 Lọc danh mục root (level = 0) và loại trùng
  const topCategories = filterUniqueById(
    categories.filter((cat) => cat.level === 0)
  );

  return <div>{topCategories.map((cat) => renderNode(cat))}</div>;
};

export default PostCategoryTree;
