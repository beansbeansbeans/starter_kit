precision mediump float;
attribute vec2 position;

uniform mat4 projection, view;

// These are instanced attributes.
attribute vec3 color;
attribute vec2 offset;
attribute float index;
varying vec3 vColor;

void main() {

  gl_Position = projection * view * vec4(
    offset.x + index * position.x,
    offset.y + index * position.y,
    0, 1);

  vColor = color;
}