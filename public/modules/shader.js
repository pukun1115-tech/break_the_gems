/** @type {string} */
export const vertex_shader_source = `
    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 texture_coord;
    attribute float stage;

    uniform mat4 mvp_matrix;

    varying vec4 v_color;
    varying vec2 v_texture_coord;
    varying float v_stage;

    void main(void) {
        v_color = color;
        v_texture_coord = texture_coord;
        v_stage = stage;
        gl_Position = mvp_matrix * vec4(position, 1.0);
    }
`;

/** @type {string} */
export const fragment_shader_source = `
    precision mediump float;

    uniform sampler2D texture;

    varying vec4 v_color;
    varying vec2 v_texture_coord;
    varying float v_stage;

    void main(void) {
        vec4 tex_color = texture2D(texture, v_texture_coord);
        float whiteness = clamp((8.0 - v_stage) / 8.0, 0.0, 1.0);
        gl_FragColor = vec4(
            mix(tex_color.rgb, vec3(1.0), whiteness),
            tex_color.a
        );
    }
`;

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} prg
 * @returns {Record<string, number>}
 */
export function get_attribute_locations(gl, prg) {
    return {
        "position": gl.getAttribLocation(prg, "position"),
        "color": gl.getAttribLocation(prg, "color"),
        "texture_coord": gl.getAttribLocation(prg, "texture_coord"),
        "stage": gl.getAttribLocation(prg, "stage")
    };
}

/**
 * @returns {Record<string, number>}
 */
export function get_attribute_strides() {
    return {
        "position": 3,
        "color": 4,
        "texture_coord": 2,
        "stage": 1,
    };
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLProgram} prg
 * @returns {Record<string, number>}
 */
export function get_uniform_locations(gl, prg) {
    return {
        "mvp_matrix": gl.getUniformLocation(prg, "mvp_matrix"),
        "texture": gl.getUniformLocation(prg, "texture"),
    }
}
