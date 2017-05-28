precision mediump float;

uniform sampler2D u_particles;

uniform vec2 u_textureSize;

void main() {
  vec2 fragCoord = vec2(gl_FragCoord.x - 1., gl_FragCoord.y);
  if(fragCoord.x < 0.) {
    fragCoord.x = u_textureSize.x;
  }

  float current = texture2D(u_particles, fragCoord/u_textureSize).x;

  gl_FragColor = vec4(current, 0, 0, 0);
}