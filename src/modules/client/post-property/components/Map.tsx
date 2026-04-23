"use client";

import React, { useState } from "react";

interface MapProps {
  center?: { lat: number; lng: number };
  onLocationChange?: (lat: number, lng: number, address: string) => void;
}

const Map: React.FC<MapProps> = ({
  center = { lat: 10.7758439, lng: 106.7017555 }, // Default to Ho Chi Minh City
  onLocationChange,
}) => {
  const [searchAddress, setSearchAddress] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress) return;

    // Encode địa chỉ để sử dụng trong URL
    const encodedAddress = encodeURIComponent(searchAddress);
    const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodedAddress}&zoom=15`;

    // Sử dụng Geocoding API để lấy tọa độ từ địa chỉ
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results && data.results[0]) {
          const { lat, lng } = data.results[0].geometry.location;
          const formattedAddress = data.results[0].formatted_address;
          onLocationChange?.(lat, lng, formattedAddress);
        }
      })
      .catch((error) => console.error("Error geocoding address:", error));
  };

  // Tạo URL cho iframe với tọa độ mặc định
  const defaultMapSrc = `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&center=${center.lat},${center.lng}&zoom=15`;

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          placeholder="Nhập địa chỉ để tìm kiếm"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Map Iframe */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={defaultMapSrc}
        />
      </div>
    </div>
  );
};

export default Map;
