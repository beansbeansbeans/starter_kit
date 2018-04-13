import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean']
let dimensions = ['100']

let perm = [456, 405, 472, 467, 5, 209, 194, 322, 177, 419, 221, 338, 391, 399, 448, 127, 162, 190, 371, 403, 133, 324, 401, 427, 93, 247, 272, 294, 493, 51, 400, 15, 237, 320, 143, 255, 219, 260, 252, 311, 126, 473, 161, 410, 290, 426, 444, 47, 178, 463, 462, 474, 443, 96, 189, 188, 442, 458, 198, 101, 168, 61, 131, 361, 358, 445, 135, 298, 384, 295, 421, 465, 7, 160, 54, 422, 179, 490, 152, 84, 344, 452, 43, 407, 441, 279, 437, 22, 77, 83, 17, 278, 73, 78, 109, 359, 81, 107, 343, 102, 92, 104, 241, 86, 267, 226, 310, 218, 253, 259, 340, 428, 232, 418, 38, 205, 35, 151, 95, 197, 307, 191, 485, 4, 297, 113, 346, 395, 370, 396, 106, 424, 63, 280, 234, 254, 342, 171, 59, 224, 11, 203, 120, 146, 117, 208, 65, 417, 94, 313, 412, 12, 238, 285, 469, 98, 277, 57, 85, 114, 376, 281, 274, 369, 122, 164, 282, 367, 119, 366, 261, 323, 72, 425, 97, 123, 286, 64, 111, 293, 377, 115, 468, 300, 326, 353, 29, 284, 41, 105, 319, 222, 328, 165, 121, 257, 200, 354, 23, 488, 225, 139, 416, 236, 231, 339, 229, 429, 447, 16, 159, 228, 374, 393, 82, 148, 223, 220, 337, 404, 34, 275, 87, 184, 129, 349, 244, 268, 141, 351, 174, 478, 211, 287, 40, 206, 239, 318, 362, 332, 382, 33, 288, 470, 124, 138, 330, 283, 134, 309, 415, 163, 312, 172, 185, 210, 182, 299, 345, 233, 271, 263, 266, 305, 433, 89, 269, 136, 19, 333, 169, 262, 10, 144, 397, 214, 157, 481, 166, 435, 492, 336, 482, 475, 381, 431, 409, 430, 479, 408, 6, 296, 137, 486, 258, 302, 140, 489, 248, 451, 128, 3, 53, 132, 251, 459, 496, 48, 414, 180, 301, 476, 364, 446, 130, 37, 240, 383, 91, 235, 28, 32, 215, 471, 480, 315, 45, 350, 60, 69, 317, 420, 341, 13, 380, 2, 100, 213, 355, 499, 90, 406, 27, 245, 88, 487, 46, 390, 24, 112, 36, 145, 176, 207, 273, 306, 25, 80, 291, 348, 56, 494, 125, 192, 149, 464, 216, 394, 455, 183, 335, 58, 436, 70, 212, 329, 250, 357, 50, 325, 373, 175, 246, 413, 454, 249, 402, 42, 74, 30, 156, 196, 227, 392, 327, 110, 242, 75, 334, 49, 356, 26, 388, 365, 292, 372, 153, 483, 256, 243, 423, 66, 461, 8, 379, 142, 378, 62, 167, 316, 434, 450, 116, 453, 9, 150, 363, 155, 303, 31, 264, 457, 173, 304, 1, 14, 76, 439, 466, 321, 495, 331, 181, 386, 491, 67, 389, 497, 201, 186, 308, 477, 21, 154, 276, 199, 52, 265, 230, 498, 217, 438, 68, 187, 314, 360, 20, 195, 270, 368, 204, 484, 71, 347, 0, 385, 44, 108, 352, 99, 193, 39, 398, 79, 103, 460, 170, 387, 147, 158, 411, 18, 432, 440, 202, 375, 118, 449, 55, 289]

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            value={d.id}
            selected={d.active} class="option">{d.label}</option>
        })}
      </select>
    )
  }
}

class DistanceMatrix extends Component {
  constructor(props) {
    super(props)

    this.setState({
      data: null,
      max: 0,
      dimensions: dimensions.map((d, i) => {
        return {
          active: i === 0,
          label: d,
          id: d
        }
      }),
      distances: distances.map((d, i) => {
        return {
          active: i === 0,
          label: d,
          id: d
        }
      })
    })
  }

  componentWillMount() {
    bindAll(this, ['changeDropdown'])

    let files = []

    for(let i=0; i<distances.length; i++) {
      for(let j=0; j<dimensions.length; j++) {
        files.push(`distance_matrix_${distances[i]}_${dimensions[j]}`)
      }
    }

    Promise.all(files.map(getData)).then(data => {
      console.log(data)
      let canvas = document.querySelector("#distance_matrix #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(data[0])
      let canvasSize = keys.length
      let max = 0

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)

      for(let i=0; i<keys.length; i++) {
        let key = keys[i]
        let targetKeys = Object.keys(data[0][key])
        for(let j=0; j<targetKeys.length; j++) {
          let val = data[0][key][targetKeys[j]]

          if(val > max) max = val
        }
      }

      this.setState({ data: data[0], max })
    })
  }

  componentDidMount() {

  }

  changeDropdown(id, key) {
    this.setState({
      [key]: this.state[key].map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    })
  }

  componentDidUpdate() {
    let { data, max } = this.state

    if(data) {
      let keys = Object.keys(data)
      let size = keys.length

      this.ctx.clearRect(0, 0, size, size)

      for(let row=0; row<size; row++) {
        let key = keys[row]
        for(let col=0; col<size; col++) {
          let target = keys[col]

          let val = data[key][target]
          if(typeof val === 'undefined') {
            val = data[target][key]
          }

          if(key === target) {
            val = 0
          }

          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - (val / max)})`
          this.ctx.fillRect(perm.indexOf(col), perm.indexOf(row), 1, 1)
          // this.ctx.fillRect(col, row, 1, 1)
        }
      }
    }
  }

  render({}, {distances, dimensions, data}) {
    return (
      <div id="distance_matrix">
        <Dropdown change={id => this.changeDropdown(id, 'dimensions')} options={dimensions} />
        <Dropdown change={id => this.changeDropdown(id, 'distances')} options={distances} />
        <br/>
        <canvas id="canvas"></canvas>
      </div>
    )
  }
}

export default DistanceMatrix