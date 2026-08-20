import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    store(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    findOne(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.usersService.remove(id);
    }
}
