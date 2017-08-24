import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class ArgumentControls extends Component {
  render({ supportive, left, top, addDefense, addAttack, concede }) {
    let controls = []

    if(supportive) {
      controls.push(<button onClick={addDefense}>defend</button>)
    } else {
      controls.push(<button onClick={addAttack}>attack</button>)
      controls.push(<button onClick={concede}>concede</button>)
    }

    return (
      <div style={`left: ${left}px; top: ${top}px`} id="argument-controls">{controls}</div>
    )
  }
}