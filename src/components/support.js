import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import randomModule from '../helpers/random'
const random = randomModule.random(42)

export default class Support extends Component {
  render({ supporters }) {
    let buffer = Math.round(random.nextDouble() * 10)
    return (
      <div class="argument-support">
        <div class="label">Supported by:</div>
        <div class="supporters">{
          supporters.map((s, i) => {
            return <div style={`background-image: url(http://loremflickr.com/60/60?random=${buffer + i})`} class="supporter" onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              console.log(s)
            }}>
            </div>
          })
        }</div>
      </div>
    )
  } 
}