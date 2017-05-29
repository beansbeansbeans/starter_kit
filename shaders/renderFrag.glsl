precision mediump float;

uniform sampler2D u_particles;
uniform vec2 u_textureSize;
varying vec2 v_texCoord;
varying vec2 v_debugCoord;

void main() {
  vec4 nextColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec2 fragCoord = gl_FragCoord.xy / u_textureSize;
  float flag = texture2D(u_particles, v_texCoord).x;

  if(flag > 0.) {
    nextColor = vec4(1.0, 0., 0., 1.0);
  } else if(flag < 0.) {
    nextColor = vec4(0., 0., 1.0, 1.0);
  }

  gl_FragColor = nextColor;
}