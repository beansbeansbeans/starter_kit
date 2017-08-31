import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import ChildSelector from './childSelector'

export default class ArgumentControls extends Component {
  render({ supportive, left, top, attackers, defenders, addChild, concede, text }) {
    let controls = []

    if(supportive) {
      if(defenders.length) {
        controls.push(<ChildSelector 
          attacking={false}
          options={defenders}
          select={arg => addChild(arg, true)} />)
      } else {
        controls.push(<div>No options available</div>)
      }
    } else {
      if(attackers.length) {
        controls.push(<ChildSelector 
          attacking={true}
          options={attackers}
          select={arg => addChild(arg, false)} />)
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