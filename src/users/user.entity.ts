import { Column, Entity, Index, ObjectId, ObjectIdColumn } from 'typeorm';

export type UserStatus = "active" | "inactive";
export type UserRole = "ADMIN" | "STANDARD" | "GUEST";
export type UserPerm = "READ" | "WRITE";

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
