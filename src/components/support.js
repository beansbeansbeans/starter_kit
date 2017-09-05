import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import randomModule from '../helpers/random'
const random = randomModule.random(42)

export default class Support extends Component {
  render({ supporters, clickUser }) {
    let buffer = Math.round(random.nextDouble() * 10)
    return (
      <div class="argument-support">
        <div class="label">Supported by:</div>
        <div class="supporters">{
          supporters.map((s, i) => {
            return <div 
              style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=${buffer + i})`} class="supporter" onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              clickUser(s)
            }}>
            </div>
          })
        }</div>
      </div>
    )
  } 
}