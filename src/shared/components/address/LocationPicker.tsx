"use client";

import { useEffect, useRef, useState } from "react";
import {
  Province,
  District,
  Ward,
  getAllProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
} from "@/shared/services/locationService";

import { LocationPickerProps } from "@/shared/components/address/types/location";
import Dropdown from "./Dropdown";
import SearchInput from "./SearchInput";
import LocationList from "./LocationList";
import { getLocationName } from "./utils/utils";

const LocationPicker = ({
  value,
  onChange,
  errors,
  onTouch,
}: LocationPickerProps) => {
  // State for API data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // State cho dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // State for search
  const [provinceSearchTerm, setProvinceSearchTerm] = useState("");
  const [districtSearchTerm, setDistrictSearchTerm] = useState("");
  const [wardSearchTerm, setWardSearchTerm] = useState("");

  // Refs for search inputs to auto-focus
  const provinceSearchRef = useRef<HTMLInputElement>(null);
  const districtSearchRef = useRef<HTMLInputElement>(null);
  const wardSearchRef = useRef<HTMLInputElement>(null);

  // Handle closing dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!event.target) return;
      const target = event.target as HTMLElement;
      if (!target.closest(".location-dropdown")) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle dropdown and reset search term
  const toggleDropdown = (dropdown: string) => {
    if (onTouch) {
      onTouch(dropdown as "province" | "district" | "ward");
    }

    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);

      // Reset search terms when opening a new dropdown
      setProvinceSearchTerm("");
      setDistrictSearchTerm("");
      setWardSearchTerm("");

      // Focus the search input when opening dropdown
      setTimeout(() => {
        if (dropdown === "province" && provinceSearchRef.current) {
          provinceSearchRef.current.focus();
        } else if (dropdown === "district" && districtSearchRef.current) {
          districtSearchRef.current.focus();
        } else if (dropdown === "ward" && wardSearchRef.current) {
          wardSearchRef.current.focus();
        }
      }, 100);
    }
  };

  // Fetch province list on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      try {
        const data = await getAllProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Error fetching province data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch district list when selecting a province
  useEffect(() => {
    if (!value.province) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      setLoading(true);
      try {
        const data = await getDistrictsByProvinceCode(value.province);
        setDistricts(data);

        if (value.district && !wards.length) {
          try {
            const wardsData = await getWardsByDistrictCode(value.district);
            setWards(wardsData);
          } catch (error) {
            console.error("Error fetching ward data:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching district data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [value.province]);

  // Fetch ward list when selecting a district
  useEffect(() => {
    if (!value.district) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      setLoading(true);
      try {
        const data = await getWardsByDistrictCode(value.district);
        setWards(data);
      } catch (error) {
        console.error("Error fetching ward data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, [value.district]);

  // Handlers for location selection
  const handleProvinceSelect = (code: number) => {
    onChange({
      province: code,
      district: "",
      ward: "",
    });
    setOpenDropdown(null);
  };

  const handleDistrictSelect = (code: number) => {
    onChange({
      ...value,
      district: code,
      ward: "",
    });
    setOpenDropdown(null);
  };

  const handleWardSelect = (code: number) => {
    onChange({
      ...value,
      ward: code,
    });
    setOpenDropdown(null);
  };

  return (
    <div className="space-y-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province/City */}
        <div className="location-dropdown">
          <Dropdown
            label="Province/City"
            value={getLocationName(value.province, provinces, "Select Province/City")}
            isOpen={openDropdown === "province"}
            hasError={!!errors?.province}
            errorMessage={errors?.province}
            onToggle={() => toggleDropdown("province")}
          >
            <SearchInput
              placeholder="Search provinces/cities..."
              value={provinceSearchTerm}
              onChange={setProvinceSearchTerm}
              inputRef={provinceSearchRef as React.RefObject<HTMLInputElement>}
            />
            <LocationList
              items={provinces}
              onSelect={handleProvinceSelect}
              loading={loading}
              searchTerm={provinceSearchTerm}
            />
          </Dropdown>
        </div>

        {/* District */}
        <div className="location-dropdown">
          <Dropdown
            label="District"
            value={getLocationName(
              value.district,
              districts,
              "Select District"
            )}
            isOpen={openDropdown === "district"}
            isDisabled={!value.province && !value.district}
            hasError={!!errors?.district}
            errorMessage={errors?.district}
            onToggle={() => toggleDropdown("district")}
          >
            <SearchInput
              placeholder="Search districts..."
              value={districtSearchTerm}
              onChange={setDistrictSearchTerm}
              inputRef={districtSearchRef as React.RefObject<HTMLInputElement>}
            />
            <LocationList
              items={districts}
              onSelect={handleDistrictSelect}
              loading={loading}
              searchTerm={districtSearchTerm}
            />
          </Dropdown>
        </div>

        {/* Ward */}
        <div className="location-dropdown">
          <Dropdown
            label="Ward"
            value={getLocationName(value.ward, wards, "Select Ward")}
            isOpen={openDropdown === "ward"}
            isDisabled={!value.district && !value.ward}
            hasError={!!errors?.ward}
            errorMessage={errors?.ward}
            onToggle={() => toggleDropdown("ward")}
          >
            <SearchInput
              placeholder="Search wards..."
              value={wardSearchTerm}
              onChange={setWardSearchTerm}
              inputRef={wardSearchRef as React.RefObject<HTMLInputElement>}
            />
            <LocationList
              items={wards}
              onSelect={handleWardSelect}
              loading={loading}
              searchTerm={wardSearchTerm}
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
