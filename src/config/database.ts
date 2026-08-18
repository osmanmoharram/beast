import { registerAs } from "@nestjs/config";

export default registerAs('database', () => {

{
    type: 'postgres',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
}

    return {

    }
});

