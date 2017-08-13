precision mediump float;
attribute float corner;

uniform mat4 projection, view;
uniform vec2 mousePosition;
uniform vec2 canvasRect;
uniform float rectWidth, animationLength, bufferSize, nextRectWidth, frame, extrusionFrame;

attribute vec3 color;
attribute float lastExtrusion;
attribute float currentExtrusion;
attribute float lastTop;
attribute float lastLeft;
attribute float lastHeight;
attribute float currentTop;
attribute float currentLeft;
attribute float currentHeight;
attribute float index;
attribute float supports;

varying vec3 vColor;
varying vec4 vCoord;

float eps = 0.0001;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float ease(float b, float next, float frameType) {
  float t = min(animationLength, frameType);
  float d = animationLength;
  float c = next - b;

  // ease out - http://gizma.com/easing/
  t /= d;
  return -c * t*(t-2.) + b;
}

vec2 interp(vec2 cur, vec2 next) {
  return vec2(
    ease(-(canvasRect.x / 2.) + cur.x, -(canvasRect.x / 2.) + next.x, frame),
    ease(-(-(canvasRect.y / 2.) + cur.y), -(-(canvasRect.y / 2.) + next.y), frame));
}

void main() {
  float curLeft = lastLeft;
  float curTop = lastTop;

  if(index > eps) {
    if(lastLeft < eps && lastTop < eps && lastHeight < eps) {
      curLeft = currentLeft;
      curTop = currentTop;
    }
  }

  vec2 pos = vec2(curLeft, curTop);
  vec2 nextPos = vec2(currentLeft, currentTop);

  vec2 topLeft = vec2(pos.x, pos.y + lastHeight - bufferSize);
  vec2 nextTopLeft = vec2(nextPos.x, nextPos.y + currentHeight - bufferSize);
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
        vec2(pos.x + rectWidth - bufferSize, pos.y + lastHeight - bufferSize),
        vec2(nextPos.x + nextRectWidth - bufferSize, nextPos.y + currentHeight - bufferSize));
    } else {
      interpolatedPos = interp(pos, nextPos);
    }
  } else {
    interpolatedPos = interpolatedBR;
  }

  float extrusion = ease(lastExtrusion, currentExtrusion, extrusionFrame);

  gl_Position = projection * view * vec4(interpolatedPos, extrusion, 1);

  if(supports > 0.) {
    vColor = vec3(1);
  } else {
    vColor = vec3(203./255., 194./255., 187./255.);
  }

  // lastTop lastLeft position, bottom right position
  // vCoord = vec4(interpolatedPos.x, interpolatedPos.y, );
}