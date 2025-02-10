import { Board } from "../models/board.model.js";
import { Element } from "../models/elements.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {nanoid} from "nanoid"

const createBoard = asyncHandler( async(req,res) => { 
    const {boardname} = req.body

    const boardCode = nanoid(6) 

    const newBoard = await Board.create({
        boardname : boardname,
        code : boardCode,
        owner : req.user._id,
        participants : [req.user._id],
    })

    return res
    .status(200)
    .json(
        new apiResponse(200 , newBoard , "New Board Created")
    )
    
})

const getBoardsOfUser = asyncHandler(async(req , res)=>{
    const userId = req.user._id

    const boards = await Board.find({owner : userId})
    .populate("participants" , "name email avatar") ;

    if(!boards){
        throw new apiError(400 , "No board Found")
    }

    return res.status(200)
    .json(
        new apiResponse(200 , boards , "All boards of this user fetched!")
    )
})

const getBoardDetails = asyncHandler(async(req, res)=>{
    const { boardId } = req.params

    const board = await Board.findById(boardId)
    .populate("owner" , "name email avatar")
    .populate("participants" , "name email avatar") ;

    if(!board){
        throw new apiError(400 , "Board not found");            
    }

    return res.status(200)
    .json(
        new apiResponse(200 , board , "Details of the board fetched")
    )
})

const joinBoard = asyncHandler(async(req, res)=>{
    const {code} = req.body
    const userId = req.user._id

    const board = await Board.findOne({ code });

    if(!board) {
        throw new apiError(400 , "No board Found to join")
    }

    if(!board.participants.includes(userId)) {
        board.participants.push(userId);
        await board.save();
    }

    return res.status(200)
    .json(
      new apiResponse(200 , board , "Board Joined successfully")
    )
})

const getBoardElements = asyncHandler(async(req,res)=>{
    const {boardId} = req.params

    const elements = await Element.find({boardId})

    if(!elements){
        throw new apiError(400 , "No elements found in the given board")
    }
    
    return res.status(200)
    .json(
        new apiResponse(200, elements , "Elements fetched of the board")
    )
})

const deleteBoard = asyncHandler(async(req, res)=>{
    const { boardId } = req.params

    const board = await Board.findByIdAndDelete(boardId)

    return res.status(200)
    .json(
        new apiResponse(200 , board , "Board Deleted")
    )
})

export {createBoard , getBoardsOfUser , getBoardDetails , deleteBoard , joinBoard ,getBoardElements}