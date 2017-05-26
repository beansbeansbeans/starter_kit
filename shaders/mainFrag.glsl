precision mediump float;

uniform sampler2D u_image;
uniform float u_renderFlag;
varying vec2 v_texCoord;

void main() {
  vec4 currentState = texture2D(u_image, v_texCoord);
  gl_FragColor = currentState;
}