const userRoomMap = new Map();
import { Board } from "../models/board.model.js";
export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`User connected: ${userId}`);

    // Join a board room
    socket.on("joinBoard", (boardId) => {
      socket.join(boardId);
      console.log(`User joined board: ${boardId}`);

      userRoomMap.set(socket.id, { userId, boardId });
    });

    // Handle adding new element
    socket.on("addElement", (data) => {
      const { boardId, element } = data;
      io.to(boardId).emit("elementAdded", element);
    });

    // Handle element updates
    socket.on("updateElement", (data) => {
      const { boardId, element } = data;
      io.to(boardId).emit("elementUpdated", element);
    });

    // Handle element deletion
    socket.on("deleteElement", (data) => {
      const { boardId, elementId } = data;
      io.to(boardId).emit("elementDeleted", elementId);
    });

    // socket.on("leaveBoard", async ({ boardId, userId }) => {
    //     try {
    //       const board = await Board.findById(boardId);
    //       board.participants = board.participants.filter((id) => id.toString() !== userId);
    //       await board.save();
    //       console.log(`User ${userId} removed from board ${boardId}`);
    //     } catch (error) {
    //       console.error("Error removing user from participants:", error);
    //     }
    //   });

    // Handle user disconnect
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.id}`);
      const userRoomInfo = userRoomMap.get(socket.id);
        console.log("MAP DETAILS : " , userRoomMap)
      console.log("USER ROOM INFO : " , userRoomInfo)
      if (userRoomInfo) {
        const { userId, boardId } = userRoomInfo;

        // Remove user from participants array in the database
        try {
          const board = await Board.findById(boardId);
          board.participants = board.participants.filter(
            (id) => id.toString() !== userId
          );
          await board.save();
          console.log(`User ${userId} removed from board ${boardId}`);
        } catch (error) {
          console.error("Error removing user from participants:", error);
        }

        // Remove the user from the map
        userRoomMap.delete(socket.id);
      }
    });
  });
};
