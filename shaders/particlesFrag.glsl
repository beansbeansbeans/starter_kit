precision mediump float;

uniform sampler2D u_positions;

uniform vec2 u_textureSize;

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  vec2 currentPosition = texture2D(u_positions, fragCoord/u_textureSize).xy;

  gl_FragColor = vec4(currentPosition, 0, 0);
}