import { Province, District, Ward } from "@/common/services/locationService";

export interface LocationValue {
  province: string | number;
  district: string | number;
  ward: string | number;
}

export interface LocationErrors {
  province?: string;
  district?: string;
  ward?: string;
}

export interface LocationPickerProps {
  value: LocationValue;
  onChange: (location: LocationValue) => void;
  errors?: LocationErrors;
  onTouch?: (field: "province" | "district" | "ward") => void;
  onStreetInfo?: (streetInfo: { street: string; houseNumber: string }) => void;
}

export interface DropdownProps {
  label: string;
  value: string;
  isOpen: boolean;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onToggle: () => void;
  children: React.ReactNode;
}

export interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export interface LocationItemProps {
  code: number;
  name: string;
  onClick: () => void;
}

export interface LocationListProps {
  items: Array<Province | District | Ward>;
  onSelect: (code: number, name: string) => void;
  loading?: boolean;
  searchTerm: string;
}