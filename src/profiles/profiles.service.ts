import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsSelect, FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../users/entities/user.entity';
import { SuccessResponse } from '../common/types/success-response';
import { AvatarsService } from './avatars.service';

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
        private readonly avatarsService: AvatarsService,
    ) {}

    async findAll(): Promise<Profile[]> {
        const profiles = await this.profilesRepository.find({
            relations: { user: true },
            select: PROFILE_SELECT,
        });

        return profiles.map((profile) =>
            this.avatarsService.resolve(profile, profile.user.email),
        );
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

    /**
     * Replaces the picture of the caller's own profile. Scoped to the owner
     * rather than taking an id, so no check is needed to stop one user
     * overwriting another's avatar — there is no way to name another profile.
     */
    async uploadOwnAvatar(
        userId: User['id'],
        file: Express.Multer.File,
    ): Promise<Profile> {
        const profile = await this.findOwnOrFail(userId);
        const previous = profile.avatar;

        profile.avatar = await this.avatarsService.store(file);

        await this.profilesRepository.update(profile.id, {
            avatar: profile.avatar,
        });

        // Only once the row points at the new file: deleting first would leave
        // the profile showing a broken picture if the write below failed.
        await this.avatarsService.discard(previous);

        return this.avatarsService.resolve(profile, profile.user.email);
    }

    /**
     * Drops the upload, which leaves the profile on its generated Gravatar
     * rather than with no picture at all.
     */
    async removeOwnAvatar(userId: User['id']): Promise<Profile> {
        const profile = await this.findOwnOrFail(userId);
        const previous = profile.avatar;

        profile.avatar = null;

        await this.profilesRepository.update(profile.id, { avatar: null });
        await this.avatarsService.discard(previous);

        return this.avatarsService.resolve(profile, profile.user.email);
    }

    private async findOne(
        where: FindOptionsWhere<Profile>,
    ): Promise<Profile | null> {
        const profile = await this.profilesRepository.findOne({
            where,
            relations: { user: true },
            select: PROFILE_SELECT,
        });

        return profile === null
            ? null
            : this.avatarsService.resolve(profile, profile.user.email);
    }
}
