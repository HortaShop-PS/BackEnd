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
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAddressDto } from './dto/create-address.dto';

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
import { ValidateAddressDto } from './dto/validate-address.dto';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() createAddressDto: CreateAddressDto, @Request() req) {
    return this.addressesService.create(createAddressDto, req.user.id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.addressesService.findByUser(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    return this.addressesService.update(+id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addressesService.remove(+id);
  }

  @Post('validate')
  validateAddress(@Body() validateAddressDto: ValidateAddressDto) {
    return this.addressesService.validateAddress(validateAddressDto.address);
  }

  @Get('autocomplete')
  autocomplete(@Query('input') input: string) {
    return this.addressesService.autocomplete(input);
  }
}