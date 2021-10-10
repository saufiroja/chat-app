const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, currentUser, userLeave, getRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chat Bot";

// run when client connect
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // welcome current user
    socket.emit("message", formatMessage(botName, "welcome to chat app"));

    // Runs when client connect
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send user and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoom(user.room),
    });
  });

  // catch chatMessage
  socket.on("chatMessage", (msg) => {
    const user = currentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // runs when client disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // send user and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoom(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
