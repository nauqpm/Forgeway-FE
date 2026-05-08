"use client";

import { useEffect, useRef, useState } from "react";
import {
  Province,
  District,
  Ward,
  getAllProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
} from "@/common/services/locationService";

import { LocationPickerProps } from "@/common/components/address/types/location";
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
  // State cho dữ liệu từ API
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // State cho dropdown
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // State cho tìm kiếm
  const [provinceSearchTerm, setProvinceSearchTerm] = useState("");
  const [districtSearchTerm, setDistrictSearchTerm] = useState("");
  const [wardSearchTerm, setWardSearchTerm] = useState("");

  // Refs cho ô tìm kiếm để auto focus
  const provinceSearchRef = useRef<HTMLInputElement>(null);
  const districtSearchRef = useRef<HTMLInputElement>(null);
  const wardSearchRef = useRef<HTMLInputElement>(null);

  // Xử lý đóng dropdown khi click ra ngoài
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

  // Toggle dropdown và reset search term
  const toggleDropdown = (dropdown: string) => {
    if (onTouch) {
      onTouch(dropdown as "province" | "district" | "ward");
    }

    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);

      // Reset search terms khi mở dropdown mới
      setProvinceSearchTerm("");
      setDistrictSearchTerm("");
      setWardSearchTerm("");

      // Focus vào ô search khi mở dropdown
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

  // Fetch danh sách tỉnh/thành phố khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoading(true);
      try {
        const data = await getAllProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu tỉnh/thành:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch danh sách quận/huyện khi chọn tỉnh/thành phố
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
            console.error("Lỗi khi lấy dữ liệu phường/xã:", error);
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu quận/huyện:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [value.province]);

  // Fetch danh sách phường/xã khi chọn quận/huyện
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
        console.error("Lỗi khi lấy dữ liệu phường/xã:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, [value.district]);

  // Handlers cho việc chọn địa điểm
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
        {/* Tỉnh/Thành phố */}
        <div className="location-dropdown">
          <Dropdown
            label="Tỉnh/Thành phố"
            value={getLocationName(value.province, provinces, "Chọn Tỉnh/TP")}
            isOpen={openDropdown === "province"}
            hasError={!!errors?.province}
            errorMessage={errors?.province}
            onToggle={() => toggleDropdown("province")}
          >
            <SearchInput
              placeholder="Tìm tỉnh/thành phố..."
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

        {/* Quận/Huyện */}
        <div className="location-dropdown">
          <Dropdown
            label="Quận/Huyện"
            value={getLocationName(
              value.district,
              districts,
              "Chọn Quận/Huyện"
            )}
            isOpen={openDropdown === "district"}
            isDisabled={!value.province && !value.district}
            hasError={!!errors?.district}
            errorMessage={errors?.district}
            onToggle={() => toggleDropdown("district")}
          >
            <SearchInput
              placeholder="Tìm quận/huyện..."
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

        {/* Phường/Xã */}
        <div className="location-dropdown">
          <Dropdown
            label="Phường/Xã"
            value={getLocationName(value.ward, wards, "Chọn Phường/Xã")}
            isOpen={openDropdown === "ward"}
            isDisabled={!value.district && !value.ward}
            hasError={!!errors?.ward}
            errorMessage={errors?.ward}
            onToggle={() => toggleDropdown("ward")}
          >
            <SearchInput
              placeholder="Tìm phường/xã..."
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
