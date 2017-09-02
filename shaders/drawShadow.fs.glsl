#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision mediump float;

uniform float iterations, extrusionRange, illuminateSupports, extrusionFrame, solving;

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
varying float vLastIlluminated;

float eps = 0.0001;

vec4 activeBottom = vec4(0./255., 123./255., 179./255., 1);
vec4 activeTop = vec4(216./255., 122./255., 26./255., 1);

void main() {
  vec4 color = vec4(0);

  if(vSelected > eps) {
    color = vec4(255./255., 255./255., 255./255., 1);
  } else if(solving < eps) {
    vec4 nextColor;
    vec4 lastColor;

    if(illuminateSupports > eps) {
      nextColor = vec4(activeBottom.xyz, vIlluminated);
      lastColor = vec4(activeTop.xyz, vLastIlluminated);
    } else {
      nextColor = vec4(activeTop.xyz, vIlluminated);
      lastColor = vec4(activeBottom.xyz, vLastIlluminated);
    }

    color = mix(lastColor, nextColor, min(extrusionFrame / 15., 1.));
  }

  gl_FragColor = color;
}