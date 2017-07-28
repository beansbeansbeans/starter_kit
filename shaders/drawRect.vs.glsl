precision mediump float;
attribute vec2 position;

// These are instanced attributes.
attribute vec3 color;
attribute vec2 offset;
attribute float index;
varying vec3 vColor;

void main() {
  float offsetY = offset.y;
  float offsetX = offset.x;

  if(index < 0.) {
    offsetX += 0.19;
  }

  gl_Position = vec4(
    offsetX + index * position.x,
    offsetY + index * position.y,
    0, 1);

  vColor = color;
}