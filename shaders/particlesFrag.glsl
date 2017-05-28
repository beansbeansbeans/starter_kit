precision mediump float;

uniform sampler2D u_particles;

uniform vec2 u_textureSize;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  vec2 current = texture2D(u_particles, fragCoord/u_textureSize).xy;

  gl_FragColor = vec4(current, 0, 0);
}