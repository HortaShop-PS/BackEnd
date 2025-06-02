import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { AddressResponseDto } from './dto/address-response.dto';
import { OpenStreetMapService } from './services/openstreetmap.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly osmService: OpenStreetMapService,
  ) {}

  async create(createAddressDto: CreateAddressDto, userId: number): Promise<AddressResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    let coordinates: { lat: number; lng: number } | null = null;
    let formattedAddress: string | null = null;

    if (!createAddressDto.latitude || !createAddressDto.longitude) {
      try {
        const fullAddress = `${createAddressDto.street}, ${createAddressDto.number}, ${createAddressDto.city}, ${createAddressDto.state}, ${createAddressDto.zipCode}`;
        const geocodeResult = await this.osmService.geocodeAddress(fullAddress);

        if (geocodeResult.isValid) {
          coordinates = geocodeResult.coordinates;
          formattedAddress = geocodeResult.formattedAddress;
        }
      } catch (error) {
        console.warn('Falha ao obter coordenadas:', error.message);
      }
    } else {
      coordinates = {
        lat: createAddressDto.latitude,
        lng: createAddressDto.longitude,
      };
    }

    const address = this.addressRepository.create({
      ...createAddressDto,
      user,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
      formattedAddress: formattedAddress || null,
    } as Partial<Address>); // ✅ CORREÇÃO AQUI

    const savedAddress = await this.addressRepository.save(address);
    return this.mapToResponseDto(savedAddress);
  }

  async findByUser(userId: number): Promise<AddressResponseDto[]> {
    const addresses = await this.addressRepository.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
      relations: ['user'],
    });
    return addresses.map(address => this.mapToResponseDto(address));
  }

  async findOne(id: number): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }
    return this.mapToResponseDto(address);
  }

  async update(id: number, updateAddressDto: UpdateAddressDto): Promise<AddressResponseDto> {
    const address = await this.addressRepository.findOne({ where: { id }, relations: ['user'] });
    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }

    Object.assign(address, updateAddressDto);
    const updatedAddress = await this.addressRepository.save(address);
    return this.mapToResponseDto(updatedAddress);
  }

  async remove(id: number): Promise<void> {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado`);
    }
    await this.addressRepository.remove(address);
  }

  async validateAddress(address: string) {
    return this.osmService.geocodeAddress(address);
  }

  async autocomplete(input: string) {
    return this.osmService.searchAddresses(input);
  }

  private mapToResponseDto(address: Address): AddressResponseDto {
    return {
      id: address.id,
      userId: address.user?.id, // Relacionamento referenciado corretamente
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      latitude: address.latitude ? Number(address.latitude) : undefined,
      longitude: address.longitude ? Number(address.longitude) : undefined,
      formattedAddress: address.formattedAddress,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}