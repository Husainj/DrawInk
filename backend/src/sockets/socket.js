const userRoomMap = new Map();
const drawingBuffers = new Map(); // Buffer for drawing updates
import { Board } from "../models/board.model.js";
import { Element } from "../models/elements.model.js";

export const setupSocket = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    console.log(`User connected: ${userId}`);

    socket.on("joinBoard", async (boardId) => {
      socket.join(boardId);
      console.log(`User joined board: ${boardId}`);
      userRoomMap.set(socket.id, { userId, boardId });

      try {
        const shapes = await Element.find({ boardId });
        socket.emit("initialShapes", shapes);
      } catch (error) {
        console.error("Error fetching shapes:", error);
      }
    });

    socket.on("addElement", async (data) => {
      const { boardId, newShape } = data;
      newShape["boardId"] = boardId;
      newShape["id"] = newShape.id;
      try {
        const ElementRes = new Element(newShape);
        await ElementRes.save();
        io.to(boardId).emit("elementAdded", ElementRes);
      } catch (error) {
        console.error("Error adding shape:", error);
      }
    });

    socket.on("updateElement", async (data) => {
      const { boardId, updatedShape } = data;
      try {
        const updatedShapeRes = await Element.findOneAndUpdate(
          { id: updatedShape.id },
          updatedShape,
          { new: true }
        );
        io.to(boardId).emit("elementUpdated", updatedShapeRes);
      } catch (error) {
        console.error("Error updating shape:", error);
      }
    });

    socket.on("deleteElement", async (data) => {
      const { boardId, elementId } = data;
      try {
        const deletedElement = await Element.findOneAndDelete({ boardId, id: elementId });
        if (!deletedElement) {
          console.log("Element not found!");
          return;
        }
        io.to(boardId).emit("elementDeleted", elementId);
      } catch (error) {
        console.error("Error deleting element:", error);
      }
    });

    socket.on("updateDrawing", async ({ boardId, drawingId, points, isComplete }) => {
      try {
        if (!drawingBuffers.has(drawingId)) {
          const drawing = await Element.findOne({ boardId, id: drawingId });
          if (drawing) {
            drawingBuffers.set(drawingId, { points: drawing.points, boardId });
          }
        }

        const buffer = drawingBuffers.get(drawingId);
        if (buffer) {
          buffer.points = [...buffer.points, ...points];
          io.to(boardId).emit("drawingUpdated", { drawingId, points });

          if (isComplete) {
            await Element.findOneAndUpdate(
              { boardId, id: drawingId },
              { points: buffer.points },
              { new: true }
            );
            drawingBuffers.delete(drawingId);
            console.log(`Drawing ${drawingId} completed and saved`);
          }
        }
      } catch (error) {
        console.error("Error updating drawing:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.id}`);
      const userRoomInfo = userRoomMap.get(socket.id);
      if (userRoomInfo) {
        const { userId, boardId } = userRoomInfo;
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
        userRoomMap.delete(socket.id);
      }
    });
  });

  // Periodic save to database
  setInterval(async () => {
    for (const [drawingId, { points, boardId }] of drawingBuffers) {
      try {
        await Element.findOneAndUpdate(
          { boardId, id: drawingId },
          { points },
          { new: true }
        );
        console.log(`Saved drawing ${drawingId} to database`);
      } catch (error) {
        console.error("Error saving drawing to DB:", error);
      }
    }
  }, 5000); // Every 5 seconds
};