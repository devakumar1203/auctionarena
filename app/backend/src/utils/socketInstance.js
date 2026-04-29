// Shared Socket.io instance — allows controllers to emit events
// without needing io passed through the request chain.
let io = null;

module.exports = {
  setIO: (ioInstance) => { io = ioInstance; },
  getIO: () => io,
};
