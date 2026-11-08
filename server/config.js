import path from "node:path";

//http server
export const DEFAULT_PATH = path.resolve(import.meta.dirname, "../");
export const PORT = Number(process.env.PORT ?? "3000");
export const MIME_TYPES = Object.freeze({
    ".txt": "text/plain; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".png": "image/png"
});

export const PUBLIC_FILES = [
    "/images/icon.png",
    "/images/texture.png",
    "/modules/chunk.js",
    "/modules/config.js",
    "/modules/draw.js",
    "/modules/gl_functions.js",
    "/modules/matrix.js",
    "/modules/player_mesh.js",
    "/modules/player.js",
    "/modules/rotation.js",
    "/modules/script.js",
    "/modules/shader.js",
    "/index.html",
    "/style.css"
];

//WebSocket
export const MAGIC_STRING = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export const TEXT_OPCODE = 0b0001;
export const CLOSE_OPCODE = 0b1000;
export const PING_OPCODE = 0b1001;
export const PONG_OPCODE = 0b1010;

export const MAX_BUFFER_SIZE = 512 * 512;

//Game
export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 32;
export const CHUNK_SIZE_Z = 16;

export const GRAVITY = 20;
export const PLAYER_MOVE_SPEED = 4;
export const PLAYER_JUMP_HEIGHT = 1.25;