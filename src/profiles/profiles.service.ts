import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private readonly profilesRepository: Repository<Profile>,
    ) {}

    /**
     * The owner's own profile. Registration creates one for every account, so
     * a miss here means the row was deleted out from under a live token
     * rather than that the user has not filled anything in yet.
     */
    async findByUserId(userId: User['id']): Promise<Profile> {
        const profile = await this.profilesRepository.findOne({
            where: { user: { id: userId } },
            relations: { user: true },
        });

        if (profile === null) {
            throw new NotFoundException(`Profile for user ${userId} not found`);
        }

        return profile;
    }

    /** The public lookup: /profiles/:username is how one user reaches another. */
    async findByUsername(username: User['username']): Promise<Profile> {
        const profile = await this.profilesRepository.findOne({
            where: { user: { username } },
            relations: { user: true },
        });

        if (profile === null) {
            throw new NotFoundException(`Profile for ${username} not found`);
        }

        return profile;
    }

    async update(
        userId: User['id'],
        updateProfileDto: UpdateProfileDto,
    ): Promise<Profile> {
        const profile = await this.findByUserId(userId);

        // Only the keys actually sent are copied. class-transformer leaves
        // unset optional fields as `undefined` own-properties, and assigning
        // those wholesale would be indistinguishable from an explicit null —
        // which is how the API clears a field.
        const updates = Object.entries(updateProfileDto) as [
            keyof UpdateProfileDto,
            string | null | undefined,
        ][];

        for (const [key, value] of updates) {
            if (value !== undefined) {
                Object.assign(profile, { [key]: value });
            }
        }

        return this.profilesRepository.save(profile);
    }
}
