import { Request, Response } from "express";
import { Manager } from "../app-data-source";
import { Role } from "../entities/role.entity";
import multer from 'multer';
import { extname } from 'path';
const repository = Manager.getRepository(Role);

export const Roles = async (req: Request, res: Response) => {
    res.send(await repository.find({relations: ['permissions']}))
}

export const CreateRole = async (req: Request, res: Response) => {
    const { name, permissions } = req.body;
    const role = await repository.save({
        name,
        permissions: permissions.map( (id : any) => {
            return {
                id: id
            }
        })
    })
    res.send(role)
}

export const GetRole = async (req: Request, res: Response) => {
    res.send(await repository.findOne({
        where: { id: req.params.id }, relations: ['permissions']
    })
    )
}

export const UpdateRole = async (req: Request, res: Response) => {
    const { name, permissions } = req.body;
    const role = await repository.save({
        id: parseInt(req.params.id),
        name,
        permissions: permissions.map( (id : any) => {
            return {
                id: id
            }
        })
    })
    res.status(202).send(role)
}

export const DeleteRole = async (req: Request, res: Response) => {
    const deleteRole = await repository.delete(req.params.id)

    // res.status(204).send(deleteRole)
    res.status(200).send(deleteRole)
}


export const FileUpload = async (req: Request, res: Response)  => {
    const storage = multer.diskStorage({
        destination: './uploads',
        filename(_, file, cb){
            const randomName = Math.random().toString(20).substring(2, 12)
            return cb(null, `${randomName}${extname(file.originalname)}`)
        }
    })

    const upload = multer({ storage }).single('image')

    upload(req, res, (err) => {
        
        if(err){
            return res.send(400).send(err)
        }

        res.send({url: `http://localhost:8080/api/uploads/${req?.file?.filename}`})
    })
}