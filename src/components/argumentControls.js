import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import AttackSelector from './attackSelector'

export default class ArgumentControls extends Component {
  render({ supportive, left, top, attackers, defenders, addDefense, addAttack, concede, text }) {
    let controls = []

    if(supportive) {
      if(defenders.length) {
        controls.push(<button onClick={addDefense}>defend</button>)
      } else {
        controls.push(<div>No options available</div>)
      }
    } else {
      if(attackers.length) {
        controls.push(<button onClick={addAttack}>attack</button>)
      }

      if(concede) {
        controls.push(<button onClick={concede}>concede</button>)
      }

      if(!controls.length) {
        controls.push(<div>No options available</div>)
      }
    }

    return (
      <div style={`left: ${left}px; top: ${top}px`} id="argument-controls">
        <div class="text">{text}</div>
        <div>{controls}</div>
      </div>
    )
  }
}