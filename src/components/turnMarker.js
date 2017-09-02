import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class TurnMarker extends Component {
  render({ userTurn, computerTurn, showResult, userWon }) {
    return (
      <div id="turn-marker">
        <div data-won={showResult && !userWon} data-active={!showResult && !!computerTurn} class="player">Computer</div>
        <div data-won={showResult && userWon} data-active={!showResult && !!userTurn} class="player">You</div>
      </div>
    )
  }
}