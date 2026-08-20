// import { IsEAN, IsEmail, IsNotEmpty, IsString, Length } from "class-validator";
// import { ConfirmPassword } from "../decorators/confirm-password.decorator";

export class CreateUserDto {
    username!: string;
    email!: string;
    password!: string;
    confirm!: string;
}
