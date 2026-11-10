export const cube_mesh_index_count = 36;

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