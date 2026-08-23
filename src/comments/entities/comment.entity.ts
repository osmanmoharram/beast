import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';
import { User } from '../../users/entities/user.entity';

/**
 * The composite carries the thread route on its own: it narrows to one post
 * and hands back the rows already in the order that route reads them. A bare
 * index on the post would still leave a sort behind.
 */
@Index(['post', 'createdAt', 'id'])
@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    body!: string;

    // Not covered by the composite above, and needed for the cascade: deleting
    // a user has to find their comments, which is a scan without this.
    @Index()
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
