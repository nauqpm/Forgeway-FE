"use client";
import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

interface SearchProductsProps {
  onSearch: (searchTerm: string) => void;
  isSearching?: boolean;
  placeholder?: string;
}

const SearchProducts = ({
  onSearch = (term: string) => {},
  isSearching = false,
  placeholder = "Nhập tên sản phẩm cần tìm...",
}: SearchProductsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex rounded-md shadow-sm">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isSearching}
          className="flex-1 block w-full rounded-l-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          title="Tìm kiếm"
          disabled={isSearching}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <FaSearch />
        </button>
      </div>
    </form>
  );
};

export default SearchProducts;
