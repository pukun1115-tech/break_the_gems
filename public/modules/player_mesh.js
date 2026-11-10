import { PLAYER_TEXTURE_SIZE } from "./config.js";


function scale_player_UV(coords) {
    return coords.map((x) => {
        return x / PLAYER_TEXTURE_SIZE;
    });
}

export const PLAYER_MESH_HEAD_X = 0.4;
export const PLAYER_MESH_HEAD_Y = 0.4;
export const PLAYER_MESH_HEAD_Z = 0.4;

export const PLAYER_MESH_BODY_X = 0.4;
export const PLAYER_MESH_BODY_Y = 0.6;
export const PLAYER_MESH_BODY_Z = 0.3;

export const PLAYER_MESH_ARM_X = 0.2;
export const PLAYER_MESH_ARM_Y = 0.6;
export const PLAYER_MESH_ARM_Z = 0.2;

export const PLAYER_MESH_LEG_X = 0.2;
export const PLAYER_MESH_LEG_Y = 0.6;
export const PLAYER_MESH_LEG_Z = 0.2;

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
    0, 0, 1
].map((t) => {
    return t - 0.5;
}));

export const player_head_texture_coord_red = new Float32Array(scale_player_UV([
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
    31, 9,
    39, 9,
    39, 1,
    31, 1,
    //bottom
    21, 9,
    29, 9,
    29, 1,
    21, 1
]));

export const player_head_texture_coord_blue = player_head_texture_coord_red.map((t, index) => {
    if (index % 2 === 0) {
        return t;
    } else {
        return t + 24;
});

export const player_body_texture_coord_red = new Float32Array(scale_player_UV([
    //front
    9, 19,
    9, 27,
    21, 27,
    21, 19,
    //back
    31, 19,
    31, 27,
    43, 27,
    43, 19,
    //right
    9, 11,
    9, 17,
    21, 17,
    21, 11,
    //left
    9, 11,
    9, 17,
    21, 17,
    21, 11,
    //top
    23, 27,
    29, 27,
    29, 19,
    23, 19,
    //bottom
    1, 27,
    7, 27,
    7, 19,
    1, 19
]));

export const player_body_texture_coord_blue = player_body_texture_coord_red.map((t, index) => {
    if (index % 2 === 0) {
        return t;
    } else {
        return t + 24;
    }
});

export const player_arm_texture_coord_red = new Float32Array(scale_player_UV([
    //front
    23, 15,
    35, 15,
    35, 11,
    23, 11,
    //back
    23, 15,
    35, 15,
    35, 11,
    23, 11,
    //right
    23, 15,
    35, 15,
    35, 11,
    23, 11,
    //left
    23, 15,
    35, 15,
    35, 11,
    23, 11,
    //top
    37, 15,
    41, 15,
    41, 11,
    37, 11,
    //bottom
    37, 15,
    41, 15,
    41, 11,
    37, 11
]));

export const player_arm_texture_coord_blue = player_arm_texture_coord_red.map((t, index) => {
    if (index % 2 === 0) {
        return t;
    } else {
        return t + 24;
    }
});

export const player_leg_texture_coord_red = new Float32Array(scale_player_UV([
    //front
    1, 29,
    1, 33,
    13, 33,
    13, 29,
    //back
    1, 29,
    1, 33,
    13, 33,
    13, 29,
    //right
    1, 29,
    1, 33,
    13, 33,
    13, 29,
    //left
    1, 29,
    1, 33,
    13, 33,
    13, 29,
    //top
    15, 33,
    19, 33,
    19, 29,
    15, 29,
    //bottom
    21, 33,
    25, 33,
    25, 29,
    21, 29
]));

export const player_leg_texture_coord_blue = player_leg_texture_coord_red.map((t, index) => {
    if (index % 2 === 0) {
        return t;
    } else {
        return t + 24;
    }
});
