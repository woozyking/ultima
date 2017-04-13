const five = require('johnny-five')
const board = new five.Board()

board.on('ready', () => {
  let relay = new five.Relay({
    pin: 11,
    type: 'NC'
  })
  relay.off()
  board.repl.inject({
    relay
  });
})
