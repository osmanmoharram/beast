import { Exclude } from 'class-transformer';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column({ unique: true })
    email!: string;

    // Excluded from every response ClassSerializerInterceptor touches.
    @Exclude()
    @Column()
    password!: string;

    @OneToMany(() => Post, (post) => post.author)
    posts!: Post[];
}
