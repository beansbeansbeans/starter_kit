// import vec3 from 'gl-vec3'
import randomModule from './random'
const random = randomModule.random(42)

const UINT8_VIEW = new Uint8Array(4),
  FLOAT_VIEW = new Float32Array(UINT8_VIEW.buffer)

const subVectors = (a, b) => {
  let res = []
  for(let i=0; i<a.length; i++) {
    res.push(a[i] - b[i])
  }
  return res
}

const dotProduct = (a, b) => {
  let res = 0
  for(let i=0; i<a.length; i++) {
    res += (a[i] * b[i])
  }
  return res
}

const vectorLength = vec => {
  let res = 0
  for(let i=0; i<vec.length; i++) {
    res += Math.pow(vec[i], 2)
  }
  return Math.sqrt(res)
}

const manhattanLength = vec => {
  let res = 0
  for(let i=0; i<vec.length; i++) {
    res += Math.abs(vec[i])
  }
  return res
}

const fractional = norm => vec => {
  let res = 0

  for(let i=0; i<vec.length; i++) {
    res += Math.pow(Math.abs(vec[i]), norm)
  }

  return Math.pow(res, 1/norm)
}

const pipe = (...fns) => x => fns.reduce((y, f) => f(y), x)

const withConstructor = constructor => o => {
  const proto = Object.assign({},
    Object.getPrototypeOf(o),
    { constructor }
  );
  return Object.assign(Object.create(proto), o);
}

const wrapIterator = (it, fn) => {
  let result

  return function() {
    result = it.next()

    fn(result)
  }
}

const createInterpolator = ticks => (start, finish) => tick => {
  let t = tick
  t /= ticks

  return -(finish - start) * t * (t - 2) + start
}

const viewportToLocal = (width, height) => arr => 
  ([-width/2 + arr[0],
  -(-height/2 + arr[1])])

// function intersectTriangle(
//   out, // output empty array
//   pt, // a single point on the camera ray
//   dir, // direction of the camera
//   tri // the triangle
//   ) {
//   var EPSILON = 0.000001
//   var edge1 = [0, 0, 0]
//   var edge2 = [0, 0, 0]
//   var tvec = [0, 0, 0]
//   var pvec = [0, 0, 0]
//   var qvec = [0, 0, 0]

//   vec3.subtract(edge1, tri[1], tri[0])
//   vec3.subtract(edge2, tri[2], tri[0])

//   vec3.cross(pvec, dir, edge2)
//   var det = vec3.dot(edge1, pvec)

//   if (det < EPSILON) return null
//   vec3.subtract(tvec, pt, tri[0])
//   var u = vec3.dot(tvec, pvec)
//   if (u < 0 || u > det) return null
//   vec3.cross(qvec, tvec, edge1)
//   var v = vec3.dot(dir, qvec)
//   if (v < 0 || u + v > det) return null

//   var t = vec3.dot(edge2, qvec) / det
//   out[0] = pt[0] + t * dir[0]
//   out[1] = pt[1] + t * dir[1]
//   out[2] = pt[2] + t * dir[2]
//   return t
// }

function shuffle(array) {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(random.nextDouble() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

function permute(a, p) {
  var r = [];
  for (var i = 0; i < a.length; ++i)
    r.push(a[p[i]]);
  for (i = 0; i < a.length; ++i)
    a[i] = r[i];

  return a
}

export default {
  trim: function(string) {
    return string.replace(/^\s+|\s+$/gm, '')
  },

  roundDown: function(num, nearestInt) {
    return Math.floor(num / nearestInt) * nearestInt
  },

  radToDegrees: function(rad) {
    return rad * (180 / Math.PI)
  },

  removeDuplicates: function(arr) {
    let clean = []
    for(let i=0; i<arr.length; i++) {
      if(clean.indexOf(arr[i]) === -1) clean.push(arr[i])
    }
    return clean
  },

  vectorLength,

  fractional,

  manhattanLength,

  subVectors,

  dotProduct,

  pipe,

  withConstructor,

  shuffle,

  permute,

  viewportToLocal,

  createInterpolator,

  wrapIterator,

  // intersectTriangle,

  decodeFloat: function(x, y, z, w) {
    UINT8_VIEW[0] = Math.floor(w)
    UINT8_VIEW[1] = Math.floor(z)
    UINT8_VIEW[2] = Math.floor(y)
    UINT8_VIEW[3] = Math.floor(x)
    return FLOAT_VIEW[0]
  },

  bindAll(ctx, fns) {
    fns.forEach(d => {
      ctx[d] = ctx[d].bind(ctx)
    })
  },

  // WEBL HELPERS

  makeTexture: function(gl) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    return texture
  },

  makeFlatArray: function(rgba) {
    const numPixels = rgba.length / 4
    for(let i=0; i<numPixels; i++) {
      rgba[i * 4 + 3] = 1
    }
    return rgba
  },

  makeRandomArray: function(rgba, width, height) {
    const numPixels = rgba.length / 4
    for(let i=0; i<numPixels; i++) {
      rgba[i * 4] = Math.random()
      rgba[i * 4 + 1] = Math.random()
      rgba[i * 4 + 2] = Math.random()
      rgba[i * 4 + 3] = 1
    }
    return rgba
  }
}
