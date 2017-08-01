// sample generators

function* generator(param) {
  yield 42;

  var returnRes = yield(param);
  return returnRes;
}

var gen = generator(3.1415926535)
var result

setTimeout(() => {
  result = gen.next()
  console.log(result)
  setTimeout(() => {
    result = gen.next()
    console.log(result)
    setTimeout(() => {
      result = gen.next(1.618)
      console.log(result)
    }, 1000)
  }, 1000)
}, 1000)

function* foo() {
  console.log("in foo")
  var c = yield* bar(1.618)
  console.log(c)
}

function* bar(param) {
  console.log("in bar")
  yield param
  return 42
}

var f = foo()

setTimeout(() => {
  f.next()
  setTimeout(() => {
    f.next()
  }, 1000)
}, 1000)