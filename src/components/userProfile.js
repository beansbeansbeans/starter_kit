import { h, render, Component } from 'preact'
import helpers from '../helpers/helpers'
import randomModule from '../helpers/random'
const random = randomModule.random(42)

export default class UserProfile extends Component {
  render({ back }) {
    return (
      <div id="user-profile">
        <button onClick={back}>Back</button>
        <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/100/100)`} class="avatar main"></div>
        <div class="name">John</div>
        <div class="similarity-list">
          <div class="label">Most similar to:</div>
          <div class="items">
            <div class="user">
              <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=1)`}  class="avatar"></div>
              <div class="description">Joe <span>(6 common nodes)</span></div>
            </div>
            <div class="user">
              <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=2)`}  class="avatar"></div>
              <div class="description">Mary <span>(5)</span></div>
            </div>
            <div class="user">
              <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=3)`}  class="avatar"></div>
              <div class="description">Jane <span>(5)</span></div>
            </div>
            <div class="user">
              <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=4)`}  class="avatar"></div>
              <div class="description">Sue <span>(3)</span></div>
            </div>
            <div class="user">
              <div style={`background-color: rgb(${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}, ${Math.round(random.nextDouble() * 255)}); background-image: url(http://loremflickr.com/60/60?random=5)`}  class="avatar"></div>
              <div class="description">Ellen <span>(2)</span></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}