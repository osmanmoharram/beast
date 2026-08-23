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

    @Column({ type: 'varchar', nullable: true })
    avatar?: string | null;

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
