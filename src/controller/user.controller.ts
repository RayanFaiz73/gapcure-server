import { Request, Response } from "express";
import { myDataSource } from '../app-data-source';
import { User } from '../entities/user.entity';
import bcryptjs from "bcryptjs";
import { Not } from "typeorm";
const repository = myDataSource.getRepository(User);

export const GetUsers = async (req: Request, res: Response) => {

    console.log('Cookies: ', req.cookies)
    const user = req['user'];
    // pagination
    // only retrieve 15 items per page
    const take = 15
    const page = parseInt(req.query.page as string || '1')
    // find 'take' number of items starting from zero or (page-1)*take
    // const [data, total] = await repository.findAndCount({
    const [data, total] = await repository.findAndCount({
        where: {
            id: Not(user.id),
        },
        take: take,
        skip: ( page - 1 ) * take,
        relations: ['role.permissions']
    })

    res.send({
        data: data.map(user => {
            const { password, ...data} = user
            return data
        }),
        // also return active page, last page and total number of items
        meta: {
            total,
            page,
            last_page: Math.ceil(total / take)
        }
    })
}


export const GetUser = async (req: Request, res: Response) => {
    const id : any = req.params.id;
    const userData = await repository.findOne({ 
        where: { id: id },
        relations: ['role']
    })

    if (!!userData) {
        const { password, ...user } = userData;
        res.send({ user })
    }
}

export const CreateUser = async (req: Request, res: Response) => {
    // check if user exists in db
    const existingUser = await repository.findOneBy(
        {
            email: req.body.email
        }
    )

    // if does not exists break
    if (existingUser) {
        return res.status(404).send({
            message: 'User aleady exists!'
        })
    }
    const { role_id, ...body } = req.body;
    const hashedPassword = await bcryptjs.hash(body.password, 10);
    const { password, ...user} = await repository.save({
        ...body,
        password: hashedPassword,
        role: {
            id: role_id
        }
    })

    res.status(201).send(user)
}


export const UpdateUser = async (req: Request, res: Response) => {
    // check if user exists in db
    const userCheck = await repository.findOneBy(
        {
            email: req.body.email
        }
    )
    const id : any = req.params.id;

    // if does not exists break
    if (userCheck && userCheck.id !== id) {
        return res.status(404).send({
            message: 'ERROR :: Email not available!'
        })
    }
    const { role_id, ...body } = req.body;
    const update = await repository.update(req.params.id, {
        ...body,
        role: {
            id: role_id
        }
    })
    
    const userData = await repository.findOne({ 
        where: { id: id },
        relations: ['role']
    })

    if (!!userData) {
        const { password, ...user } = userData;
        res.status(202).send(user)
    }
    // res.status(202).send(update)
}

export const DeleteUser = async (req: Request, res: Response) => {
    const deleteUser = await repository.delete(req.params.id)
    
    // res.status(204).send(deleteUser)
    res.status(200).send(deleteUser)
}