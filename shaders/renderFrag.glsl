precision mediump float;

uniform sampler2D u_material;
uniform vec2 u_textureSize;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  vec4 mat = texture2D(u_material, fragCoord/u_textureSize);
  gl_FragColor = mat;
}