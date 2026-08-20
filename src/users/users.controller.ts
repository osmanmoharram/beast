import { CreateUserDto } from './dto/create-user.dto';
import { RegisteredUser, UsersService } from './users.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async store(@Body() createUserDto: CreateUserDto): Promise<RegisteredUser> {
        return await this.usersService.create(createUserDto);
    }
}
