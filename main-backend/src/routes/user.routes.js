import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js'

const router = Router();
router.get('/test',(req,res)=>{
  res.send('test route is working')
})
router.route('/register').post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
);

export default router