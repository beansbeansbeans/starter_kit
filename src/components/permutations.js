import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
const { roundDown, bindAll, removeDuplicates, wrapIterator, shuffle, subVectors, dotProduct, vectorLength, manhattanLength, permute, fractional } = helpers
import { encodings } from '../config'
import randomModule from '../helpers/random'
const random = randomModule.random(42)

const progressions = ['forwards', 'backwards', 'scrambled']

class Dropdown extends Component {
  render({ options, change }) {
    return (
      <select onChange={e => change(e.target.value)} class="options">
        {options.map(d => {
          return <option 
            value={d.id}
            selected={d.active} class="option">{d.sentence}</option>
        })}
      </select>
    )
  }
}

class Permutations extends Component {
  constructor(props) {
    super(props)

    let sentences = [
      "i'm going to give it a marginal thumbs up. i liked it just enough .",
      "a deliciously nonsensical comedy about a city coming apart at its seams ."
    ]

    this.setState({
      sets: sentences.map((d, i) => {
        let words = d.split(" ")
        let permutationIndices = [[]]
        
        for(let i=0; i<words.length; i++) permutationIndices[0].push(i)

        for(let i=0; i<words.length; i++) {
          let order = permutationIndices[0].slice(0)
          let randomIndex = Math.floor(random.nextDouble() * words.length)
          if(random.nextDouble() < 0.5) {
            order[randomIndex - 1] = order.splice(randomIndex, 1, order[randomIndex - 1])[0]
          } else {
            order[randomIndex + 1] = order.splice(randomIndex, 1, order[randomIndex + 1])[0]
          }

          permutationIndices.unshift(order)
        }

        return {
          sentence: d,
          active: i === 0,
          id: i,
          permutationIndices
        }
      })
    })
  }

  componentWillMount() {
    console.log(encodings)

    bindAll(this, ['changeSentence'])
  }

  changeSentence(id) {
    this.setState({
      sets: this.state.sets.map(d => {
        if(d.id == id) {
          d.active = true
        } else {
          d.active = false
        }

        return d
      })
    })
  }

  getProgression(activeSentence, progression) {
    let items = []
    let words = activeSentence.sentence.split(" ")

    if(progression === 'forwards') {
      for(let i=1; i<=words.length; i++) {
        items.push(words.slice(0, i).join(" "))
      }      
    } else if(progression === 'backwards') {
      for(let i=1; i<=words.length; i++) {
        items.push(words.slice(words.length - i).join(" "))
      }
    } else {
      for(let i=0; i<activeSentence.permutationIndices.length; i++) {
        items.push(permute(words.slice(0), activeSentence.permutationIndices[i]).join(" "))
      }
    }

    return <div>{items.map(d => {
      return <div>{d}</div>
    })}</div>
  }

  render({}, { sets }) {
    let activeSentence = sets.find(d => d.active)

    console.log(activeSentence)

    return (
      <div id="permutations">
        <Dropdown change={id => this.changeSentence(id)} options={sets} />
        <div class="vector"></div>
        <div class="progressions">{progressions.map(p => {
          let label = <div class="label">{p}</div>
          let items = this.getProgression(activeSentence, p)
          return <div class="progression">{[label, items]}</div>
        })}</div>
      </div>
    )
  }
}

export default Permutations