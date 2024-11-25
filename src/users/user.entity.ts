import { Column, Entity, Index, ObjectId, ObjectIdColumn } from 'typeorm';
import { UserPerm, UserRole, UserStatus } from '../generated';

@Entity()
export class User {

    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    @Index({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column()
    firstName?: string;

    @Column()
    lastName?: string;

    @Column()
    permissions: UserPerm[] = [];

    @Column()
    roles: UserRole[] = [];

    @Column()
    status: UserStatus = "active";

    @Column()
    createdTimestamp: Date = new Date();
}
