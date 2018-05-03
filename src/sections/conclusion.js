import { h, render, Component } from 'preact'
import Section from '../hoc/section'

class Conclusion extends Component {
  componentWillMount() {
  }

  render() {
    return (
      <div class="section-contents">
        <p>What's the point?</p>
        <ul>
          <li><p>To not take reported distances between sentences for granted (as shown in the spiral visualization).</p></li>
          <li><p>To not take clustering results for granted (as shown in the distance matrix visualization).</p></li>
          <li><p></p></li>
        </ul>
      </div>
    )
  }
}

Conclusion = Section(Conclusion)

export default Conclusion