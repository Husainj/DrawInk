import { User } from "../models/user.model.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getMyDetails = asyncHandler(async(req,res) => {

    const user = await User.findById(req.user.id);

    if(!user){
        throw new apiError(400 , "User Not found");
    }
    return res.status(200)
    .json(
        new apiResponse(200 , user , "Current User details fetched")
    )
 })

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

const deleteUser = asyncHandler(async(req , res)=>{
    const id = req.user._id;

    if(!id){
        throw new apiError("No user Id found to delete user")
    }

    const user = await User.findByIdAndDelete(id);

    return res.status(200)
    .json(
        new apiResponse(200 , user , "User Deleted Successfully")
    )

})


export {getUserById , getMyDetails , deleteUser}