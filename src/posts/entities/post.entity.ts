import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

/**
 * Postgres indexes a foreign key's target, never the column holding it, so
 * every FK below needs one declared by hand — without it a lookup by relation
 * is a sequential scan of the whole table.
 *
 * The composite matches the list endpoint's ORDER BY exactly, which lets a
 * page be read straight off the index instead of sorting 50k rows to return
 * 20 of them.
 */
/**
 * Names of the trigram indexes SearchIndexService creates, mapped to the
 * column each one covers. Declared below with `synchronize: false` so the
 * schema builder knows they are accounted for and leaves them alone — without
 * that it drops every index it did not create on the next boot, GIN included.
 */
export const POST_SEARCH_INDEXES = {
    IDX_posts_title_trgm: 'title',
    IDX_posts_body_trgm: 'body',
} as const;

/**
 * The schema builder honours `synchronize: false` — it is the flag that stops
 * it dropping an index it did not create — but typeorm 1.1.0 leaves the
 * property out of the published IndexOptions. Declaring it here is what lets
 * the trigram indexes below be named in metadata without the compiler
 * objecting; nothing about the runtime changes.
 */
declare module 'typeorm' {
    interface IndexOptions {
        synchronize?: boolean;
    }
}

/**
 * Declared, but built by SearchIndexService rather than by the schema builder,
 * which can only emit a btree over these columns. Naming them here is not
 * decoration: an index absent from metadata is dropped on the next boot.
 */
@Index('IDX_posts_title_trgm', ['title'], { synchronize: false })
@Index('IDX_posts_body_trgm', ['body'], { synchronize: false })
@Index(['createdAt', 'id'])
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    body!: string;

    @Index()
    @ManyToOne(() => User, (user) => user.posts, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    author!: User;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments!: Comment[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
