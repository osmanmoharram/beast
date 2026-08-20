import { Type } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

/**
 * Returned by both register and login, so a client handles one shape.
 */
export class AuthResponseDto {
    // @Type is what tells class-transformer to apply User's @Exclude rules to
    // this nested value, so the password hash never reaches the client.
    @Type(() => User)
    user!: User;

    accessToken!: string;

    constructor(user: User, accessToken: string) {
        this.user = user;
        this.accessToken = accessToken;
    }
}
