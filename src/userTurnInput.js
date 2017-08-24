import { h, render, Component } from 'preact'
import helpers from './helpers/helpers'

export default class UserTurnInput extends Component {
  render({ addAttack, addDefense, submitPosition }) {
    return (
      <div id="user-turn-input">
        <button onClick={() => submitPosition(true)}>agree</button>
        <button onClick={() => submitPosition(false)}>disagree</button>
        <button onClick={addAttack}>attack</button>
        <button onClick={addDefense}>defend</button>
        <button>concede</button>
      </div>
    )
  }
}