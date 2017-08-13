import mat4 from 'gl-mat4'
import normals from 'angle-normals'
import sphere from 'primitive-icosphere'
import perlin from 'noisejs'
import reindex from 'mesh-reindex'
import unindex from 'unindex-mesh'
import reglImport from 'regl'

window.context = {
  count: 0,
  batchId: 0,
  deltaTime: 0,
  time: 0,
  viewportWidth: window.innerWidth,
  viewportHeight: window.innerHeight,
  drawingBufferWidth: window.innerWidth,
  drawingBufferHeight: window.innerHeight
}

export default function Splash () {
  var canvas = document.createElement('canvas')
  canvas.id = 'splash'

  function fit () {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  fit()

  window.addEventListener('resize', fit, false)

  window.regl = reglImport(canvas)  

  var mesh = sphere(7, {
    subdivisions: 3
  })
  var uvs = mesh.uvs
  var ns = mesh.normals

  mesh = reindex(unindex(mesh.positions, mesh.cells))
  mesh.uvs = uvs
  mesh.normals = ns

  var n = new perlin.Noise(Math.random())
  var dx = []
  var rnd
 
  for (var x = 0; x < 200; x++) {
    dx[x] = []
    for (var y = 0; y < 200; y++) {
      rnd = n.simplex2((x + 1) / 2, (y + 1) / 2)
      dx[x][y] = [rnd * 255, rnd * 255, rnd * 255]
    }
  }

  var uniforms = {
    color: [1, 0, 0, 1],
    model: mat4.scale(mat4.identity([]), mat4.identity([]), [2, 1, 2]),
    view: function (props) {
      var t = 0.005 * context.count / 2
      return mat4.lookAt([],
        [30 * Math.cos(t), 5, 30 * Math.sin(t)],
        [0, 2.5, 0],
        [0, 1, 0])
    },
    projection: function (props) {
      return mat4.perspective([],
        Math.PI / 4,
        context.viewportWidth / context.viewportHeight,
        0.01,
        1000)
    },
    time: function (props) {
      return context.count / 2
    },
    displacement: regl.texture(dx)
  }

  window.drawOutline = regl({
    frag: `
    precision highp float;
    uniform vec4 color;
    uniform float time;
    varying vec2 vuv;
    varying vec3 vposition;
    
    void main () {
      gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
    }`,

    vert: `
    precision highp float;
    uniform mat4 projection;
    uniform mat4 model;
    uniform mat4 view;
    uniform sampler2D displacement;
    uniform float time;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    varying vec2 vuv;
    varying vec3 vposition;
    void main () {
      vuv = uv;
      vposition = position;
      vec3 displaced = position + normal * texture2D(displacement, uv).rgb * abs(sin(0.005 * time) * 5.0);
      displaced = displaced - normal * 0.04;
      gl_Position = projection * view * model * vec4(displaced, 1.0);
    }`,

    attributes: {
      position: regl.buffer(mesh.positions.slice(0, 1000)),
      normal: regl.buffer(normals(mesh.cells, mesh.positions)),
      uv: regl.buffer(mesh.uvs)
    },

    elements: regl.elements(mesh.cells),

    primitive: 'triangles',

    uniforms: uniforms,

    count: 799
  })

  window.drawTriangles = regl({
    frag: `
    precision highp float;
    uniform vec4 color;
    uniform float time;
    varying vec2 vuv;
    varying vec3 vposition;
    varying vec3 vnormal;
    vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
      return a + b*cos( 6.28318*(c*t+d) );
    }
    void main () {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = abs(vnormal);
      vec3 d = (0.05 * abs(vposition));
      gl_FragColor = vec4(palette(sin(0.005 * time + 0.5), a, d, b, c), 1.0) * 1.0;
    }`,

    vert: `
    precision highp float;
    uniform mat4 projection;
    uniform mat4 model;
    uniform mat4 view;
    uniform sampler2D displacement;
    uniform float time;
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    varying vec2 vuv;
    varying vec3 vposition;
    varying vec3 vnormal;
    void main () {
      vuv = uv;
      vposition = position;
      vnormal = normal;
      vec3 displaced = position + normal * texture2D(displacement, uv).rgb * abs(sin(0.005 * time) * 5.0);
      gl_Position = projection * view * model * vec4(displaced, 1.0);
    }`,

    attributes: {
      position: regl.buffer(mesh.positions.slice(0, 1000)),
      normal: regl.buffer(normals(mesh.cells, mesh.positions)),
      uv: regl.buffer(mesh.uvs)
    },

    elements: regl.elements(mesh.cells),

    primitive: 'triangles',

    uniforms: uniforms,

    count: 799
  })

  return canvas
}