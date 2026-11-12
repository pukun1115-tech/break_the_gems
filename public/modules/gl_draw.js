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
    PLAYER_EYE_Y
} from "./config.js";
import {
    cube_mesh_index,
    cube_mesh_index_count,
    cube_mesh_position
} from "./cube_mesh.js";
import {
    player_head_texture_coord,

    player_body_texture_coord_red,
    player_arm_texture_coord_red,
    player_leg_texture_coord_red,

    player_body_texture_coord_blue,
    player_arm_texture_coord_blue,
    player_leg_texture_coord_blue,

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
export const gl_canvas = document.getElementById("gl_canvas");
/** @type {WebGLRenderingContext | null} */
export const gl = gl_canvas.getContext("webgl");
if (gl === null) {
    throw new Error("gl");
}

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CCW);
gl.clearColor(0.5, 0.5, 1.0, 1.0);
gl.clearDepth(1.0);

function resize_gl_canvas(gl) {
    gl_canvas.width = window.innerWidth;
    gl_canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl_canvas.width, gl_canvas.height);
}

window.addEventListener("resize", () => {
    setTimeout(() => {
        resize_gl_canvas(gl);
    }, 10);
});
resize_gl_canvas(gl);

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

function get_leg_angles(id, animation_time) {
    const start_time = animation_time.get(id)?.walking ?? -1;
    if (start_time === -1) {
        return {
            left: 0,
            right: 0
        };
    }

    const speed = 2;
    const max_angle = deg2rad(60);

    const a = performance.now() - start_time;

    const angle = Math.sin((Math.PI * 2 * speed / 1000) * a) * max_angle;

    return {
        left: angle,
        right: -angle
    };
}

function get_arm_angles(id, animation_time) {
    const walk_start_time = animation_time.get(id)?.walking ?? -1;
    const hit_start_time = animation_time.get(id)?.hit ?? -1;
    if (walk_start_time === -1 && hit_start_time === -1) {
        return {
            left: 0,
            right: 0
        };
    }

    const walk_arm_speed = 2;
    const hit_arm_speed = 1;
    const walk_max_angle = deg2rad(30);
    const hit_max_angle = deg2rad(45);
    
    let angle = 0;

    if (walk_start_time !== -1) {
        const walk_a = performance.now() - walk_start_time;
        const walk_angle = Math.sin((Math.PI * 2 * (walk_arm_speed / 1000)) * walk_a) * walk_max_angle;
        angle += walk_angle;
    }
    if (hit_start_time !== -1) {
        const hit_a = performance.now() - hit_start_time;
        const hit_angle = (Math.sin((Math.PI * 2 * (hit_arm_speed / 1000)) * hit_a) + 1) * 0.5 * hit_max_angle;
        angle += hit_angle;
    
    }
    
    return {
        left: -angle,
        right: angle
    };
}

const p_cube_ibo = create_ibo(gl, cube_mesh_index);
const p_cube_position_vbo = create_vbo(gl, cube_mesh_position);
const p_cube_color_vbo = create_vbo(gl, new Float32Array(96).fill(1.0));
const p_cube_stage_vbo = create_vbo(gl, new Float32Array(24).fill(8));

const player_head_texture_coord_vbo = create_vbo(gl, player_head_texture_coord);

const player_body_texture_coord_red_vbo = create_vbo(gl, player_body_texture_coord_red);
const player_arm_texture_coord_red_vbo = create_vbo(gl, player_arm_texture_coord_red);
const player_leg_texture_coord_red_vbo = create_vbo(gl, player_leg_texture_coord_red);

const player_body_texture_coord_blue_vbo = create_vbo(gl, player_body_texture_coord_blue);
const player_arm_texture_coord_blue_vbo = create_vbo(gl, player_arm_texture_coord_blue);
const player_leg_texture_coord_blue_vbo = create_vbo(gl, player_leg_texture_coord_blue);

const m_matrix = Mat4.identity(Mat4.create());
const v_matrix = Mat4.identity(Mat4.create());
const p_matrix = Mat4.identity(Mat4.create());
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

function draw_players(players, id, animation_time) {
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

        //head
        set_attribute(gl, {
            "texture_coord": player_head_texture_coord_vbo
        }, attribute_locations, attribute_strides);

        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));
        Mat4.rotateX(m_matrix, m_matrix, deg2rad(p.rot.x));
        Mat4.translate(m_matrix, m_matrix, 0, PLAYER_MESH_HEAD_Y / 2, 0);

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_HEAD_X, PLAYER_MESH_HEAD_Y, PLAYER_MESH_HEAD_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //body
        set_attribute(gl, {
            "texture_coord": (p.team === "red" ? player_body_texture_coord_red_vbo : player_body_texture_coord_blue_vbo)
        }, attribute_locations, attribute_strides);

        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y / 2, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_BODY_X, PLAYER_MESH_BODY_Y, PLAYER_MESH_BODY_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //arm
        set_attribute(gl, {
            "texture_coord": (p.team === "red" ? player_arm_texture_coord_red_vbo : player_arm_texture_coord_blue_vbo)
        }, attribute_locations, attribute_strides);
        const arm_x_angle = get_arm_angles(p.id, animation_time);

        //left
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));
        Mat4.translate(m_matrix, m_matrix, -PLAYER_MESH_LEG_X - PLAYER_MESH_ARM_X / 2, 0, 0);
        Mat4.rotateX(m_matrix, m_matrix, arm_x_angle.left);
        Mat4.translate(m_matrix, m_matrix, 0, -PLAYER_MESH_ARM_Y / 2, 0);

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_ARM_X, PLAYER_MESH_ARM_Y, PLAYER_MESH_ARM_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);

        //right
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y + PLAYER_MESH_BODY_Y, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));
        Mat4.translate(m_matrix, m_matrix, PLAYER_MESH_LEG_X + PLAYER_MESH_ARM_X / 2, 0, 0);
        Mat4.rotateX(m_matrix, m_matrix, arm_x_angle.right);
        Mat4.translate(m_matrix, m_matrix, 0, -PLAYER_MESH_ARM_Y / 2, 0);

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_ARM_X, PLAYER_MESH_ARM_Y, PLAYER_MESH_ARM_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);


        //leg
        set_attribute(gl, {
            "texture_coord": (p.team === "red" ? player_leg_texture_coord_red_vbo : player_leg_texture_coord_blue_vbo)
        }, attribute_locations, attribute_strides);
        const leg_x_angle = get_leg_angles(p.id, animation_time);

        //left
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));
        Mat4.translate(m_matrix, m_matrix, -PLAYER_MESH_LEG_X / 2, 0, 0);
        Mat4.rotateX(m_matrix, m_matrix, leg_x_angle.left);
        Mat4.translate(m_matrix, m_matrix, 0, -PLAYER_MESH_LEG_Y / 2, 0);

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_LEG_X, PLAYER_MESH_LEG_Y, PLAYER_MESH_LEG_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);

        //right
        Mat4.identity(m_matrix);
        Mat4.translate(m_matrix, m_matrix, p.pos.x, p.pos.y + PLAYER_MESH_LEG_Y, p.pos.z);

        Mat4.rotateY(m_matrix, m_matrix, deg2rad(p.rot.y));
        Mat4.translate(m_matrix, m_matrix, PLAYER_MESH_LEG_X / 2, 0, 0);
        Mat4.rotateX(m_matrix, m_matrix, leg_x_angle.right);
        Mat4.translate(m_matrix, m_matrix, 0, -PLAYER_MESH_LEG_Y / 2, 0);

        Mat4.scale(m_matrix, m_matrix, PLAYER_MESH_LEG_X, PLAYER_MESH_LEG_Y, PLAYER_MESH_LEG_Z);

        Mat4.multiply(mvp_matrix, p_matrix, v_matrix);
        Mat4.multiply(mvp_matrix, mvp_matrix, m_matrix);

        gl.uniformMatrix4fv(uniform_locations["mvp_matrix"], false, mvp_matrix);
        gl.drawElements(gl.TRIANGLES, cube_mesh_index_count, gl.UNSIGNED_SHORT, 0);
    }
}

export function gl_draw(pos, rot, FOV, chunks, players, id, animation_time) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    Mat4.identity(m_matrix);
    Mat4.identity(v_matrix);
    Mat4.identity(p_matrix);
    Mat4.identity(mvp_matrix);

    const center = rotate_vector_XYZ({ x: 0, y: 0, z: 1 }, { x: deg2rad(rot.x), y: deg2rad(rot.y), z: deg2rad(rot.z) });
    const up = rotate_vector_XYZ({ x: 0, y: 1, z: 0 }, { x: deg2rad(rot.x), y: deg2rad(rot.y), z: deg2rad(rot.z) });

    Mat4.lookAt(v_matrix, [pos.x, pos.y + PLAYER_EYE_Y, pos.z], [pos.x + center.x, pos.y + PLAYER_EYE_Y + center.y, pos.z + center.z], [up.x, up.y, up.z]);
    Mat4.perspective(p_matrix, deg2rad(FOV), gl_canvas.width / gl_canvas.height, 0.01, 1000);

    draw_chunks(chunks);
    draw_players(players, id, animation_time);
}
