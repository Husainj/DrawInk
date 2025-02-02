import mongoose , {Schema} from "mongoose"

const userSchema = new Schema({

    googleId: {
        type: String,
        required: true,
        unique: true,
      },


    name : {
        type : String,
        required : true,
        trim: true
    },

    email : {
        type : String,
        required : true,
        trim : true,
        unique: true,
        lowercase :true,
    },

    avatar : {
        type : String,
        required : true,
    },

    boards : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Board"
    }]


},{timestamps : true})

export const User = mongoose.model("User" , userSchema)