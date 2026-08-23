import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/entities/user.entity';
import { SuccessResponse } from '../common/types/success-response';

const PROFILE_SELECT: FindOptionsSelect<Profile> = {
    id: true,
    displayName: true,
    avatar: true,
    birthDate: true,
    user: { id: true, username: true, email: true },
    createdAt: true,
    updatedAt: true,
};

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private readonly profilesRepository: Repository<Profile>,
    ) {}

    async findAll(): Promise<Profile[]> {
        return await this.profilesRepository.find({
            relations: { user: true },
            select: PROFILE_SELECT,
        });
    }

    async findOneOrFail(id: Profile['id']): Promise<Profile> {
        const profile = await this.findOne({ id });

        if (profile === null) {
            throw new NotFoundException(`Profile ${id} not found`);
        }

        return profile;
    }

    /**
     * Looks up by owner rather than profile id, which is what lets /profiles/me
     * work from the JWT alone — a client never learns its own profile id.
     */
    async findOwnOrFail(userId: User['id']): Promise<Profile> {
        const profile = await this.findOne({ user: { id: userId } });

        if (profile === null) {
            throw new NotFoundException(`Profile not found`);
        }

        return profile;
    }

    async update(
        id: Profile['id'],
        updateProfileDto: UpdateProfileDto,
    ): Promise<SuccessResponse> {
        const { affected } = await this.profilesRepository.update(
            id,
            updateProfileDto,
        );

        if (!affected) {
            throw new NotFoundException(`Profile not found`);
        }

        return {
            code: HttpStatus.OK,
            message: `Profile updated successfully`,
        };
    }

    private async findOne(
        where: FindOptionsWhere<Profile>,
    ): Promise<Profile | null> {
        return await this.profilesRepository.findOne({
            where,
            relations: { user: true },
            select: PROFILE_SELECT,
        });
    }
}
