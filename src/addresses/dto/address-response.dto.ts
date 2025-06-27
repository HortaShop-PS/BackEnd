export class AddressResponseDto {
  id: number;
  userId: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}