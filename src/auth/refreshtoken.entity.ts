import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity({name: "refresh_tokens"})
export class RefreshToken {

    @ObjectIdColumn()
    id: ObjectId;

    @Column({type: "string"})
    userId: ObjectId;

    @Column()
    revoked: boolean;

    @Column()
    expirationTimestamp: Date;

    @Column()
    createdTimestamp: Date;
}