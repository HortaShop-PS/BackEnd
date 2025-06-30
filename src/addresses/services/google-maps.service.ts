import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleMapsGeocodeResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

// Nova interface para a Places API (New)
interface GooglePlacesNewAutocompleteResponse {
  suggestions: Array<{
    placePrediction: {
      place: string;
      placeId: string;
      text: {
        text: string;
        matches: Array<{
          endOffset: number;
        }>;
      };
      structuredFormat: {
        mainText: {
          text: string;
          matches: Array<{
            endOffset: number;
          }>;
        };
        secondaryText: {
          text: string;
        };
      };
      types: string[];
    };
  }>;
}

interface GooglePlaceDetailsResponse {
  result: {
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  };
  status: string;
}

@Injectable()
export class GoogleMapsService {
  private readonly apiKey: string | null;
  private readonly geocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly placesBaseUrl = 'https://maps.googleapis.com/maps/api/place';
  private readonly placesNewBaseUrl = 'https://places.googleapis.com/v1/places'; // Nova API

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    this.apiKey = key || null;
    
    console.log('🔑 Google Maps API Key status:', this.apiKey ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    if (this.apiKey) {
      console.log('🔑 API Key (primeiros 10 chars):', this.apiKey.substring(0, 10) + '...');
    }
    
    if (!this.apiKey) {
      console.warn('⚠️  GOOGLE_MAPS_API_KEY não configurada. Serviços do Google Maps não funcionarão.');
    }
  }

  async geocodeAddress(address: string) {
    console.log('🌍 Geocoding address:', address);
    
    if (!this.apiKey) {
      console.log('❌ API Key não disponível');
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    }

    try {
      const url = `${this.geocodeBaseUrl}?address=${encodeURIComponent(address)}&key=${this.apiKey}&region=br&language=pt-BR`;
      console.log('🔗 Fazendo requisição para:', url.replace(this.apiKey, 'API_KEY_HIDDEN'));
      
      const response = await axios.get(this.geocodeBaseUrl, {
        params: {
          address,
          key: this.apiKey,
          region: 'br',
          language: 'pt-BR'
        },
        timeout: 10000,
      });

      console.log('📡 Response status:', response.status);
      console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

      const data = response.data as GoogleMapsGeocodeResponse;

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('✅ Geocoding bem-sucedido');
        return {
          isValid: true,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
          formattedAddress: result.formatted_address,
        };
      }

      console.warn(`⚠️  Google Maps Geocoding falhou: ${data.status}`);
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    } catch (error: any) {
      console.error('❌ Erro ao geocodificar endereço com Google Maps:', error?.message || error);
      if (error.response) {
        console.error('📡 Error response data:', error.response.data);
        console.error('📡 Error response status:', error.response.status);
      }
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    }
  }

  async reverseGeocode(lat: number, lng: number) {
    console.log('🌍 Reverse geocoding:', lat, lng);
    
    if (!this.apiKey) {
      console.log('❌ API Key não disponível para reverse geocoding');
      return {
        isValid: false,
        formattedAddress: null,
        address: null,
      };
    }

    try {
      const response = await axios.get(this.geocodeBaseUrl, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
          language: 'pt-BR'
        },
        timeout: 10000,
      });

      const data = response.data as GoogleMapsGeocodeResponse;

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        
        const addressComponents = result.address_components;
        const address = {
          house_number: this.getAddressComponent(addressComponents, 'street_number'),
          road: this.getAddressComponent(addressComponents, 'route'),
          neighbourhood: this.getAddressComponent(addressComponents, 'sublocality_level_1') || 
                        this.getAddressComponent(addressComponents, 'neighborhood'),
          city: this.getAddressComponent(addressComponents, 'administrative_area_level_2') ||
                this.getAddressComponent(addressComponents, 'locality'),
          state: this.getAddressComponent(addressComponents, 'administrative_area_level_1'),
          postcode: this.getAddressComponent(addressComponents, 'postal_code'),
          country: this.getAddressComponent(addressComponents, 'country'),
        };

        return {
          isValid: true,
          formattedAddress: result.formatted_address,
          address,
        };
      }

      return {
        isValid: false,
        formattedAddress: null,
        address: null,
      };
    } catch (error: any) {
      console.error('❌ Erro ao fazer geocodificação reversa com Google Maps:', error?.message || error);
      return {
        isValid: false,
        formattedAddress: null,
        address: null,
      };
    }
  }

  async autocompleteAddress(input: string) {
    console.log('🔍 Autocomplete para input:', input);
    console.log('🔍 Input length:', input?.length);
    console.log('🔍 API Key disponível:', !!this.apiKey);
    
    if (!this.apiKey) {
      console.log('❌ API Key não disponível para autocomplete');
      return [];
    }
    
    if (!input || input.trim().length < 3) {
      console.log('❌ Input muito curto ou vazio');
      return [];
    }

    try {
      // Tentativa 1: Nova Places API
      console.log('🆕 Tentando com a Nova Places API...');
      const newApiResult = await this.autocompleteWithNewAPI(input);
      if (newApiResult.length > 0) {
        return newApiResult;
      }

      // Tentativa 2: API de Geocoding como fallback
      console.log('🔄 Fallback para Geocoding API...');
      return await this.autocompleteWithGeocoding(input);

    } catch (error: any) {
      console.error('❌ Erro ao buscar sugestões de endereços:', error?.message || error);
      return [];
    }
  }

  private async autocompleteWithNewAPI(input: string) {
    try {
      const url = `${this.placesNewBaseUrl}:autocomplete`;
      
      console.log('🔗 Fazendo requisição para Nova Places API:', url);
      
      const requestBody = {
        input: input.trim(),
        regionCode: 'BR',
        languageCode: 'pt-BR',
        // A linha 'includedPrimaryTypes' foi removida para buscar todos os tipos
      };

      console.log('📋 Request body:', requestBody);

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
        timeout: 8000,
      });

      console.log('📡 Nova API response status:', response.status);
      console.log('📦 Nova API response data:', JSON.stringify(response.data, null, 2));

      const data = response.data as GooglePlacesNewAutocompleteResponse;

      if (data.suggestions && data.suggestions.length > 0) {
        console.log('✅ Nova API bem-sucedida, encontradas', data.suggestions.length, 'sugestões');
        return data.suggestions.map(suggestion => ({
          display_name: suggestion.placePrediction.text.text,
          place_id: suggestion.placePrediction.placeId,
          main_text: suggestion.placePrediction.structuredFormat.mainText.text,
          secondary_text: suggestion.placePrediction.structuredFormat.secondaryText.text,
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erro na Nova Places API:', error?.message || error);
      if (error.response) {
        console.error('📡 Nova API Error response data:', error.response.data);
        console.error('📡 Nova API Error response status:', error.response.status);
      }
      return [];
    }
  }

  private async autocompleteWithGeocoding(input: string) {
    try {
      console.log('🔗 Usando Geocoding API como fallback...');
      
      const response = await axios.get(this.geocodeBaseUrl, {
        params: {
          address: input.trim(),
          key: this.apiKey,
          region: 'br',
          language: 'pt-BR',
          components: 'country:BR'
        },
        timeout: 8000,
      });

      console.log('📡 Geocoding fallback response status:', response.status);
      console.log('📦 Geocoding fallback response data:', JSON.stringify(response.data, null, 2));

      const data = response.data as GoogleMapsGeocodeResponse;

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        console.log('✅ Geocoding fallback bem-sucedido, encontrados', data.results.length, 'resultados');
        return data.results.slice(0, 5).map(result => ({
          display_name: result.formatted_address,
          place_id: result.place_id,
          main_text: this.extractMainText(result.formatted_address),
          secondary_text: this.extractSecondaryText(result.formatted_address),
        }));
      }

      return [];
    } catch (error: any) {
      console.error('❌ Erro no fallback de Geocoding:', error?.message || error);
      return [];
    }
  }

  private extractMainText(formattedAddress: string): string {
    const parts = formattedAddress.split(',');
    return parts[0]?.trim() || formattedAddress;
  }

  private extractSecondaryText(formattedAddress: string): string {
    const parts = formattedAddress.split(',');
    return parts.slice(1).join(',').trim() || '';
  }

  async getPlaceDetails(placeId: string) {
    if (!this.apiKey || !placeId) {
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    }

    try {
      const response = await axios.get(`${this.placesBaseUrl}/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: 'formatted_address,geometry,address_components',
          language: 'pt-BR'
        },
        timeout: 10000,
      });

      const data = response.data as GooglePlaceDetailsResponse;

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          isValid: true,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
          formattedAddress: result.formatted_address,
        };
      }

      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    } catch (error: any) {
      console.error('❌ Erro ao obter detalhes do local com Google Maps:', error?.message || error);
      return {
        isValid: false,
        coordinates: null,
        formattedAddress: null,
      };
    }
  }

  private getAddressComponent(
    components: Array<{ long_name: string; short_name: string; types: string[] }>, 
    type: string
  ): string | null {
    const component = components.find(comp => comp.types.includes(type));
    return component ? component.long_name : null;
  }
}