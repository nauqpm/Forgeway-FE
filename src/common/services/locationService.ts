export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number;
}

export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  district_code: number;
}

const BASE_URL = 'https://provinces.open-api.vn/api';

/**
 * Lấy danh sách tất cả các tỉnh/thành phố
 */
export const getAllProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${BASE_URL}/p/`);
    if (!response.ok) {
      throw new Error('Không thể lấy dữ liệu tỉnh/thành phố');
    }
    return await response.json();
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu tỉnh/thành phố:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một tỉnh/thành phố theo mã code
 * @param provinceCode Mã code của tỉnh/thành phố
 */
export const getProvinceByCode = async (provinceCode: string | number): Promise<Province> => {
  try {
    const response = await fetch(`${BASE_URL}/p/${provinceCode}`);
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu tỉnh/thành phố với mã ${provinceCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu tỉnh/thành phố với mã ${provinceCode}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách các quận/huyện của một tỉnh/thành phố
 * @param provinceCode Mã code của tỉnh/thành phố
 */
export const getDistrictsByProvinceCode = async (provinceCode: string | number): Promise<District[]> => {
  try {
    const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu quận/huyện cho tỉnh/thành phố với mã ${provinceCode}`);
    }
    const data = await response.json();
    return data.districts || [];
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu quận/huyện cho tỉnh/thành phố với mã ${provinceCode}:`, error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một quận/huyện theo mã code
 * @param districtCode Mã code của quận/huyện
 */
export const getDistrictByCode = async (districtCode: string | number): Promise<District> => {
  try {
    const response = await fetch(`${BASE_URL}/d/${districtCode}`);
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu quận/huyện với mã ${districtCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu quận/huyện với mã ${districtCode}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách các phường/xã của một quận/huyện
 * @param districtCode Mã code của quận/huyện
 */
export const getWardsByDistrictCode = async (districtCode: string | number): Promise<Ward[]> => {
  try {
    const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu phường/xã cho quận/huyện với mã ${districtCode}`);
    }
    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu phường/xã cho quận/huyện với mã ${districtCode}:`, error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của một phường/xã theo mã code
 * @param wardCode Mã code của phường/xã
 */
export const getWardByCode = async (wardCode: string | number): Promise<Ward> => {
  try {
    const response = await fetch(`${BASE_URL}/w/${wardCode}`);
    if (!response.ok) {
      throw new Error(`Không thể lấy dữ liệu phường/xã với mã ${wardCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu phường/xã với mã ${wardCode}:`, error);
    throw error;
  }
};

/**
 * Lấy chuỗi địa chỉ đầy đủ từ mã phường, quận, tỉnh
 * @param wardCode Mã phường/xã
 * @param districtCode Mã quận/huyện
 * @param provinceCode Mã tỉnh/thành phố
 */
export const getFullAddress = async (
  wardCode: string | number,
  districtCode: string | number,
  provinceCode: string | number
): Promise<string> => {
  try {
    const [ward, district, province] = await Promise.all([
      getWardByCode(wardCode),
      getDistrictByCode(districtCode),
      getProvinceByCode(provinceCode)
    ]);

    return `${ward.name}, ${district.name}, ${province.name}`;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu địa chỉ đầy đủ:', error);
    throw error;
  }
};