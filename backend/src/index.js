import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import http from "http";
import { Server } from "socket.io";
import { setupSocket } from "./sockets/socket.js";
import {server} from "./app.js"
dotenv.config({
    path: "./.env",
});


connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });

        const PORT = process.env.PORT || 8000;
        server.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });

        app.get("/", (req, res) => {
            res.json("Hello");
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed: ", err);
    });
