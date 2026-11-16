/**
 * @typedef {Object} Vec3
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {string} ID
 */

/**
 * @typedef {Object} Player
 * @property {ID} id
 * @property {number} hp
 * @property {"red" | "blue"} team
 * @property {boolean} crouch
 * @property {Vec3} pos
 * @property {Vec3} rot
 * @property {{ walking: boolean, hit: boolean }} animation
 */

/**
 * @typedef {Object} PlayerInput
 * @property {Record<string, boolean>} key_inputs
 * @property {{ left_click: boolean, right_click: boolean }} mouse_inputs
 */

/**
 * @typedef {Object} PlayerState
 * @property {number} break_time
 * @property {number} break_gem_time
 * @property {number} place_time
 * @property {number} attack_time
 * @property {number} velocity_y
 */

export { };
