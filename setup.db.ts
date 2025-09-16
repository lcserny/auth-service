import { MongoClient } from 'mongodb';
import { UserPerm, UserRole, UserStatus } from './src/generated';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function run() {
    const mongoUrl = await produceMongoUrl();
    console.log(`\nMongoDB connection: ${mongoUrl}\n`);

    const client = new MongoClient(mongoUrl, { authSource: "admin" });
    await client.connect();

    try {
        const db = client.db();
        const userCollection = db.collection("user");

        const filter = { username: "leonardo" };
        const update = {
            $set: {
                username: "leonardo",
                password: "$2b$10$Sv5yD1XJSOxkFJTUktpfcegRvr12sI9cIFaaZomMCWoP3mPYecgdm",
                firstName: "Leonardo",
                lastName: "Cserny",
                roles: ["STANDARD", "ADMIN"] as UserRole[],
                permissions: ["READ", "WRITE"] as UserPerm[],
                status: "active" as UserStatus,
                createdTimestamp: new Date(),
            }
        };
        const options = { upsert: true };

        await userCollection.updateOne(filter, update, options);

        console.log('Upserted default admin user.');
    } finally {
        await client.close();
    }
}

async function produceMongoUrl(): Promise<string> {
    const rl = readline.createInterface({ input, output });
    let dbHostPort = await rl.question('Enter database host with port (default: "localhost:27019"): ');
    if (!dbHostPort) {
        dbHostPort = 'localhost:27019';
    }
    const dbUsername = await rl.question('Enter database username: ');
    const dbPassword = await rl.question('Enter database password: ');
    let dbName = await rl.question('Enter database name (default: "videosmover"): ');
    if (!dbName) {
        dbName = 'videosmover';
    }
    rl.close();

    return `mongodb://${dbUsername}:${dbPassword}@${dbHostPort}/${dbName}?retryWrites=true&w=majority`;
}

run();
