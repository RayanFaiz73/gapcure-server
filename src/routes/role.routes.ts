import express, {Router} from 'express';
import { CreateRole, DeleteRole, FileUpload, GetRole, Roles, UpdateRole } from "../controller/roles.controller";
import { CheckAuthState } from "../middleware/auth.middleware";
import { permissionSeed } from '../seeds/permission.preseed';
import { roleSeed } from "../seeds/role.preseed";
import { userAdminSeed } from '../seeds/userAdmin.preseed';
const router = Router();

router.get('/roles', CheckAuthState, Roles)
router.post('/roles', CheckAuthState, CreateRole)
router.get('/roles/:id', CheckAuthState, GetRole)
router.put('/roles/:id', CheckAuthState, UpdateRole)
router.delete('/roles/:id', CheckAuthState, DeleteRole)



// pre-seed permissions
router.get('/preseed/permissions', permissionSeed)
// pre-seed roles
router.get('/preseed/roles', roleSeed)
// pre-seed user
router.get('/preseed/users',userAdminSeed)
// image upload
router.post('/upload', CheckAuthState, FileUpload)
// make upload route public
router.use('/uploads', express.static('./uploads'))

export default router;