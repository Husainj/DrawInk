import { Board } from "../models/board.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {nanoid} from "nanoid"

const createBoard = asyncHandler( async(req,res) => {
    const { userId } = req.user

    const boardCode = nanoid(6) 

    const newBoard = await Board.create({
        code : boardCode,
        owner : userId,
        participants : [userId],
    })

    return res
    .status(200)
    .json(
        new apiResponse(200 , newBoard , "New Board Created")
    )
    
})



export {createBoard}