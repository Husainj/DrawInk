const userRoomMap = new Map();
import { Board } from "../models/board.model.js";
import { Element } from "../models/elements.model.js";
export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`User connected: ${userId}`);

    // Join a board room
    socket.on("joinBoard", async(boardId) => {
      socket.join(boardId);
      console.log(`User joined board: ${boardId}`);

      userRoomMap.set(socket.id, { userId, boardId });

      try {
        const shapes = await Element.find({ boardId });
        socket.emit("initialShapes", shapes); // Send existing shapes to the user
      } catch (error) {
        console.error("Error fetching shapes:", error);
      }
    });

    // Handle adding new element
    socket.on("addElement", async(data) => {
      const { boardId, newShape } = data;
      console.log("BOARD ID IN ADD SHAPE : " , boardId)
      console.log("ELEMENT REACHED IN ADD ELEMENT : " , newShape)
      newShape["boardId"] = boardId
      newShape["sId"] = newShape.id
      try {
        const ElementRes = new Element(newShape );
        await ElementRes.save();

        console.log("ADDED ELEMENT RESPONSE!! :: " , ElementRes)
        io.to(boardId).emit("elementAdded", ElementRes); // Broadcast to all users
      } catch (error) {
        console.error("Error adding shape:", error);
      }

     
    });

    // Handle element updates
    socket.on("updateElement", async(data) => {
      const { boardId, updatedShape } = data;
      try {
        const updatedShapeRes = await Element.findOneAndUpdate(
          { sId: updatedShape.id },
          updatedShape,
          { new: true }
        );

        console.log("UPDATED ELEMENT RESPONSE!! :: " , updatedShapeRes)
        io.to(boardId).emit("elementUpdated", updatedShapeRes); // Broadcast to all users
      } catch (error) {
        console.error("Error updating shape:", error);
      }
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
