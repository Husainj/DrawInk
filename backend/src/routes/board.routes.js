import {Router} from 'express'
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { createBoard, deleteBoard, getBoardDetails, getBoardsOfUser, joinBoard } from '../controllers/board.controller.js';

const router = Router();

router.route("/create").post(isAuthenticated , createBoard );
router.route("/").get(isAuthenticated , getBoardsOfUser);
router.route("/:boardId").get(isAuthenticated , getBoardDetails).delete(isAuthenticated , deleteBoard);
router.route("/join").post(isAuthenticated , joinBoard)

export default router 