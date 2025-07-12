import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js';

const router = Router();
router.get('/test',(req,res)=>{
  res.send('test route is working')
})
router.route('/register').post(registerUser);

export default router