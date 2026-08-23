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

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id!: number;

    // Deliberately not User.username: the handle addresses an account, the
    // display name signs a post. Neither derives from the other.
    @Column({ length: 100 })
    displayName!: string;

    /**
     * Filename of the uploaded picture, not a URL and not a path: the
     * directory it sits in and the origin it is served from are deployment
     * details, and baking either into a row would break every avatar the day
     * one of them changes. Excluded because a client has no use for the name
     * on its own — it reads `avatarUrl` instead.
     */
    @Exclude()
    @Column({ type: 'varchar', nullable: true })
    avatar?: string | null;

    /**
     * Where to actually fetch the picture, filled in by AvatarsService rather
     * than stored: the uploaded file when there is one, a Gravatar generated
     * from the account otherwise. Undecorated, so TypeORM leaves it alone.
     */
    avatarUrl?: string;

    /**
     * The `pg` driver hands `date` columns back as 'YYYY-MM-DD' strings, so the
     * transformer parses them into the Date this property claims to hold.
     */
    @Column({
        type: 'date',
        nullable: true,
        transformer: {
            to: (value: Date | null) => value,
            from: (value: string | null) =>
                value === null ? null : new Date(value),
        },
    })
    birthDate?: Date | null;

    /**
     * @JoinColumn puts the FK on this side and, being a one-to-one, makes it
     * UNIQUE — that constraint is what limits a user to a single profile.
     */
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
