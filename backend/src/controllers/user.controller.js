import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getUserById = asyncHandler(async(req , res)=>{
    const { id } = req.params

    const user = await User.findById(id)

    if(!user){
       throw new apiError(400 , "User Not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200 , user , "User By given Id found")
    )
})


export {getUserById}