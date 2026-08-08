const socketMap = {}; // Maps socket.id -> { roomId, username, isGuest, isOwner }

module.exports = (io) => {
  io.on('connection', (socket) => {
    // User joins a collaboration room
    socket.on('join-room', ({ roomId, username, isGuest, isOwner }) => {
      socket.join(roomId);
      socketMap[socket.id] = { roomId, username, isGuest, isOwner };

      const users = Object.values(socketMap)
        .filter((u) => u.roomId === roomId)
        .map((u) => ({
          username: u.username,
          isGuest: u.isGuest,
          isOwner: u.isOwner,
        }));

      // Broadcast list of all active users in this room
      io.to(roomId).emit('joined', { users, username });
    });

    // Synchronize editor text changes
    socket.on('code-change', ({ roomId, fileId, code }) => {
      socket.to(roomId).emit('code-change', { fileId, code });
    });

    // Synchronize file explorer tree modifications (creates, deletes)
    socket.on('file-change', ({ roomId, files }) => {
      socket.to(roomId).emit('file-change', { files });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      const user = socketMap[socket.id];
      if (user) {
        delete socketMap[socket.id];
        const users = Object.values(socketMap)
          .filter((u) => u.roomId === user.roomId)
          .map((u) => ({
            username: u.username,
            isGuest: u.isGuest,
            isOwner: u.isOwner,
          }));

        io.to(user.roomId).emit('left', { users, username: user.username });
      }
    });
  });
};
