import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * The part of an account other people see. Everything here is nullable: a
 * profile row is created empty alongside the user at registration, so the
 * columns fill in later rather than being required up front.
 */
@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id!: number;

    // The human name. User.username stays the @handle, which is why both
    // exist: one is addressable, the other is just how you sign your posts.
    @Column({ type: 'varchar', length: 50, nullable: true })
    displayName!: string | null;

    @Column({ type: 'varchar', length: 280, nullable: true })
    bio!: string | null;

    // A URL, not an upload. Storing and serving the file is its own mission
    // item; this is the column that work will eventually write into.
    @Column({ type: 'varchar', length: 255, nullable: true })
    avatarUrl!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location!: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    website!: string | null;

    // Only ever needed for age checks, so it is kept out of responses the way
    // User.password is. /profiles/me puts it back via OwnProfileDto.
    // Typed as string because the postgres `date` type comes back unparsed.
    @Exclude()
    @Column({ type: 'date', nullable: true })
    birthDate!: string | null;

    @OneToOne(() => User, (user) => user.profile, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn()
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
