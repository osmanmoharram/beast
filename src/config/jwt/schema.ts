import { Type } from 'class-transformer';
import { IsBase64, IsNotEmpty, IsString } from 'class-validator';

export class JwtVariables {
    @Type(() => String)
    @IsNotEmpty()
    @IsBase64()
    JWT_SECRET_KEY: string;

    @IsString()
    @IsNotEmpty()
    JWT_EXPIRES_IN: string;
}
