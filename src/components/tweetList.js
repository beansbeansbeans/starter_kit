import preact from 'preact'
let { h, render, Component } = preact
import sharedState from '../sharedState'

export default class TweetList extends Component {
  componentDidMount() {

  }

  render({ clickTweet, tweets }, { }) {
    return (
      <div class="tweets-container">
        {tweets.map(t =>
          <div 
            data-active={t.active}
            onClick={() => clickTweet(t._id)}
            class="tweet">
            <div class="text">{t.tweet}</div>
            <div class="attribution">
              <div class="author">{`@${t.author_screen_name}`}</div>
              <div class="time">{t.time.substring(0, 10)}</div>
            </div>
          </div>)}
      </div>
    )
  }
}