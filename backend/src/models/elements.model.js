import mongoose, { Schema } from "mongoose";

const elementSchema = new Schema({

    boardId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board",
        required : true
    },
    id : {type : String , required : true},
    type: { type: String, required: true }, // "square", "circle", "pen", etc.
    x: { type: Number },
    y: { type: Number },
    width: { type: Number }, // For square
    height: { type: Number }, // For square
    radius: { type: Number }, // For circle and triangle
    points: { type: Array }, // For pen
    stroke: { type: String }, // Color for pen
    fill: { type: String },

} , {timestamps : true})


export const Element = mongoose.model("Element" , elementSchema);