import { MongoClient } from 'mongodb';
import * as yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UserPerm, UserRole, UserStatus } from './src/users/user.entity';

async function run() {
    const config = yaml.load(readFileSync(join(__dirname, "src/config/config.yaml"), 'utf8')) as Record<string, any>;
    const client = new MongoClient(config.database.url, { authSource: "admin" });
    await client.connect();

    try {
        const db = client.db();
        const userCollection = db.collection("user");

        const found = await userCollection.findOne({ username: "leonardo" });
        if (!found) {
            await userCollection.insertOne({
                username: "leonardo",
                password: "$2b$10$Sv5yD1XJSOxkFJTUktpfcegRvr12sI9cIFaaZomMCWoP3mPYecgdm",
                firstName: "Leonardo",
                lastName: "Cserny",
                roles: ["STANDARD", "ADMIN"] as UserRole[],
                permissions: ["READ", "WRITE"] as UserPerm[],
                status: "active" as UserStatus,
                createdTimestamp: new Date(),
            });
            console.log('Inserted default admin user.');
        }
    } finally {
        await client.close();
    }
}

run();
