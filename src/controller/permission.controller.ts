import { Request, Response } from "express";
import { Manager } from "../app-data-source";
import { Permission } from "../entities/permission.entity";

const repository = Manager.getRepository(Permission);

export const Permissions = async (req: Request, res: Response) => {
    res.send(await repository.find())
}