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
    "/images/block_texture.png",
    "/images/icon.png",
    "/images/player_texture.png",
    "/modules/chunk.js",
    "/modules/config.js",
    "/modules/cube_mesh.js",
    "/modules/gl_draw.js",
    "/modules/ui_draw.js",
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

//
export const FPS = 60;

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

export const PLAYER_HIT_X = 0.6;
export const PLAYER_HIT_Y = 1.6;
export const PLAYER_HIT_Z = 0.6;
export const PLAYER_EYE_Y = 1.4;

export const GRAVITY = 20;
export const PLAYER_MOVE_SPEED = 4;
export const PLAYER_JUMP_HEIGHT = 1.1;

export const BREAK_COOLDOWN = (0.5 / 8) * FPS;
export const PLACE_COOLDOWN = 0.25 * FPS;
export const ATTACK_COOLDOWN = 0.05 * FPS;