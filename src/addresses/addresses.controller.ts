import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './dto/create-address.dto';
import { ValidateAddressDto } from './dto/validate-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    return this.addressesService.create(createAddressDto, req.user.id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  findByUser(@Param('userId') userId: string) {
    return this.addressesService.findByUser(+userId);
  }

  @Get('autocomplete')
  autocomplete(@Query('input') input: string) {
    return this.addressesService.autocomplete(input);
  }

  @Post('validate')
  validateAddress(@Body() validateAddressDto: ValidateAddressDto) {
    return this.addressesService.validateAddress(validateAddressDto.address);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(+id, updateAddressDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.addressesService.remove(+id);
  }
}