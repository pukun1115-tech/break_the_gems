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
    cube_mesh_index,
    cube_mesh_index_count,
    cube_mesh_position,

    player_head_texture_coord,
    player_body_texture_coord,
    player_arm_texture_coord,
    player_leg_texture_coord,

    PLAYER_MESH_HEAD_X,
    PLAYER_MESH_HEAD_Y,
    PLAYER_MESH_HEAD_Z,

    PLAYER_MESH_BODY_X,
    PLAYER_MESH_BODY_Y,
    PLAYER_MESH_BODY_Z,

    PLAYER_MESH_ARM_X,
    PLAYER_MESH_ARM_Y,
    PLAYER_MESH_ARM_Z,

    PLAYER_MESH_LEG_X,
    PLAYER_MESH_LEG_Y,
    PLAYER_MESH_LEG_Z,
} from "./player_mesh.js";

/** @type {HTMLCanvasElement} */
export const canvas = document.getElementById("canvas");
/** @type {WebGLRenderingContext | null} */
export const gl = canvas.getContext("webgl");
if (gl === null) {
    throw new Error("gl");
}

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.clearColor(0.5, 0.5, 1.0, 1.0);
gl.clearDepth(1.0);

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

const block_texture = await create_texture(gl, "../images/block_texture.png");
const player_texture = await create_texture(gl, "../images/player_texture.png");
if (block_texture === null || player_texture === null) {
    throw new Error("create_texture");
}
gl.activeTexture(gl.TEXTURE0);
gl.uniform1i(uniform_locations["texture"], 0);

const p_cube_ibo = create_ibo(gl, cube_mesh_index);
const p_cube_position_vbo = create_vbo(gl, cube_mesh_position);
const p_cube_color_vbo = create_vbo(gl, new Float32Array(96).fill(1.0));
const p_cube_stage_vbo = create_vbo(gl, new Float32Array(24).fill(8));

const player_head_texture_coord_vbo = create_vbo(gl, player_head_texture_coord);
const player_body_texture_coord_vbo = create_vbo(gl, player_body_texture_coord);
const player_arm_texture_coord_vbo = create_vbo(gl, player_arm_texture_coord);
const player_leg_texture_coord_vbo = create_vbo(gl, player_leg_texture_coord);

const m_matrix = Mat4.identity(Mat4.create());
const v_matrix = Mat4.identity(Mat4.create());
const p_matrix = Mat4.identity(Mat4.create());
const player_rot_y_matrix = Mat4.identity(Mat4.create());
const mvp_matrix = Mat4.identity(Mat4.create());

function draw_chunks(chunks) {
    gl.bindTexture(gl.TEXTURE_2D, block_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
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
    gl.bindTexture(gl.TEXTURE_2D, player_texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
    set_attribute(gl, {
        "position": p_cube_position_vbo,
        "color": p_cube_color_vbo,
        "stage": p_cube_stage_vbo
    }, attribute_locations, attribute_strides);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p_cube_ibo);

    for (const p of players) {
        if (p.id === id) {
            continue;
        }

        Mat4.identity(player_rot_y_matrix);
        Mat4.rotateY(player_rot_y_matrix, player_rot_y_matrix, deg2rad(p.rot.y));

        //head
        set_attribute(gl, {
            "texture_coord": player_head_texture_coord_vbo
        }, attribute_locations, attribute_strides);

        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y, p.pos.z);
        
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        Mat4.rotateX(m_matrix, m_matrix, deg2rad(p.rot.x));
        Mat4.translate(m_matrix, m_matrix, 0, PLAYER_MESH_HEAD_Y / 2, 0);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_HEAD_X, PLAYER_MESH_HEAD_Y, PLAYER_MESH_HEAD_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //body
        set_attribute(gl, {
            "texture_coord": player_body_texture_coord_vbo
        }, attribute_locations, attribute_strides);

        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y / 2, p.pos.z);
        
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_BODY_X, PLAYER_MESH_BODY_Y, PLAYER_MESH_BODY_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //arm
        set_attribute(gl, {
            "texture_coord": player_arm_texture_coord_vbo
        }, attribute_locations, attribute_strides);

        //left
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y - PLAYER_MESH_ARM_Y / 2, p.pos.z);
       
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        Mat4.translate(m_matrix, m_matrix, -PLAYER_MESH_LEG_X - PLAYER_MESH_ARM_X / 2, 0, 0);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_ARM_X, PLAYER_MESH_ARM_Y, PLAYER_MESH_ARM_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);

        //right
        Mat4.identity(m_matrix); 
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y - PLAYER_MESH_ARM_Y / 2, p.pos.z);
       
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        Mat4.translate(m_matrix, m_matrix, PLAYER_MESH_LEG_X + PLAYER_MESH_ARM_X / 2, 0, 0);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_ARM_X, PLAYER_MESH_ARM_Y, PLAYER_MESH_ARM_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //leg
        set_attribute(gl, {
            "texture_coord": player_leg_texture_coord_vbo
        }, attribute_locations, attribute_strides);

        //left
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y / 2, p.pos.z);
       
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        Mat4.translate(m_matrix, m_matrix, -PLAYER_MESH_LEG_X / 2, 0, 0);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_LEG_X, PLAYER_MESH_LEG_Y, PLAYER_MESH_LEG_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);

        //right
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y / 2, p.pos.z);
       
        Mat4.multiply(m_matrix, m_matrix, player_rot_y_matrix);
        Mat4.translate(m_matrix, m_matrix, PLAYER_MESH_LEG_X / 2, 0, 0);
        
        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_LEG_X, PLAYER_MESH_LEG_Y, PLAYER_MESH_LEG_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);
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

    Mat4.lookAt(v_matrix, [pos.x, pos.y + 1.4, pos.z], [pos.x + center.x, pos.y + 1.4 + center.y, pos.z + center.z], [up.x, up.y, up.z]);
    Mat4.perspective(p_matrix, deg2rad(FOV), canvas.width / canvas.height, 0.01, 1000);

    draw_chunks(chunks);
    draw_players(players, id);
}
