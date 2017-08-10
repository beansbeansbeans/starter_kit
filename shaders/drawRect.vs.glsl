precision mediump float;
attribute float corner;

uniform mat4 projection, view;
uniform vec2 mousePosition;
uniform vec2 canvasRect;
uniform float rectWidth, animationLength, bufferSize, nextRectWidth, frame;

attribute vec3 color;
attribute float extrusion;
attribute float top;
attribute float left;
attribute float height;
attribute float nextTop;
attribute float nextLeft;
attribute float nextHeight;
attribute float index;
attribute float supports;

varying vec3 vColor;
varying vec4 vCoord;

float eps = 0.0001;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float ease(float b, float next) {
  float t = min(animationLength, frame);
  float d = animationLength;
  float c = next - b;

  // ease out - http://gizma.com/easing/
  t /= d;
  return -c * t*(t-2.) + b;
}

vec2 interp(vec2 cur, vec2 next) {
  return vec2(
    ease(-(canvasRect.x / 2.) + cur.x, -(canvasRect.x / 2.) + next.x),
    ease(-(-(canvasRect.y / 2.) + cur.y), -(-(canvasRect.y / 2.) + next.y)));
}

void main() {
  float curLeft = left;
  float curTop = top;

  if(index > eps) {
    if(left < eps && top < eps && height < eps) {
      curLeft = nextLeft;
      curTop = nextTop;
    }
  }

  vec2 pos = vec2(curLeft, curTop);
  vec2 nextPos = vec2(nextLeft, nextTop);

  vec2 topLeft = vec2(pos.x, pos.y + height - bufferSize);
  vec2 nextTopLeft = vec2(nextPos.x, nextPos.y + nextHeight - bufferSize);
  vec2 bottomRight = vec2(pos.x + rectWidth - bufferSize, pos.y);
  vec2 nextBottomRight = vec2(nextPos.x + nextRectWidth - bufferSize, nextPos.y);

  vec2 interpolatedTL = interp(topLeft, nextTopLeft);
  vec2 interpolatedBR = interp(bottomRight, nextBottomRight);

  vec2 interpolatedPos = vec2(0);
  if(abs(corner - 1.) < eps) {
    interpolatedPos = interpolatedTL;
  } else if(abs(corner - 2.) < eps) {
    if(mod(index, 2.) < eps) {
      interpolatedPos = interp(
        vec2(pos.x + rectWidth - bufferSize, pos.y + height - bufferSize),
        vec2(nextPos.x + nextRectWidth - bufferSize, nextPos.y + nextHeight - bufferSize));
    } else {
      interpolatedPos = interp(pos, nextPos);
    }
  } else {
    interpolatedPos = interpolatedBR;
  }

  gl_Position = projection * view * vec4(interpolatedPos, extrusion, 1);

  if(supports > 0.) {
    vColor = vec3(1);
  } else {
    vColor = vec3(203./255., 194./255., 187./255.);
  }

  // top left position, bottom right position
  // vCoord = vec4(interpolatedPos.x, interpolatedPos.y, );
}