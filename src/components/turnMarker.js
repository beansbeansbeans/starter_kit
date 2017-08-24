import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class TurnMarker extends Component {
  render({ userTurn, computerTurn }) {
    return (
      <div id="turn-marker">
        <div data-active={!!computerTurn} class="player">Computer</div>
        <div data-active={!!userTurn} class="player">You</div>
      </div>
    )
  }
}