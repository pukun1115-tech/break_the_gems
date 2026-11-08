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
    create_ibo,
    create_vbo,
    create_texture,
    set_attribute
} from "./gl_functions.js";
import { deg2rad, rotate_vector_XYZ } from "./rotation.js";
import { Mat4 } from "./matrix.js";
import {
    player_mesh_color,
    player_mesh_index,
    player_mesh_position,
    player_mesh_texture_coord,
    player_mesh_stage
} from "./player_mesh.js";

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
const uniform_locations = get_uniform_locations(gl, program);

gl.activeTexture(gl.TEXTURE0);
try {
    const texture = await create_texture(gl, "../images/texture.png");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    gl.uniform1i(uniform_locations["texture"], 0);
} catch (error) {
    throw new Error("create_texture", { cause: error });
}

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
gl.clearColor(0.5, 0.5, 1.0, 1.0);
gl.clearDepth(1.0);

const m_matrix = Mat4.identity(Mat4.create());
const v_matrix = Mat4.identity(Mat4.create());
const p_matrix = Mat4.identity(Mat4.create());
const mvp_matrix = Mat4.identity(Mat4.create());

const player_index_count = 36;
const player_ibo = create_ibo(gl, player_mesh_index);
const player_position_vbo = create_vbo(gl, player_mesh_position);
const player_color_vbo = create_vbo(gl, player_mesh_color);
const player_texture_coord_vbo = create_vbo(gl, player_mesh_texture_coord);
const player_stage_vbo = create_vbo(gl, player_mesh_stage);

function draw_chunks(chunks) {
    for (const c of chunks.values()) {
        set_attribute(gl, {
            "position": c.position_vbo,
            "color": c.color_vbo,
            "texture_coord": c.texture_coord_vbo,
            "stage": c.stage_vbo
        }, attribute_locations, attribute_strides);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);
        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);

        gl.drawElements(gl.TRIANGLES, c.index_count, gl.UNSIGNED_SHORT, 0);
    }
}

function draw_players(players, id) {
    set_attribute(gl, {
        "position": player_position_vbo,
        "color": player_color_vbo,
        "texture_coord": player_texture_coord_vbo,
        "stage": player_stage_vbo
    }, attribute_locations, attribute_strides);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, player_ibo);

    for (const p of players) {
        if (p.id === id) {
            continue;
        }
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y, p.pos.z);
        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, player_index_count, gl.UNSIGNED_SHORT, 0);
    }
}

export function draw(pos, rot, FOV, chunks, players, id) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.identity(m_matrix);
    Mat4.identity(v_matrix);
    Mat4.identity(p_matrix);
    Mat4.identity(mvp_matrix);

    const center = rotate_vector_XYZ({ x: 0, y: 0, z: 1 }, { x: deg2rad(rot.x), y: deg2rad(rot.y), z: deg2rad(rot.z) });
    const up = rotate_vector_XYZ({ x: 0, y: 1, z: 0 }, { x: deg2rad(rot.x), y: deg2rad(rot.y), z: deg2rad(rot.z) });

    Mat4.lookAt(v_matrix, [pos.x, pos.y + 1.6, pos.z], [pos.x + center.x, pos.y + 1.6 + center.y, pos.z + center.z], [up.x, up.y, up.z]);
    Mat4.perspective(p_matrix, deg2rad(FOV), canvas.width / canvas.height, 0.01, 1000);

    draw_chunks(chunks);
    draw_players(players, id);
}