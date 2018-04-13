import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean', 'manhattan']
let dimensions = ['100', '50', '10']

let perm = [49, 240, 200, 438, 144, 230, 12, 231, 32, 256, 350, 48, 114, 317, 301, 388, 407, 45, 67, 241, 164, 403, 36, 244, 229, 308, 80, 372, 160, 345, 76, 242, 292, 479, 3, 203, 272, 249, 279, 315, 392, 61, 47, 227, 341, 376, 290, 430, 464, 492, 273, 238, 280, 121, 496, 185, 197, 347, 378, 313, 461, 467, 37, 133, 146, 337, 495, 158, 42, 431, 116, 205, 178, 433, 328, 408, 498, 107, 181, 334, 27, 31, 257, 28, 251, 207, 351, 259, 401, 353, 191, 266, 173, 367, 127, 268, 64, 188, 371, 453, 265, 491, 209, 228, 463, 165, 365, 68, 77, 108, 211, 221, 212, 423, 220, 175, 179, 386, 123, 380, 245, 58, 14, 362, 63, 252, 8, 102, 166, 306, 387, 21, 333, 395, 443, 41, 87, 275, 323, 5, 182, 15, 426, 72, 483, 397, 422, 486, 55, 342, 69, 218, 452, 459, 271, 236, 478, 325, 399, 286, 307, 38, 51, 162, 143, 409, 82, 382, 66, 295, 105, 277, 451, 98, 262, 170, 329, 494, 148, 174, 319, 30, 145, 11, 74, 385, 189, 448, 402, 466, 171, 20, 167, 119, 361, 432, 109, 248, 360, 65, 1, 441, 193, 446, 34, 224, 294, 414, 291, 176, 122, 485, 258, 381, 370, 384, 163, 427, 18, 336, 312, 299, 475, 254, 375, 44, 139, 469, 201, 429, 281, 352, 465, 125, 488, 156, 134, 456, 338, 348, 314, 13, 137, 206, 142, 420, 132, 95, 383, 155, 335, 198, 2, 296, 235, 288, 78, 223, 210, 214, 368, 458, 128, 263, 70, 96, 7, 35, 208, 437, 204, 10, 278, 52, 103, 50, 366, 194, 424, 43, 131, 490, 255, 202, 439, 40, 253, 157, 391, 147, 152, 413, 321, 346, 398, 311, 172, 369, 344, 349, 417, 151, 357, 419, 473, 169, 180, 83, 94, 476, 106, 115, 29, 421, 216, 410, 393, 56, 425, 19, 416, 234, 455, 4, 192, 39, 124, 373, 24, 90, 111, 331, 0, 355, 304, 412, 269, 327, 428, 71, 305, 57, 237, 460, 499, 113, 400, 359, 118, 444, 250, 477, 484, 25, 85, 81, 54, 233, 364, 374, 405, 276, 161, 326, 449, 59, 196, 487, 274, 100, 394, 411, 79, 435, 6, 481, 199, 177, 470, 482, 112, 390, 225, 246, 104, 22, 135, 363, 183, 17, 298, 493, 264, 406, 297, 389, 434, 243, 247, 217, 454, 93, 330, 310, 462, 62, 418, 340, 457, 219, 282, 289, 159, 316, 60, 318, 324, 404, 283, 322, 415, 303, 474, 154, 261, 9, 436, 379, 471, 184, 186, 309, 89, 101, 239, 168, 468, 130, 140, 354, 53, 75, 267, 356, 88, 226, 343, 339, 497, 33, 46, 16, 153, 149, 92, 447, 358, 396, 117, 215, 472, 480, 86, 442, 73, 450, 293, 285, 489, 440, 445, 99, 195, 213, 287, 232, 150, 260, 141, 97, 129, 26, 136, 332, 126, 190, 110, 120, 377, 84, 300, 222, 270, 284, 320, 23, 91, 187, 138, 302]

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

    let data = {}

    distances.forEach(d => {
      data[d] = {}
      dimensions.forEach(dim => {
        data[d][dim] = null
      })
    })

    this.setState({
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
      }),
      data
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

    Promise.all(files.map(getData)).then(resp => {
      console.log(resp)
      let data = this.state.data
      let canvas = document.querySelector("#distance_matrix #canvas")
      this.ctx = canvas.getContext('2d')
      let keys = Object.keys(resp[0])
      let canvasSize = keys.length
      let max = 0

      canvas.width = 2 * canvasSize
      canvas.height = 2 * canvasSize
      canvas.style.width = canvasSize + 'px'
      canvas.style.height = canvasSize + 'px'

      this.ctx.scale(2, 2)

      distances.forEach((d, i) => {
        dimensions.forEach((dim, dimi) => {
          data[d][dim] = resp[i * dimensions.length + dimi]
        })
      })

      for(let i=0; i<keys.length; i++) {
        let key = keys[i]
        let targetKeys = Object.keys(resp[0][key])
        for(let j=0; j<targetKeys.length; j++) {
          let val = resp[0][key][targetKeys[j]]

          if(val > max) max = val
        }
      }

      this.setState({ data, max })
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
    let { data, max, dimensions, distances } = this.state
    let activeDim = dimensions.find(d => d.active).label
    let activeDistance = distances.find(d => d.active).label
    let activeData = data[activeDistance][activeDim]

    if(activeData) {
      let keys = Object.keys(activeData)
      let size = keys.length

      this.ctx.clearRect(0, 0, size, size)

      for(let row=0; row<size; row++) {
        let key = keys[row]
        for(let col=0; col<size; col++) {
          let target = keys[col]

          let val = activeData[key][target]
          if(typeof val === 'undefined') {
            val = activeData[target][key]
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