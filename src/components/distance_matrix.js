import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean', 'manhattan']
let dimensions = ['100', '50', '10']

let perm = [71, 242, 279, 127, 292, 426, 176, 291, 57, 59, 230, 293, 196, 482, 421, 184, 445, 299, 232, 316, 413, 255, 371, 360, 112, 429, 328, 423, 64, 473, 141, 146, 253, 342, 152, 330, 186, 220, 13, 78, 172, 111, 219, 4, 209, 100, 306, 327, 415, 18, 389, 203, 167, 442, 248, 460, 53, 348, 191, 398, 91, 305, 74, 378, 90, 206, 343, 28, 63, 46, 498, 359, 22, 350, 280, 324, 142, 307, 304, 265, 358, 365, 486, 257, 73, 244, 97, 116, 469, 400, 278, 386, 457, 494, 30, 376, 7, 45, 10, 315, 122, 262, 134, 47, 135, 2, 221, 446, 313, 224, 407, 410, 461, 79, 62, 479, 297, 338, 185, 259, 420, 436, 34, 147, 294, 380, 115, 263, 87, 192, 8, 98, 273, 333, 33, 81, 9, 187, 282, 474, 249, 258, 121, 340, 329, 214, 345, 290, 17, 246, 487, 381, 197, 388, 403, 471, 117, 399, 418, 95, 363, 86, 470, 223, 287, 199, 464, 483, 42, 437, 60, 495, 314, 344, 157, 201, 239, 472, 288, 300, 84, 124, 213, 438, 431, 228, 390, 416, 49, 491, 226, 205, 207, 309, 439, 285, 160, 310, 65, 128, 430, 298, 367, 402, 411, 432, 284, 231, 434, 26, 106, 104, 136, 39, 208, 370, 70, 419, 499, 170, 450, 92, 235, 425, 168, 417, 180, 271, 183, 357, 132, 372, 488, 240, 383, 153, 318, 55, 453, 89, 368, 414, 489, 156, 217, 126, 481, 107, 103, 458, 261, 422, 14, 216, 105, 21, 145, 20, 48, 252, 391, 475, 241, 468, 174, 308, 58, 394, 76, 1, 31, 67, 149, 424, 0, 38, 384, 373, 382, 397, 275, 238, 289, 334, 154, 171, 102, 395, 441, 3, 119, 326, 101, 108, 198, 353, 204, 484, 150, 322, 80, 302, 492, 131, 387, 85, 396, 164, 93, 234, 355, 392, 454, 266, 286, 114, 269, 56, 225, 393, 66, 405, 427, 75, 319, 175, 25, 54, 96, 301, 331, 6, 222, 296, 50, 110, 444, 276, 451, 177, 347, 166, 281, 351, 19, 237, 311, 321, 52, 480, 277, 295, 467, 490, 129, 37, 335, 158, 190, 443, 465, 189, 332, 163, 493, 143, 385, 485, 210, 379, 88, 274, 377, 404, 303, 374, 211, 16, 178, 193, 218, 5, 336, 260, 99, 456, 24, 375, 109, 229, 233, 452, 476, 44, 212, 496, 41, 181, 94, 435, 466, 159, 325, 188, 283, 349, 477, 202, 440, 29, 341, 69, 68, 138, 247, 362, 137, 408, 165, 369, 339, 356, 264, 15, 155, 12, 195, 449, 254, 455, 478, 251, 361, 113, 182, 83, 173, 270, 312, 120, 320, 118, 323, 267, 412, 401, 337, 459, 354, 448, 36, 130, 194, 61, 497, 51, 77, 40, 409, 433, 463, 406, 162, 462, 428, 140, 148, 35, 366, 161, 268, 11, 27, 82, 133, 169, 123, 236, 243, 346, 227, 256, 215, 250, 151, 364, 23, 317, 72, 144, 179, 139, 447, 272, 32, 200, 125, 245, 43, 352]

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