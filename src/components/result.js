import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'

export default class Result extends Component {
  render({ userWon, rootWarranted, rootText }) {
    return (
      <div id="result">
        <div class="main">{userWon ? 'You win.' : 'The computer wins.'}</div>
        <div class="sub">
          <span>It is </span>
          <span>{rootWarranted ? 'TRUE' : 'FALSE'}</span>
          <span>{` that ${rootText}`}</span>
        </div>
      </div>
    )
  }
}