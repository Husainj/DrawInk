import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addElement = asyncHandler(async(req , res)=>{
    const { boardId, type, position, dimensions, style, points } = req.body;

    const newElement = await Element.create({
      boardId,
      type,
      position,
      dimensions,
      style,
      points,
    });

    if(!newElement){
        throw new apiError(400 , "Element was not added")
    }
    req.io.to(boardId).emit("elementAdded", newElement);

    return res.status(200)
    .json(
        new apiResponse(200 , newElement , "Element added successfully")
    )

})

const updateElement = asyncHandler(async(req,res)=>{
    const { elementId } = req.params;
    const updatedElement = await Element.findByIdAndUpdate(elementId, req.body, { new: true });

    if (!updatedElement) {
        throw new apiError(400 , "Element not updated")
    }

    req.io.to(updatedElement.boardId.toString()).emit("elementUpdated", updatedElement);

    return res.status(200)
    .json(
        new apiResponse(200 , updatedElement , "Element updated successfully")
    )
})

const deleteElement = asyncHandler(async (req, res) => {
    const { elementId } = req.params;
    const deletedElement = await Element.findByIdAndDelete(elementId);

    if (!deletedElement) {
        throw new apiError(400 , "Element not deleted")
    }

    // Emit real-time update
    req.io.to(deletedElement.boardId.toString()).emit("elementDeleted", elementId);

    return res.status(200).
    json(
        new apiResponse(200 , deletedElement , "Element deleted successfully")
    );
});

export {addElement , updateElement , deleteElement}