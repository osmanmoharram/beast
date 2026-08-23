import { PublicProfileDto } from './public-profile.dto';
import { Profile } from '../entities/profile.entity';

/**
 * The owner's view of their own profile: everything the public sees, plus the
 * fields Profile marks @Exclude(). Naming the private fields on a separate
 * class is what re-admits them — @Exclude() on the entity hides birthDate from
 * everyone, including its owner, and class-transformer groups are easy to get
 * subtly wrong in the direction that leaks.
 */
export class OwnProfileDto extends PublicProfileDto {
    birthDate: string | null;
    updatedAt: Date;

    constructor(profile: Profile) {
        super(profile);
        this.birthDate = profile.birthDate;
        this.updatedAt = profile.updatedAt;
    }
}
