const UINT8_VIEW = new Uint8Array(4),
  FLOAT_VIEW = new Float32Array(UINT8_VIEW.buffer)

export default {
  trim: function(string) {
    return string.replace(/^\s+|\s+$/gm, '')
  },

  roundDown: function(num, nearestInt) {
    return Math.floor(num / nearestInt) * nearestInt
  },

  decodeFloat: function(x, y, z, w) {
    UINT8_VIEW[0] = Math.floor(w)
    UINT8_VIEW[1] = Math.floor(z)
    UINT8_VIEW[2] = Math.floor(y)
    UINT8_VIEW[3] = Math.floor(x)
    return FLOAT_VIEW[0]
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
    for(let x = width/2 - 100; x < width / 2 + 100; x++) {
      for(let y = height / 2 - 100; y < height / 2 + 100; y++) {
        var ii = (y * width + x) * 4
      }
    }
    return rgba
  }
}
