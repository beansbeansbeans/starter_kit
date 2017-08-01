precision mediump float;
attribute vec2 position;

uniform mat4 projection, view;
uniform vec2 mousePosition, rect;

// These are instanced attributes.
attribute vec3 color;
attribute vec2 offset;
attribute float index;
attribute float extrusion;
varying vec3 vColor;

void main() {
  float x = offset.x + position.x;
  float y = offset.y + position.y;

  if(index > 0.) {
    if(position.x < 0.0001 && position.y < 0.0001) {
      x = offset.x + rect.x;
      y = offset.y + rect.y;
    }
  }

  gl_Position = projection * view * vec4(
    x, y,
    extrusion + (75. / max(1., distance(offset + rect / 2., mousePosition))),
    1);

  vColor = color;
}