precision mediump float;

uniform sampler2D u_particles;

uniform vec2 u_textureSize;
uniform float u_offset;

float eps = 0.0001;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 onePixel = vec2(1.0, 1.0)/u_textureSize;
  vec2 fragCoord = gl_FragCoord.xy;
  float random = rand(vec2(mod(fragCoord.x + u_offset, u_textureSize.x), fragCoord.y));

  vec4 current = texture2D(u_particles, vec2(fragCoord.x, fragCoord.y) / u_textureSize);
  float newX = current.g;
  float newY = current.b;

  if(random < 1./8.) {
    newX -= onePixel.x;
    newY += onePixel.y;
  } else if(random < 2./8.) {
    newY += onePixel.y;
  } else if(random < 3./8.) {
    newX += onePixel.x;
    newY += onePixel.y;
  } else if(random < 4./8.) {
    newX += onePixel.x;
  } else if(random < 5./8.) {
    newX += onePixel.x;
    newY -= onePixel.y;
  } else if(random < 6./8.) {
    newY -= onePixel.y;
  } else if(random < 7./8.) {
    newX -= onePixel.x;
    newY -= onePixel.y;
  } else {
    newX -= onePixel.x;
  }

  if(newX > 1.) {
    newX = 0.;
  }
  if(newX < 0.) {
    newX = 1.;
  }
  if(newY > 1.) {
    newY = 0.;
  }
  if(newY < 0.) {
    newY = 1.;
  }

  gl_FragColor = vec4(current.r, newX, newY, 0.);
}