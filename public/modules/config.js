export const WEBSOCKET_PROTOCOL = (window.location.protocol === "https:" ? "wss:" : "ws:");

export const FPS = 50;

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 32;
export const CHUNK_SIZE_Z = 16;

export const MOUSE_SENSITIVITY = 0.05;

const TEXTURE_SIZE = 32;

/**
 * @param {Array<number>} coords
 * @returns {Array<number>}
 */
export function scale_UV(coords) {
    return coords.map((x) => {
        return x / TEXTURE_SIZE;
    });
}
function createBlockUV({ top, bottom = top, front = top, back = front, right = back, left = right }) {
    return {
        "top": scale_UV(top),
        "bottom": scale_UV(bottom),
        "front": scale_UV(front),
        "back": scale_UV(back),
        "right": scale_UV(right),
        "left": scale_UV(left)
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
            1, 7,
            7, 7,
            7, 1,
            1, 1
        ]
    }),
    2: createBlockUV({
        "top": [
            9, 7,
            15, 7,
            15, 1,
            9, 1
        ]
    }),
    3: createBlockUV({
        "top": [
            17, 7,
            23, 7,
            23, 1,
            17, 1
        ]
    }),
    4: createBlockUV({
        "top": [
            25, 7,
            31, 7,
            31, 1,
            25, 1
        ]
    }),
    5: createBlockUV({
        "top": [
            1, 15,
            7, 15,
            7, 9,
            1, 9
        ]
    })
};