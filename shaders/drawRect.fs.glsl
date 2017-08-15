#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying float vRenderFlag;
varying vec3 vBarycentricCoord;
varying float vIndex;
varying float vSupports;
varying float vConstraint;
varying float vActiveStatus;
varying float vAnimationElapsed;

float eps = 0.0001;
float f_thickness = 0.01;
float innerBuffer = f_thickness * 4.;
float attackBarThickness = 0.15;

vec4 attackColor = vec4(231./255., 76./255., 60./255., 1.);
vec4 activeColor = vec4(0, 0, 1, 1);

void main() {
  float f_closest_edge = min(vBarycentricCoord.x, min(vBarycentricCoord.y, vBarycentricCoord.z));

  float f_width = fwidth(f_closest_edge);

  float edgeIntensity = smoothstep(f_width, 2. * f_width, f_closest_edge);

  if(abs(f_closest_edge - vBarycentricCoord.y) < eps) { // remove center lines
    edgeIntensity = 1.;
  }

  if(abs(vBarycentricCoord.x - vBarycentricCoord.y) < eps) {
    edgeIntensity = 1.;
  }

  if(vRenderFlag < eps) {
    edgeIntensity = 1.;
  }

  vec4 color = vec4(vec3(1, 1, 1), 1. - edgeIntensity);
  float activeAnimationElapsed = vAnimationElapsed * 2.;

  if(abs(vActiveStatus - 1.) < eps) {
    if(edgeIntensity > eps) {
      if(mod(vIndex, 2.) < eps) {
        if(vBarycentricCoord.x < activeAnimationElapsed) {
          color = activeColor;
        }        
      } else {
        if(vBarycentricCoord.z > 1. - activeAnimationElapsed) {
          color = activeColor;
        }
      }
    }
  } else if(abs(vActiveStatus - 2.) < eps) {
    if(edgeIntensity > eps) {
      if(mod(vIndex, 2.) < eps) {
        if(vBarycentricCoord.x > activeAnimationElapsed) {
          color = activeColor;
        }
      } else {
        if(vBarycentricCoord.z < 1. - activeAnimationElapsed) {
          color = activeColor;
        }
      }
    }
  } else if(vConstraint > eps) {
    if(edgeIntensity > eps) {
      color = vec4(60./255., 231./255., 139./255., 1);
    }
  } else {
    if(vSupports < eps && vRenderFlag > eps) {
      if(mod(vIndex, 2.) < eps) {
        if(vBarycentricCoord.x > (1. - attackBarThickness) && vBarycentricCoord.x < (1. - innerBuffer) && vBarycentricCoord.z > innerBuffer) {
          color = attackColor;
        }    
      } else {
        if(vBarycentricCoord.z < attackBarThickness && vBarycentricCoord.z > innerBuffer && vBarycentricCoord.x < (1. - innerBuffer) && vBarycentricCoord.x > innerBuffer) {
          color = attackColor;
        }
      }    
    }    
  }

  if(color.a < 0.5) {
    discard;
  }

  gl_FragColor = color;
}