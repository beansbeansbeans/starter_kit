precision mediump float;

uniform vec2 u_textureSize;
uniform sampler2D u_image;
uniform float u_renderFlag;
varying vec2 v_texCoord;

void main() {
  vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
  vec4 currentState = texture2D(u_image, v_texCoord);

  if(u_renderFlag == 1.0) {
    gl_FragColor = currentState;
    return;
  }

  vec4 average = currentState;
  vec4 north = texture2D(u_image, v_texCoord + vec2(0., onePixel.y));
  vec4 south = texture2D(u_image, v_texCoord + vec2(0., onePixel.y * -1.));
  vec4 east = texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.));
  vec4 west = texture2D(u_image, v_texCoord + vec2(onePixel.x * -1., 0.));

  average += north;
  average += south;
  average += east;
  average += west;

  average /= 5.;

  gl_FragColor = average;
}