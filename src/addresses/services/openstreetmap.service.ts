import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface OSMGeocodeResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

@Injectable()
export class OpenStreetMapService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  async geocodeAddress(address: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
        headers: {
          'User-Agent': 'HortaShop/1.0',
        },
      });

      const data: OSMGeocodeResponse[] = response.data;

      if (data && data.length > 0) {
        const result = data[0];
        return {
          isValid: true,
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
          formattedAddress: result.display_name,
        };
      }

      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const response = await axios.get(`${this.baseUrl}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'HortaShop/1.0',
        },
      });

      const data: OSMGeocodeResponse = response.data;

      if (data) {
        return {
          isValid: true,
          formattedAddress: data.display_name,
          address: data.address,
        };
      }

      return {
        isValid: false,
        formattedAddress: null,
        address: null,
      };
    } catch (error) {
      console.error('Erro ao fazer geocodificação reversa:', error);
      return {
        isValid: false,
        formattedAddress: null,
        address: null,
      };
    }
  }

  async searchAddresses(query: string) {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        },
        headers: {
          'User-Agent': 'HortaShop/1.0',
        },
      });

      const data: OSMGeocodeResponse[] = response.data;

      return data.map(item => ({
        display_name: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
        address: item.address,
      }));
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return [];
    }
  }
}