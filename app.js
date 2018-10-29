require('dotenv').config()
const EventSource = require('eventsource')
const Twitter = require('twitter');

// Twitter
var client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});
var send = function(msg) {
  console.log("Posting", msg)
  client.post('statuses/update', {status: msg}, function(error, tweet, response) {
    if (!error) {
      console.log(tweet);
    }
  });
}
module.exports = {
  send: send
}
var query = {
  "v": 3,
  "q": {
    "find": { "out.b0": { "op": 106 } }
  },
  "r": {
    "f": "{ tx: .[0].tx.h, out: (.[0].out[] | select(.b0.op? == 106)) }"
  }
}

// Bitsocket
var b64 = Buffer.from(JSON.stringify(query)).toString("base64")
var bs = new EventSource('https://bitsocket.org/s/'+b64)
bs.onmessage = function(e) {
  let event = JSON.parse(e.data)
  if (event.type === 'mempool') {
    let tx = event.data.tx
    let out = event.data.out
    try {
      if (["6d02", "6d03", "6d0c", "6d10"].includes(out.h1)) {
        // Memo.cash
        if (out.h1 === "6d02") {
          // regular memo. post all
          send(`${out.s2} https://memo.cash/post/${tx}`)
        } else if (out.h1 === "6d03") {
          // reply
          if (/@_opreturn/.test(out.s3)) {
            send(`(Comment) ${out.s3} https://memo.cash/post/${tx}`)
          }
        } else if (out.h1 === "6d0c") {
          // topic
          if (/@_opreturn/.test(out.s3)) {
            send(`(Topic: ${out.s2}) ${out.s3} https://memo.cash/post/${tx}`)
          }
        } else if (out.h1 === '6d10') {
          // poll
          if (/@_opreturn/.test(out.s4)) {
            send(`(Poll) ${out.s4} https://memo.cash/post/${tx}`)
          }
        }
      } else if (out.h1 === "9d01")  {
        // Matter.cash
        send(`(Longform) ${out.s4} https://www.mttr.app/p/${tx}`)
      }
    } catch (e) {
      console.log(e, event.data)
    }
  }
}
