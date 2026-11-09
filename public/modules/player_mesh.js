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

export const player_mesh_index = new Uint16Array([
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

export const cube_mesh_stage = new Float32Array(24).fill(8);
export const cube_mesh_color = new Float32Array(96).fill(1.0);

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
]);

export const player_body_texture_coord = new Float32Array(scale_player_UV([
    //front
    //back
    //right
    //left
    //top
    //bottom
]));
export const player_head_texture_coord = new Float32Array(scale_player_UV([
    //front
    //back
    //right
    //left
    //top
    //bottom
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

export const player_mesh_position = new Float32Array([
    //front
    -0.3, 0, 0.15,
    0.3, 0, 0.15,
    0.3, 1.3, 0.15,
    -0.3, 1.3, 0.15,
    //back
    0.3, 0, -0.15,
    -0.3, 0, -0.15,
    -0.3, 1.3, -0.15,
    0.3, 1.3, -0.15,
    //right
    0.3, 0, 0.15,
    0.3, 0, -0.15,
    0.3, 1.3, -0.15,
    0.3, 1.3, 0.15,
    //left
    -0.3, 0, -0.15,
    -0.3, 0, 0.15,
    -0.3, 1.3, 0.15,
    -0.3, 1.3, -0.15,
    //top
    -0.3, 1.3, 0.15,
    0.3, 1.3, 0.15,
    0.3, 1.3, -0.15,
    -0.3, 1.3, -0.15,
    //bottom
    -0.3, 0, -0.15,
    0.3, 0, -0.15,
    0.3, 0, 0.15,
    -0.3, 0, 0.15
]);

export const player_mesh_color = new Float32Array(96).fill(1.0);

export const player_mesh_texture_coord = new Float32Array([
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25,
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25,
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25,
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25,
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25,
    0.25, 0.5,
    0.5, 0.5,
    0.5, 0.25,
    0.25, 0.25
]);

export const player_mesh_stage = new Float32Array(24).fill(8);
