import { PLAYER_TEXTURE_SIZE } from "./config.js";


function scale_player_UV(coords) {
    return coords.map((x) => {
        return x / PLAYER_TEXTURE_SIZE;
    });
}

export const PLAYER_MESH_BODY_X = 0.6;
export const PLAYER_MESH_BODY_Y = 1.0;
export const PLAYER_MESH_BODY_Z = 0.3;
export const PLAYER_MESH_HEAD_X = 0.4;
export const PLAYER_MESH_HEAD_Y = 0.4;
export const PLAYER_MESH_HEAD_Z = 0.4;
export const PLAYER_MESH_ARM_X = 0.2;
export const PLAYER_MESH_ARM_Y = 0.8;
export const PLAYER_MESH_ARM_Z = 0.2;
export const PLAYER_MESH_LEG_X = 0.3;
export const PLAYER_MESH_LEG_Y = 0.4;
export const PLAYER_MESH_LEG_Z = 0.3;

export const cube_mesh_index = new Uint16Array([
    0, 1, 2,
    0, 2, 3,
    4, 5, 6,
    4, 6, 7,
    8, 9, 10,
    8, 10, 11,
    12, 13, 14,
    12, 14, 15,
    16, 17, 18,
    16, 18, 19,
    20, 21, 22,
    20, 22, 23
]);

export const cube_mesh_index_count = 36;

export const cube_mesh_position = new Float32Array([
    //front
    0, 0, 1,
    1, 0, 1,
    1, 1, 1,
    0, 1, 1,
    //back
    1, 0, 0,
    0, 0, 0,
    0, 1, 0,
    1, 1, 0,
    //right
    1, 0, 1,
    1, 0, 0,
    1, 1, 0,
    1, 1, 1,
    //left
    0, 0, 0,
    0, 0, 1,
    0, 1, 1,
    0, 1, 0,
    //top
    0, 1, 1,
    1, 1, 1,
    1, 1, 0,
    0, 1, 0,
    //bottom
    0, 0, 0,
    1, 0, 0,
    1, 0, 1,
    0, 0, 1,
].map((x) => {
    return x - 0.5;
}));

export const player_body_texture_coord = new Float32Array(scale_player_UV([
    //front
    31, 9,
    31, 21,
    51, 21,
    51, 9,
    //back
    31, 9,
    31, 21,
    51, 21,
    51, 9,
    //right
    31, 1,
    31, 7,
    51, 7,
    51, 1,
    //left
    31, 1,
    31, 7,
    51, 7,
    51, 1,
    //top
    53, 9,
    53, 21,
    59, 21,
    59, 9,
    //bottom
    53, 9,
    53, 21,
    59, 21,
    59, 9,
]));
export const player_head_texture_coord = new Float32Array(scale_player_UV([
    //front
    1, 9,
    9, 9,
    9, 1,
    1, 1,
    //back
    11, 9,
    19, 9,
    19, 1,
    11, 1,
    //right
    11, 9,
    19, 9,
    19, 1,
    11, 1,
    //left
    11, 9,
    19, 9,
    19, 1,
    11, 1,
    //top
    1, 19,
    9, 19,
    9, 11,
    1, 11,
    //bottom
    21, 9,
    29, 9,
    29, 1,
    21, 1
]));
export const player_arm_texture_coord = new Float32Array(scale_player_UV([
    //front
    //back
    //right
    //left
    //top
    //bottom
]));
export const player_leg_texture_coord = new Float32Array(scale_player_UV([
    //front
    //back
    //right
    //left
    //top
    //bottom
]));