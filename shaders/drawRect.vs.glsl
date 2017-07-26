precision mediump float;
attribute vec2 position;

// These three are instanced attributes.
attribute vec3 color;
attribute vec2 offset;
attribute float angle;
attribute float index;
varying vec3 vColor;
void main() {
  float offsetY = offset.y;

  if(index > 0.) offsetY += 0.1;

  gl_Position = vec4(
    index * (cos(angle) * position.x + sin(angle) * position.y + offset.x),
      index * (-sin(angle) * position.x + cos(angle) * position.y + offsetY), 0, 1);
  vColor = color;
}