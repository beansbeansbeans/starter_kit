precision mediump float;

uniform sampler2D u_material;
uniform sampler2D u_particles;
uniform vec2 u_textureSize;

void main() {
  vec4 nextColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec2 fragCoord = gl_FragCoord.xy / u_textureSize;

  if(true) {
  // if(texture2D(u_particles, fragCoord).x > 0.5) {
  // if(false) {
    nextColor = texture2D(u_material, fragCoord);
  }

  gl_FragColor = nextColor;
}