import mongoose, { Schema } from "mongoose";

const elementSchema = new Schema({

    boardId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board",
        required : true
    },

    type : {
        type : String,
        enum : ['drawing', 'rectangle', 'circle', 'line'],
        required : true ,
    },

    position : {
        x : {type : Number , default : 0},
        y : {type : Number , default : 0}
    },

    dimensions :{
        width : {type : Number , default : 100 },
        height : {type : Number , default : 100},
        radius : Number
    },

    style : {
        stroke: { type: String, default: '#000000' },
        strokeWidth: { type: Number, default: 2 },
        fill: { type: String, default: 'transparent' }
    },

    points: [{ x: Number, y: Number }]

} , {timestamps : true})


export const Element = mongoose.model("Element" , elementSchema);