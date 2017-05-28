precision mediump float;

uniform sampler2D u_particles;

uniform vec2 u_textureSize;

float eps = 0.0001;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  float nextDir = rand(fragCoord);

  if(nextDir < 1./8.) {
    nextDir = 1.;
  } else if(nextDir < 2./8.) {
    nextDir = 2.;
  } else if(nextDir < 3./8.) {
    nextDir = 3.;
  } else if(nextDir < 4./8.) {
    nextDir = 4.;
  } else if(nextDir < 5./8.) {
    nextDir = 5.;
  } else if(nextDir < 6./8.) {
    nextDir = 6.;
  } else if(nextDir < 7./8.) {
    nextDir = 7.;
  } else {
    nextDir = 8.;
  }

  float current = 0.;

  float left = fragCoord.x - 1.;
  float right = fragCoord.x + 1.;
  float above = fragCoord.y + 1.;
  float below = fragCoord.y - 1.;
  
  if(left < 0.) {
    left = u_textureSize.x;
  }
  if(right > u_textureSize.x) {
    right = 0.;
  }
  if(above < 0.) {
    above = u_textureSize.y;
  }
  if(above > u_textureSize.y) {
    above = 0.;
  }

  vec4 w = texture2D(u_particles, vec2(left, fragCoord.y) / u_textureSize);
  vec4 nw = texture2D(u_particles, vec2(left, above) / u_textureSize);
  vec4 n = texture2D(u_particles, vec2(fragCoord.x, above) / u_textureSize);
  vec4 ne = texture2D(u_particles, vec2(right, above) / u_textureSize);
  vec4 e = texture2D(u_particles, vec2(right, fragCoord.y) / u_textureSize);
  vec4 se = texture2D(u_particles, vec2(right, below) / u_textureSize);
  vec4 s = texture2D(u_particles, vec2(fragCoord.x, below) / u_textureSize);
  vec4 sw = texture2D(u_particles, vec2(left, below) / u_textureSize);

  if(abs(w.y - 4.) < eps) {
    current = w.x;
  } else if(abs(nw.y - 5.) < eps) {
    current = nw.x;
  } else if(abs(n.y - 6.) < eps) {
    current = n.x;
  } else if(abs(ne.y - 7.) < eps) {
    current = ne.x;
  } else if(abs(e.y - 8.) < eps) {
    current = e.x;
  } else if(abs(se.y - 1.) < eps) {
    current = se.x;
  } else if(abs(s.y - 2.) < eps) {
    current = s.x;
  } else if(abs(sw.y - 3.) < eps) {
    current = sw.x;
  }

  if(abs(current - 0.) < eps) {
    nextDir = 0.;
  }

  gl_FragColor = vec4(current, nextDir, 0, 0);
}