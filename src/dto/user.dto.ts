import { IsString, IsEmail, IsOptional, MinLength } from "class-validator"

export class CreateUserDto {
    @IsString()
    name: string

    @IsEmail()
    email: string

    @IsOptional()
    @IsString()
    phone?: string

    @IsString()
    @MinLength(6)
    password: string
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    phone?: string
}

export class UpdatePasswordDto {
    @IsString()
    currentPassword: string

    @IsString()
    @MinLength(6)
    newPassword: string
}

export class UserResponseDto {
    id: number
    name: string
    email: string
    phone?: string
    createdAt: Date
    updatedAt: Date
}