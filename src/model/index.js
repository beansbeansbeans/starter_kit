// data generated with function y = ax^3 + bx^2 + cx + d
// learn coefficients

const a = tf.variable(tf.scalar(Math.random()))
const b = tf.variable(tf.scalar(Math.random()))
const c = tf.variable(tf.scalar(Math.random()))
const d = tf.variable(tf.scalar(Math.random()))

function loss(predictions, labels) {
  const meanSquareError = predictions.sub(labels).square().mean()
  return meanSquareError
}

function predict(x) {
  return tf.tidy(() => {
    return a.mul(x.pow(tf.scalar(3)))
      .add(b.mul(x.square()))
      .add(c.mul(x))
      .add(d)
  })
}

function train(xs, ys, numIterations = 75) {
  const learningRate = 0.5
  const optimizer = tf.train.sgd(learningRate)
  
  for(let iter=0; iter<numIterations; iter++) {
    optimizer.minimize(() => {
      const predsYs = predict(xs)
      return loss(predsYs, ys)
    })
  }  
}
