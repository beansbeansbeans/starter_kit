precision mediump float;

uniform sampler2D u_particles;
uniform sampler2D u_debugMaterial;
attribute vec2 a_position;
varying vec2 v_texCoord;
varying vec2 v_debugCoord;
uniform vec2 u_textureSize;

void main() {
  v_texCoord = (a_position + 1.) / 2.;
  
  // v_debugCoord = texture2D(u_particles, v_texCoord).yz;
  v_debugCoord = a_position;

  gl_Position = vec4(texture2D(u_particles, v_texCoord).yz * 2. - 1., 0, 1); 
  gl_PointSize = 1.0;
}