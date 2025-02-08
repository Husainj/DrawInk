export const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a board room
        socket.on("joinBoard", (boardId) => {
            socket.join(boardId);
            console.log(`User joined board: ${boardId}`);
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

        // Handle user disconnect
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
