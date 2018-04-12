import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional, degreesToRadians, trim } = helpers
import randomModule from '../helpers/random'
const random = randomModule.random(42)
import { getData, getShader } from '../api'

let distances = ['euclidean']
let dimensions = ['100']

let perm = [349, 421, 2, 458, 110, 170, 585, 27, 559, 964, 345, 902, 645, 796, 76, 165, 8, 594, 196, 275, 789, 179, 866, 51, 108, 479, 911, 404, 542, 146, 388, 593, 873, 291, 370, 157, 174, 54, 394, 78, 361, 101, 732, 869, 935, 5, 946, 343, 623, 399, 625, 962, 83, 515, 525, 616, 776, 306, 224, 712, 301, 761, 989, 721, 982, 20, 606, 59, 555, 537, 187, 988, 702, 999, 433, 127, 797, 94, 697, 553, 791, 86, 783, 227, 914, 176, 671, 814, 332, 780, 444, 638, 139, 863, 709, 112, 331, 860, 18, 280, 659, 220, 25, 181, 728, 792, 522, 375, 558, 456, 739, 298, 488, 267, 871, 738, 268, 943, 64, 439, 23, 463, 215, 823, 451, 242, 560, 16, 299, 328, 309, 609, 951, 195, 452, 39, 230, 838, 557, 667, 36, 651, 237, 684, 102, 232, 484, 483, 494, 431, 24, 436, 62, 206, 57, 472, 851, 874, 107, 532, 443, 847, 779, 530, 611, 637, 212, 292, 234, 1, 250, 742, 753, 124, 56, 121, 225, 155, 109, 143, 824, 465, 881, 226, 489, 122, 657, 981, 314, 998, 549, 152, 308, 867, 968, 21, 272, 89, 804, 825, 941, 14, 255, 297, 207, 273, 632, 774, 599, 766, 408, 991, 340, 406, 455, 855, 156, 918, 313, 754, 77, 413, 222, 449, 401, 737, 34, 457, 160, 460, 929, 574, 808, 393, 507, 596, 987, 372, 798, 6, 689, 940, 492, 675, 100, 257, 266, 435, 506, 584, 601, 283, 547, 239, 352, 214, 746, 303, 13, 693, 70, 191, 293, 913, 403, 736, 928, 235, 447, 432, 437, 710, 959, 615, 778, 977, 205, 947, 167, 115, 857, 263, 323, 658, 573, 600, 731, 221, 300, 543, 471, 957, 190, 256, 118, 921, 154, 853, 95, 231, 446, 499, 60, 142, 462, 822, 545, 617, 682, 598, 368, 628, 787, 133, 350, 877, 411, 859, 184, 63, 578, 666, 244, 397, 28, 238, 510, 531, 287, 151, 247, 995, 106, 581, 282, 749, 629, 476, 889, 533, 569, 371, 602, 99, 642, 901, 990, 360, 696, 46, 621, 579, 806, 699, 65, 700, 29, 905, 67, 130, 630, 470, 717, 419, 633, 949, 958, 704, 318, 831, 561, 817, 641, 718, 567, 572, 90, 969, 735, 848, 551, 701, 210, 608, 624, 870, 390, 496, 290, 619, 562, 887, 66, 965, 818, 862, 513, 876, 11, 523, 527, 640, 85, 752, 48, 80, 398, 643, 161, 846, 88, 172, 430, 980, 126, 810, 243, 321, 213, 254, 459, 550, 764, 899, 315, 186, 415, 277, 310, 485, 698, 44, 116, 903, 3, 374, 571, 586, 595, 317, 910, 58, 827, 198, 984, 148, 396, 327, 775, 683, 743, 544, 552, 412, 541, 97, 771, 438, 644, 144, 994, 286, 646, 294, 931, 576, 604, 777, 166, 748, 50, 147, 685, 786, 885, 973, 809, 359, 801, 713, 715, 612, 192, 556, 740, 923, 354, 665, 852, 159, 248, 597, 158, 650, 793, 92, 316, 934, 185, 383, 429, 365, 407, 524, 35, 336, 500, 536, 919, 618, 807, 856, 461, 836, 26, 178, 175, 505, 679, 367, 589, 424, 894, 486, 842, 922, 676, 744, 409, 729, 719, 410, 649, 188, 511, 723, 788, 373, 840, 125, 284, 502, 9, 344, 944, 153, 554, 43, 893, 908, 177, 425, 91, 875, 504, 765, 38, 985, 490, 627, 30, 37, 322, 972, 319, 805, 639, 648, 12, 582, 820, 967, 274, 440, 828, 376, 467, 993, 271, 31, 245, 563, 68, 939, 747, 464, 216, 288, 474, 832, 150, 535, 538, 180, 548, 716, 357, 128, 884, 304, 660, 71, 487, 566, 673, 568, 74, 269, 926, 945, 784, 916, 211, 858, 714, 114, 171, 760, 120, 427, 448, 362, 422, 539, 33, 512, 694, 915, 750, 758, 904, 932, 82, 217, 528, 202, 162, 722, 138, 580, 140, 588, 42, 384, 454, 279, 22, 469, 346, 896, 466, 906, 382, 529, 925, 132, 812, 145, 733, 193, 289, 844, 498, 897, 52, 98, 815, 356, 402, 707, 386, 241, 329, 794, 521, 892, 17, 854, 40, 664, 849, 19, 338, 223, 952, 575, 686, 296, 795, 363, 391, 339, 473, 837, 785, 880, 49, 353, 387, 197, 53, 445, 607, 841, 414, 655, 564, 209, 950, 811, 395, 691, 966, 302, 540, 131, 755, 103, 520, 278, 389, 757, 119, 137, 45, 73, 800, 334, 727, 942, 610, 835, 240, 311, 218, 570, 816, 423, 879, 626, 813, 10, 15, 861, 692, 878, 325, 767, 654, 590, 830, 546, 680, 183, 312, 900, 517, 850, 358, 865, 480, 516, 169, 909, 882, 87, 163, 96, 111, 839, 803, 971, 385, 819, 55, 93, 134, 954, 434, 613, 833, 653, 369, 378, 501, 672, 84, 265, 670, 703, 756, 636, 246, 688, 933, 652, 252, 333, 199, 149, 330, 104, 117, 519, 668, 335, 577, 927, 81, 565, 380, 503, 203, 912, 634, 983, 392, 441, 656, 526, 204, 135, 509, 342, 978, 996, 883, 307, 276, 497, 320, 868, 324, 453, 129, 428, 997, 182, 960, 514, 979, 168, 726, 986, 261, 381, 493, 228, 956, 285, 924, 416, 843, 417, 475, 745, 769, 281, 592, 47, 591, 270, 938, 405, 890, 937, 233, 420, 7, 249, 976, 468, 826, 41, 799, 0, 620, 253, 400, 614, 200, 895, 189, 677, 32, 113, 953, 141, 208, 647, 678, 364, 631, 366, 674, 326, 705, 690, 341, 741, 622, 79, 872, 955, 260, 864, 259, 379, 963, 891, 898, 355, 491, 442, 763, 782, 845, 4, 834, 706, 720, 773, 450, 724, 711, 920, 72, 164, 61, 348, 770, 821, 605, 992, 948, 229, 534, 583, 802, 930, 975, 518, 105, 663, 482, 695, 219, 262, 917, 377, 886, 907, 251, 974, 635, 961, 69, 236, 123, 603, 730, 790, 347, 687, 173, 481, 662, 768, 772, 508, 495, 708, 478, 194, 829, 258, 759, 136, 762, 781, 477, 587, 295, 669, 337, 661, 201, 734, 936, 264, 418, 681, 888, 75, 970, 351, 725, 426, 305, 751]

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