#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision mediump float;

uniform float iterations, extrusionRange, illuminateSupports;

varying float vRenderFlag;
varying vec3 vBarycentricCoord;
varying float vIndex;
varying float vSupports;
varying float vActiveStatus;
varying float vAnimationElapsed;
varying float vActiveDirection;
varying float vTimer;
varying float vSelected;
varying float vIlluminated;

float eps = 0.0001;

vec4 activeBottom = vec4(172./255., 207./255., 204./255., 1);
vec4 activeTop = vec4(138./255., 9./255., 23./255., 1);

void main() {
  vec4 color = vec4(0);

  if(vSelected > eps) {
    color = vec4(0, 1, 0, 1);
  } else {
    if(illuminateSupports > eps) {
      color = vec4(activeBottom.xyz, vIlluminated);
    } else {
      color = vec4(activeTop.xyz, vIlluminated);
    }
  }

  gl_FragColor = color;
}