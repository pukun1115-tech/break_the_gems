export const WEBSOCKET_PROTOCOL = (window.location.protocol === "https:" ? "wss:" : "ws:");

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 32;
export const CHUNK_SIZE_Z = 16;

export const GRAVITY = 20;
export const PLAYER_MOVE_SPEED = 4;
export const PLAYER_JUMP_HEIGHT = 1.25;

export const MOUSE_SENSITIVITY = 0.05;

const TEXTURE_SIZE = 16;

/**
 * @param {Array<number>} coords
 * @returns {Array<number>}
 */
function scaleUV(coords) {
    return coords.map((x) => {
        return x / TEXTURE_SIZE;
    });
}
function createBlockUV({ top, bottom = top, front = top, back = front, right = back, left = right }) {
    return {
        "top": scaleUV(top),
        "bottom": scaleUV(bottom),
        "front": scaleUV(front),
        "back": scaleUV(back),
        "right": scaleUV(right),
        "left": scaleUV(left)
    };
}

export const BLOCK_TYPES = {
    0: "air",
    1: "bedrock",
    2: "red_dirt",
    3: "red_gem",
    4: "blue_dirt",
    5: "blue_gem",
};
export const BLOCK_TEXTURECOORD = {
    1: createBlockUV({
        "top": [
            0, 4,
            4, 4,
            4, 0,
            0, 0
        ]
    }),
    2: createBlockUV({
        "top": [
            4, 4,
            8, 4,
            8, 0,
            4, 0
        ]
    }),
    3: createBlockUV({
        "top": [
            8, 4,
            12, 4,
            12, 0,
            8, 0
        ]
    }),
    4: createBlockUV({
        "top": [
            12, 4,
            16, 4,
            16, 0,
            12, 0
        ]
    }),
    5: createBlockUV({
        "top": [
            0, 8,
            4, 8,
            4, 4,
            0, 4
        ]
    })
};