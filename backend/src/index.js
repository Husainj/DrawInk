import { app } from "./app.js";
import dotenv from "dotenv"
import connectDB from "./db/index.js";


dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error" , (error)=>{
        console.log("Error : " , error)
        throw error 
    })

    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Port is open at : ${process.env.PORT}`)
    })

    app.get("/" , (req , res)=>{
        res.json("Hello");
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed : " , err)
})
