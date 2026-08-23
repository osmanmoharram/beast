import { Profile } from '../entities/profile.entity';

/**
 * What one user is allowed to see of another.
 *
 * Built by hand rather than returning the Profile entity: the entity is loaded
 * with its `user` relation attached, and User does not @Exclude its email, so
 * serializing it would hand every caller the owner's address.
 */
export class PublicProfileDto {
    id: number;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    location: string | null;
    website: string | null;
    createdAt: Date;

    constructor(profile: Profile) {
        this.id = profile.id;
        this.username = profile.user.username;
        this.displayName = profile.displayName;
        this.bio = profile.bio;
        this.avatarUrl = profile.avatarUrl;
        this.location = profile.location;
        this.website = profile.website;
        this.createdAt = profile.createdAt;
    }
}
