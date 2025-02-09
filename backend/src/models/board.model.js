import mongoose, { Schema } from "mongoose";

const boardSchema = new Schema({
    boardname : {
        type: String,
        required : true,
    },
    code : {
        type : String,
        unique : true,
        required : true
    },

    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },

    participants : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }],

} , {timestamps : true})

export const Board = mongoose.model("Board" , boardSchema)