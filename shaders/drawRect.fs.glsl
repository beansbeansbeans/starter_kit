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
varying float vActiveDirection;

float eps = 0.0001;
float f_thickness = 0.02;
float innerBuffer = f_thickness * 4.;
float attackBarThickness = 0.15;

vec4 attackColor = vec4(231./255., 76./255., 60./255., 1.);
vec4 activeColor = vec4(32./255., 87./255., 154./255., 1);

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

  vec4 color = vec4(vec3(51./255., 51./255., 45./255.), 1. - edgeIntensity);
  float activeAnimationElapsed = vAnimationElapsed * 2.;
  float isAttackStrip = 0.;

  if(vSupports < eps && vRenderFlag > eps) {
    if(mod(vIndex, 2.) < eps) {
      if(vBarycentricCoord.x > (1. - attackBarThickness) && vBarycentricCoord.x < (1. - innerBuffer) && vBarycentricCoord.z > innerBuffer) {
        color = attackColor;
        isAttackStrip = 1.;
      }    
    } else {
      if(vBarycentricCoord.z < attackBarThickness && vBarycentricCoord.z > innerBuffer && vBarycentricCoord.x < (1. - innerBuffer) && vBarycentricCoord.x > innerBuffer) {
        color = attackColor;
        isAttackStrip = 1.;
      }
    }    
  }

  if(isAttackStrip < eps) {
    if(abs(vActiveStatus - 1.) < eps) { // fill
      if(edgeIntensity > eps) {
        if(mod(vIndex, 2.) < eps) {
          if(abs(vActiveDirection - 2.) < eps) { // left
            if(vBarycentricCoord.x < activeAnimationElapsed) {
              color = activeColor;
            }                  
          } else if(abs(vActiveDirection - 3.) < eps) { // up
            if(vBarycentricCoord.z < activeAnimationElapsed) {
              color = activeColor;
            }
          } else if(abs(vActiveDirection - 1.) < eps) { // down
            if(vBarycentricCoord.z > 1. - activeAnimationElapsed) {
              color = activeColor;
            }
          } else { // right
            if(vBarycentricCoord.x > 1. - activeAnimationElapsed) {
              color = activeColor;
            } 
          }
        } else {
          if(abs(vActiveDirection - 2.) < eps) { // left
            if(vBarycentricCoord.z > 1. - activeAnimationElapsed) {
              color = activeColor;
            }          
          } else if(abs(vActiveDirection - 3.) < eps) { // up
            if(vBarycentricCoord.x > 1. - activeAnimationElapsed) {
              color = activeColor;
            }
          } else if(abs(vActiveDirection - 1.) < eps) { // down
            if(vBarycentricCoord.x < activeAnimationElapsed) {
              color = activeColor;
            }
          } else { // right
            if(vBarycentricCoord.z < activeAnimationElapsed) {
              color = activeColor;
            } 
          }
        }
      }
    } else if(abs(vActiveStatus - 2.) < eps) { // recede
      if(edgeIntensity > eps) {
        if(mod(vIndex, 2.) < eps) {
          if(abs(vActiveDirection - 2.) < eps) { // left
            if(vBarycentricCoord.x > activeAnimationElapsed) {
              color = activeColor;
            }          
          } else if(abs(vActiveDirection - 3.) < eps) { // up
            if(vBarycentricCoord.z > activeAnimationElapsed) {
              color = activeColor;
            }
          } else if(abs(vActiveDirection - 1.) < eps) { // down
            if(vBarycentricCoord.z < 1. - activeAnimationElapsed) {
              color = activeColor;
            }
          } else { // right
            if(vBarycentricCoord.x < 1. - activeAnimationElapsed) {
              color = activeColor;
            }
          }
        } else {
          if(abs(vActiveDirection - 2.) < eps) { // left
            if(vBarycentricCoord.z < 1. - activeAnimationElapsed) {
              color = activeColor;
            }          
          } else if(abs(vActiveDirection - 3.) < eps) { // up
            if(vBarycentricCoord.x < 1. - activeAnimationElapsed) {
              color = activeColor;
            }
          } else if(abs(vActiveDirection - 1.) < eps) { // down
            if(vBarycentricCoord.x > activeAnimationElapsed) {
              color = activeColor;
            }
          } else { // right
            if(vBarycentricCoord.z > activeAnimationElapsed) {
              color = activeColor;
            } 
          }
        }
      }
    } else if(vConstraint > eps) {
      if(edgeIntensity > eps) {
        color = vec4(60./255., 231./255., 139./255., 1);
      }
    }
  }

  if(color.a < 0.5) {
    discard;
  }

  gl_FragColor = color;
}