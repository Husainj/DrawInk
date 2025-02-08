import {Router} from 'express'
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { createBoard, deleteBoard, getBoardDetails, getBoardElements, getBoardsOfUser, joinBoard } from '../controllers/board.controller.js';

const router = Router();

router.route("/create").post(isAuthenticated , createBoard );
router.route("/").get(isAuthenticated , getBoardsOfUser);
router.route("/:boardId").get(isAuthenticated , getBoardDetails).delete(isAuthenticated , deleteBoard);
router.route("/join").post(isAuthenticated , joinBoard)
router.route("/:boardId/elements").get(isAuthenticated , getBoardElements)
export default router 