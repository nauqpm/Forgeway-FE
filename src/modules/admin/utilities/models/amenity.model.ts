export interface IAmenity {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateAmenityDto {
  name: string;
  isActive?: boolean;
}

export interface IUpdateAmenityDto {
  name?: string;
  isActive?: boolean;
} 