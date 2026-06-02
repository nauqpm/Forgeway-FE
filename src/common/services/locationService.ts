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
 * Get all provinces/cities
 */
export const getAllProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetch(`${BASE_URL}/p/`);
    if (!response.ok) {
      throw new Error('Could not fetch province/city data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching province/city data:', error);
    throw error;
  }
};

/**
 * Get province/city details by code
 * @param provinceCode Province/city code
 */
export const getProvinceByCode = async (provinceCode: string | number): Promise<Province> => {
  try {
    const response = await fetch(`${BASE_URL}/p/${provinceCode}`);
    if (!response.ok) {
      throw new Error(`Could not fetch province/city data with code ${provinceCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching province/city data with code ${provinceCode}:`, error);
    throw error;
  }
};

/**
 * Get districts of a province/city
 * @param provinceCode Province/city code
 */
export const getDistrictsByProvinceCode = async (provinceCode: string | number): Promise<District[]> => {
  try {
    const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Could not fetch district data for province/city with code ${provinceCode}`);
    }
    const data = await response.json();
    return data.districts || [];
  } catch (error) {
    console.error(`Error fetching district data for province/city with code ${provinceCode}:`, error);
    throw error;
  }
};

/**
 * Get district details by code
 * @param districtCode District code
 */
export const getDistrictByCode = async (districtCode: string | number): Promise<District> => {
  try {
    const response = await fetch(`${BASE_URL}/d/${districtCode}`);
    if (!response.ok) {
      throw new Error(`Could not fetch district data with code ${districtCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching district data with code ${districtCode}:`, error);
    throw error;
  }
};

/**
 * Get wards of a district
 * @param districtCode District code
 */
export const getWardsByDistrictCode = async (districtCode: string | number): Promise<Ward[]> => {
  try {
    const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
    if (!response.ok) {
      throw new Error(`Could not fetch ward data for district with code ${districtCode}`);
    }
    const data = await response.json();
    return data.wards || [];
  } catch (error) {
    console.error(`Error fetching ward data for district with code ${districtCode}:`, error);
    throw error;
  }
};

/**
 * Get ward details by code
 * @param wardCode Ward code
 */
export const getWardByCode = async (wardCode: string | number): Promise<Ward> => {
  try {
    const response = await fetch(`${BASE_URL}/w/${wardCode}`);
    if (!response.ok) {
      throw new Error(`Could not fetch ward data with code ${wardCode}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ward data with code ${wardCode}:`, error);
    throw error;
  }
};

/**
 * Get full address from ward, district, and province codes
 * @param wardCode Ward code
 * @param districtCode District code
 * @param provinceCode Province/city code
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
    console.error('Error fetching full address data:', error);
    throw error;
  }
};