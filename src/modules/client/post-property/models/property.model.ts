export enum PropertyStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RENTED = 'rented',
  PENDING = 'pending',
}

export enum HouseDirection {
  BAC = 'Bắc',
  NAM = 'Nam',
  DONG = 'Đông',
  TAY = 'Tây',
  DONG_BAC = 'Đông Bắc',
  TAY_BAC = 'Tây Bắc',
  DONG_NAM = 'Đông Nam',
  TAY_NAM = 'Tây Nam'
}

export enum PropertyType {
  APARTMENT = 'Căn hộ chung cư',
  HOUSE = 'Nhà riêng',
  VILLA = 'Biệt thự',
  TOWNHOUSE = 'Nhà phố',
  LAND = 'Đất nền',
  COMMERCIAL = 'Bất động sản thương mại',
  OFFICE = 'Văn phòng',
  WAREHOUSE = 'Kho, xưởng',
  OTHER = 'Loại khác'
}

export enum LegalStatus {
  PINK_BOOK = 'Sổ hồng',
  RED_BOOK = 'Sổ đỏ',
  WAITING_FOR_BOOK = 'Đang chờ sổ',
  SALE_CONTRACT = 'Hợp đồng mua bán',
  DEPOSIT_CONTRACT = 'Hợp đồng đặt cọc',
  OTHER = 'Giấy tờ khác'
}

export enum PostApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PostVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  DRAFT = 'draft',
}

export interface IPropertyPost {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  priceUnit?: string;
  area: number;
  address?: string;
  author: string | { id: string; email: string; name: string; phone: string; };
  thumbnailUrl?: string;
  albumUrls?: string[];
  propertyStatus: PropertyStatus;
  visibility: PostVisibility;
  approvalStatus?: PostApprovalStatus;
  rejectionReason?: string;
  ward?: string;
  district?: string;
  city?: string;
  location?: {
    type: {
      type: string;
      coordinates: number[];
    };
  };
  iframe?: string;
  amenities?: string[];
  direction?: HouseDirection | "" | undefined;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  numberOfFloors?: number;
  yearBuilt?: number;
  propertyType?: PropertyType;
  legalStatus?: LegalStatus;
  projectName?: string;
  contactPhone?: string;
  contactName?: string;
  views?: number;
  isHighlight?: boolean;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  frontageWidth?: number; // Mặt tiền
  roadWidth?: number; // Đường vào
  interior?: string; // Nội thất
  orientation?: string; // Hướng ban công (nếu khác với hướng nhà)
  certificateNumber?: string; // Số giấy chứng nhận
  certificateDate?: string; // Ngày cấp giấy chứng nhận
  certificateAuthority?: string; // Cơ quan cấp
}

export interface IPropertyPostCreate {
  slug: string;
  title: string;
  price: number;
  area: number;
  description: string;
  propertyStatus: PropertyStatus;
  visibility: PostVisibility;
  thumbnailUrl: string;
  albumUrls: string[];
  direction: HouseDirection | "" | string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  amenities: string[];
  address: string;
  ward: string;
  district: string;
  city: string;
  iframe?: string;
  location?: {
    type: {
      type: string;
      coordinates: number[];
    };
  };
  numberOfFloors?: number;
  yearBuilt?: number;
  frontageWidth?: number;
  roadWidth?: number;
}

export type IPropertyPostUpdate = Partial<IPropertyPostCreate>;