import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Profile } from '../../profiles/entities/profile.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    @Exclude()
    @Column()
    password!: string;

    @OneToMany(() => Post, (post) => post.author)
    posts!: Post[];

    @OneToMany(() => Comment, (comment) => comment.author)
    comments!: Comment[];

    // cascade insert is what lets UsersService.create() persist the user and
    // an empty profile in one transaction, so no account ever exists without
    // one and /profiles/me never has to handle a missing row.
    @OneToOne(() => Profile, (profile) => profile.user, {
        cascade: ['insert'],
    })
    profile!: Profile;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
