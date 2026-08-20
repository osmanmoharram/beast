import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
