require('dotenv').config()
const Twitter = require('twitter');
const chainfeed = require('chainfeed')
var client = new Twitter({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token_key: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret
});
var send = function(msg) {
  client.post('statuses/update', {status: msg}, function(error, tweet, response) {
    if (!error) {
      console.log(tweet);
    }
  });
}
chainfeed.listen(function(res) {
  res.forEach(function(item) {
    if (item.data) {
      let opcode = Buffer.from(item.data[0].buf.data).toString('hex').toLowerCase()
      if (opcode === '6d02') { // memo post
        if (item.data.length > 1) {
          let msg = Buffer.from(item.data[1].buf.data).toString('utf-8');
          msg = msg.replace(/ @/g, " $")
          msg += (" https://memo.cash/post/" + item.tx.hash)
          send(msg)
        }
      } else if (opcode === '8d02') { // blockpress post
        if (item.data.length > 1) {
          let msg = Buffer.from(item.data[1].buf.data).toString('utf-8');
          msg = msg.replace(/ @/g, " $")
          msg += (" https://www.blockpress.com/posts/" + item.tx.hash)
          send(msg)
        }
      } else if (opcode === '9d01') { // mttr
        if (item.data.length >= 3) {
          let hash = item.tx.hash;
          let url = "https://www.mttr.app/p/" + hash;
          let title = Buffer.from(item.data[3].buf.data).toString('utf-8');
          let msg = "[Longform] " + title + " " + url;
          send(msg)
        }
      }
    }
  })
})
