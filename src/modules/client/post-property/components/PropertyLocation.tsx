"use client";

import React, { useState, useEffect } from "react";
import LocationPicker from "@/common/components/address/LocationPicker";
import { LocationValue } from "@/common/components/address/types/location";
import { getLocationName } from "@/common/components/address/utils/utils";
import { 
  getAllProvinces, 
  getDistrictsByProvinceCode, 
  getWardsByDistrictCode 
} from "@/common/services/locationService";

interface PropertyLocationProps {
  initialValues?: {
    address?: string;
    ward?: string;
    district?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    iframe?: string;
    location?: {
      type: {
        type: string;
        coordinates: number[];
      };
    };
  };
  onChange?: (values: {
    address: string;
    ward: string;
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    iframe: string;
  }) => void;
}

const PropertyLocation: React.FC<PropertyLocationProps> = ({
  initialValues,
  onChange,
}) => {
  const [location, setLocation] = useState({
    address: initialValues?.address || "",
    ward: initialValues?.ward || "",
    district: initialValues?.district || "",
    city: initialValues?.city || "",
    latitude: initialValues?.location?.type?.coordinates?.[1] || initialValues?.latitude || 10.7758439,
    longitude: initialValues?.location?.type?.coordinates?.[0] || initialValues?.longitude || 106.7017555,
    iframe: initialValues?.iframe || "",
  });

  const [locationCodes, setLocationCodes] = useState<LocationValue>({
    province: "",
    district: "",
    ward: "",
  });

  const [errors, setErrors] = useState<{
    province?: string;
    district?: string;
    ward?: string;
  }>({});

  // Load initial location codes if initialValues are provided
  useEffect(() => {
    const loadInitialLocationCodes = async () => {
      if (initialValues?.city) {
        try {
          // Load provinces
          const provinces = await getAllProvinces();
          const matchedProvince = provinces.find(p => 
            p.name.toLowerCase().includes(initialValues.city?.toLowerCase() || "")
          );
          
          if (matchedProvince) {
            const provinceCode = matchedProvince.code;
            setLocationCodes(prev => ({ ...prev, province: provinceCode }));
            
            // Load districts
            if (initialValues.district && provinceCode) {
              const districts = await getDistrictsByProvinceCode(provinceCode);
              const matchedDistrict = districts.find(d => 
                d.name.toLowerCase().includes(initialValues.district?.toLowerCase() || "")
              );
              
              if (matchedDistrict) {
                const districtCode = matchedDistrict.code;
                setLocationCodes(prev => ({ ...prev, district: districtCode }));
                
                // Load wards
                if (initialValues.ward && districtCode) {
                  const wards = await getWardsByDistrictCode(districtCode);
                  const matchedWard = wards.find(w => 
                    w.name.toLowerCase().includes(initialValues.ward?.toLowerCase() || "")
                  );
                  
                  if (matchedWard) {
                    setLocationCodes(prev => ({ ...prev, ward: matchedWard.code }));
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error loading initial location data:", error);
        }
      }
    };

    loadInitialLocationCodes();
  }, [initialValues]);

  // Update state when initialValues change
  useEffect(() => {
    if (initialValues) {
      setLocation(prev => ({
        ...prev,
        address: initialValues.address || prev.address,
        ward: initialValues.ward || prev.ward,
        district: initialValues.district || prev.district,
        city: initialValues.city || prev.city,
        latitude: initialValues.location?.type?.coordinates?.[1] || initialValues.latitude || prev.latitude,
        longitude: initialValues.location?.type?.coordinates?.[0] || initialValues.longitude || prev.longitude,
        iframe: initialValues.iframe || prev.iframe,
      }));
    }
  }, [initialValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newLocation = {
      ...location,
      [name]: value,
    };
    setLocation(newLocation);
    if (onChange) {
      onChange(newLocation);
    }
  };

  const handleLocationChange = async (value: LocationValue) => {
    setLocationCodes(value);
    
    try {
      let newCity = "";
      let newDistrict = "";
      let newWard = "";
      
      // Get province name
      if (value.province) {
        const provinces = await getAllProvinces();
        const province = provinces.find(p => p.code === value.province);
        if (province) {
          newCity = province.name;
        }
      }
      
      // Get district name
      if (value.district) {
        const districts = await getDistrictsByProvinceCode(value.province);
        const district = districts.find(d => d.code === value.district);
        if (district) {
          newDistrict = district.name;
        }
      }
      
      // Get ward name
      if (value.ward) {
        const wards = await getWardsByDistrictCode(value.district);
        const ward = wards.find(w => w.code === value.ward);
        if (ward) {
          newWard = ward.name;
        }
      }
      
      // Update location with names
      const newLocation = {
        ...location,
        city: newCity,
        district: newDistrict,
        ward: newWard,
      };
      
      setLocation(newLocation);
      if (onChange) {
        onChange(newLocation);
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleTouch = (field: "province" | "district" | "ward") => {
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn địa điểm <span className="text-red-500">*</span>
        </label>
        <LocationPicker 
          value={locationCodes}
          onChange={handleLocationChange}
          errors={errors}
          onTouch={handleTouch}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Địa chỉ chi tiết <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={location.address}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Số nhà, tên đường"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vị trí trên bản đồ
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Nhập iframe địa chỉ từ Google Maps
        </p>
        <div className="rounded-lg overflow-hidden border border-gray-300">
          <input
            type="text"
            name="iframe"
            className="w-full h-full px-4 py-2"
            placeholder="Nhập iframe địa chỉ"
            value={location.iframe}
            onChange={handleInputChange}
          />
        </div>
        {location.iframe && (
          <div className="mt-4 rounded-lg overflow-hidden border border-gray-300"
            dangerouslySetInnerHTML={{ __html: location.iframe }}
          />
        )}
      </div>

      {/* Hidden inputs for coordinates */}
      <input type="hidden" name="latitude" value={location.latitude} />
      <input type="hidden" name="longitude" value={location.longitude} />
    </div>
  );
};

export default PropertyLocation;
