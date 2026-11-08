import {
    vertex_shader_source,
    fragment_shader_source,
    get_attribute_locations,
    get_attribute_strides,
    get_uniform_locations
} from "./shader.js";
import {
    create_shader,
    create_program,
    create_texture,
    set_attribute
} from "./gl_functions.js";
import { deg2rad, rotate_vector_XYZ } from "./rotation.js";
import { Mat4 } from "./matrix.js";

/** @type {HTMLCanvasElement} */
export const canvas = document.getElementById("canvas");
/** @type {WebGLRenderingContext | null} */
export const gl = canvas.getContext("webgl");
if (gl === null) {
    throw new Error("gl");
}

const vertex_shader = create_shader(gl, vertex_shader_source, "vertex");
const fragment_shader = create_shader(gl, fragment_shader_source, "fragment");
if (vertex_shader === null || fragment_shader === null) {
    throw new Error("create_shader");
}

const program = create_program(gl, vertex_shader, fragment_shader);
if (program === null) {
    throw new Error("create_program");
}

gl.useProgram(program);

/** @type {Record<string, number>} */
const attribute_locations = get_attribute_locations(gl, program);
/** @type {Record<string, number>} */
const attribute_strides = get_attribute_strides();

/** @type {Record<string, number>} */
const uniformLocations = get_uniform_locations(gl, program);

gl.activeTexture(gl.TEXTURE0);
try {
    const texture = await create_texture(gl, "../images/texture.png");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.uniform1i(uniformLocations["texture"], 0);
} catch (error) {
    throw new Error("create_texture", { cause: error });
}

/**
 * @param {WebGLRenderingContext} gl
 * @returns {void}
 */
function resize_canvas(gl) {
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}
window.addEventListener("resize", () => {
    setTimeout(() => {
        resize_canvas(gl);
    }, 10);
});
resize_canvas(gl);

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clearDepth(1.0);

const mMatrix = Mat4.identity(Mat4.create());
const vMatrix = Mat4.identity(Mat4.create());
const pMatrix = Mat4.identity(Mat4.create());
const mvpMatrix = Mat4.identity(Mat4.create());

export function draw(player, chunks) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.identity(mMatrix);
    Mat4.identity(vMatrix);
    Mat4.identity(pMatrix);
    Mat4.identity(mvpMatrix);

    const center = rotate_vector_XYZ({ x: 0, y: 0, z: 1 }, { x: deg2rad(player.rot.x), y: deg2rad(player.rot.y), z: deg2rad(player.rot.z) });
    const up = rotate_vector_XYZ({ x: 0, y: 1, z: 0 }, { x: deg2rad(player.rot.x), y: deg2rad(player.rot.y), z: deg2rad(player.rot.z) });

    Mat4.lookAt(vMatrix, [player.pos.x, player.pos.y + 1.6, player.pos.z], [player.pos.x + center.x, player.pos.y + 1.6 + center.y, player.pos.z + center.z], [up.x, up.y, up.z]);
    Mat4.perspective(pMatrix, deg2rad(player.FOV), gl.canvas.width / gl.canvas.height, 0.01, 1000);

    Mat4.multiply(mvpMatrix, pMatrix, vMatrix);
    Mat4.multiply(mvpMatrix, mvpMatrix, mMatrix);

    gl.uniformMatrix4fv(uniformLocations["mvp_matrix"], false, mvpMatrix);

    for (const c of chunks.values()) {
        set_attribute(gl, {
            "position": c.position_vbo,
            "color": c.color_vbo,
            "texture_coord": c.texture_coord_vbo
        }, attribute_locations, attribute_strides);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo);
        gl.drawElements(gl.TRIANGLES, c.index_count, gl.UNSIGNED_SHORT, 0);
    }
}