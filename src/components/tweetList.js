import preact from 'preact'
let { h, render, Component } = preact
import sharedState from '../sharedState'

export default class TweetList extends Component {
  // state = {
  //   entering: true,
  //   exiting: false
  // }

  componentDidMount() {

  }

  render({ tweets }, { }) {
    return (
      <div class="tweets-container">
        {tweets.map(t =>
          <div class="tweet">{t.tweet}</div>)}
      </div>
    )
  }
}