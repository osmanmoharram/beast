import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    body!: string;

    @ManyToOne(() => User, (user) => user.comments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    author!: User;

    @ManyToOne(() => Post, (post) => post.comments, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    post!: Post;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
