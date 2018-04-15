import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean', 'manhattan', 'wasserstein']
let dimensions = ['100']

let perm = [310, 343, 491, 336, 464, 230, 256, 296, 191, 314, 173, 496, 271, 190, 281, 52, 457, 339, 353, 290, 305, 321, 167, 494, 63, 307, 168, 38, 469, 123, 73, 458, 193, 272, 75, 18, 287, 140, 135, 447, 133, 342, 499, 14, 223, 39, 477, 428, 459, 88, 424, 197, 24, 113, 214, 294, 303, 65, 351, 161, 304, 212, 445, 374, 57, 219, 181, 356, 222, 430, 397, 264, 358, 326, 492, 385, 407, 323, 92, 453, 357, 48, 392, 15, 232, 72, 484, 94, 25, 414, 260, 262, 316, 103, 441, 322, 129, 344, 144, 172, 141, 390, 431, 160, 362, 77, 258, 37, 465, 96, 179, 379, 164, 460, 87, 209, 434, 118, 119, 51, 341, 350, 236, 76, 355, 122, 187, 376, 456, 152, 462, 419, 208, 114, 372, 111, 44, 211, 6, 53, 267, 432, 393, 79, 490, 143, 242, 148, 395, 61, 192, 112, 381, 404, 263, 486, 157, 301, 205, 450, 47, 493, 308, 218, 278, 49, 203, 3, 373, 80, 402, 7, 104, 289, 29, 335, 269, 337, 489, 274, 34, 279, 487, 89, 283, 297, 329, 23, 224, 56, 198, 331, 364, 299, 246, 334, 32, 378, 389, 495, 417, 483, 162, 413, 195, 312, 11, 207, 361, 468, 306, 233, 433, 109, 31, 107, 439, 471, 408, 498, 401, 437, 240, 455, 416, 93, 345, 2, 68, 220, 435, 41, 213, 165, 163, 1, 254, 16, 180, 449, 142, 324, 405, 46, 461, 27, 26, 139, 128, 387, 421, 340, 480, 22, 244, 444, 488, 62, 420, 436, 138, 35, 248, 124, 21, 154, 201, 238, 86, 66, 243, 309, 423, 137, 257, 74, 332, 400, 410, 478, 228, 429, 204, 265, 127, 409, 226, 411, 454, 347, 302, 360, 9, 145, 102, 438, 28, 136, 225, 229, 216, 121, 286, 54, 403, 235, 245, 178, 427, 363, 78, 159, 90, 291, 10, 185, 64, 156, 116, 169, 170, 295, 384, 367, 320, 467, 183, 250, 12, 239, 100, 485, 194, 59, 396, 472, 234, 249, 43, 298, 83, 98, 327, 476, 176, 369, 440, 13, 470, 174, 412, 241, 382, 150, 199, 270, 370, 125, 354, 5, 84, 50, 466, 189, 217, 149, 276, 292, 497, 151, 386, 175, 311, 155, 368, 448, 479, 215, 338, 117, 126, 158, 380, 273, 202, 251, 210, 315, 99, 227, 442, 8, 105, 130, 131, 177, 333, 0, 300, 60, 346, 330, 481, 277, 422, 30, 259, 474, 255, 446, 237, 106, 317, 293, 348, 359, 261, 366, 406, 71, 36, 91, 231, 473, 352, 377, 40, 200, 33, 188, 285, 253, 20, 132, 221, 81, 482, 288, 69, 101, 97, 134, 70, 388, 55, 371, 415, 147, 452, 268, 325, 282, 146, 375, 17, 184, 275, 365, 182, 475, 166, 328, 399, 252, 313, 58, 425, 463, 4, 206, 443, 318, 426, 266, 383, 247, 319, 280, 398, 42, 186, 19, 284, 153, 394, 196, 391, 45, 115, 108, 349, 85, 418, 451, 171, 67, 82, 110, 95, 120]

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

    let data = {}, max = {}

    distances.forEach(d => {
      data[d] = {}
      max[d] = {}
      dimensions.forEach(dim => {
        data[d][dim] = null
        max[d][dim] = 0
      })
    })

    this.setState({
      max,
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
      let max = this.state.max

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
          distances.forEach((d, i) => {
            dimensions.forEach((dim, dimi) => {
              let val = resp[i * dimensions.length + dimi][key][targetKeys[j]]

              if(val > max[d][dim]) max[d][dim] = val
            })
          })
        }
      }

      max.wasserstein['100'] = 0.025

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
    let activeMax = max[activeDistance][activeDim]

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

          this.ctx.fillStyle = `rgba(0, 0, 0, ${1 - (val / activeMax)})`
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