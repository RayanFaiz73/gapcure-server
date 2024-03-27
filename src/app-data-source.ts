import { DataSource } from "typeorm"

export const myDataSource = new DataSource({
    type: "mysql",
    host: process.env.DS_HOST,
    port: 3306,
    username: process.env.DS_USER,
    password: process.env.DS_PASS,
    database: process.env.DS_DB,
    entities: [process.env.DS_ENTITIES || __dirname + '/../**/*.entity.{js,ts}'],
    // entities: [__dirname + '/../**/*.entity.{js,ts}'],
    logging: false,
    synchronize: true,
    multipleStatements:true
})


export const Manager = myDataSource.manager