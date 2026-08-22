import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    body!: string;

    @ManyToOne(() => User, (user) => user.posts, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    author!: User;
}
