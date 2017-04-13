// base app that's shared by both dev and prod servers
const express = require('express')
const bodyParser = require('body-parser')
const five = require('johnny-five')
const board = new five.Board({
  repl: false
})

// Arduino related
let ready = false // board ready state
let relay // PWM PIN 11
let servo // PWM PIN 9

// plants storage, in memory
let plants = {}
// sensors storage, in memory, pairs with plants by plant's pin
let sensors = {}

board.on('ready', () => {
  ready = true
  relay = new five.Relay({
    pin: 11,
    type: 'NC'
  })
  relay.off()
  servo = new five.Servo({
    pin: 9,
    center: true
  })
  // Object.keys(plants).forEach((id) => {
  //   plants[id].sensor = new five.Sensor(plants[id].sensor_opt)
  // })
})

const api = express()
api.use(bodyParser.json())
api.use(bodyParser.urlencoded({extended: false}))

api.get('/', (req, res) => {
  console.dir(plants)
  res.json(plants)
})

api.post('/add', (req, res) => {
  if (!ready) {
    return res.status(500).json({
      error: 'Arduino Board Not Ready'
    })
  }
  let data = req.body
  if (!data) {
    return res.status(400).json({
      error: 'Missing Required Plant Information'
    })
  }
  try {
    data.id = data.id.trim()
    if (!data.id) {
      return res.status(400).json({
        error: 'Missing Plant ID'
      })
    }
    if (plants[data.id]) {
      return res.status(400).json({
        error: `Plant ${data.id} already exists`
      })
    }
  } catch (err) {
    console.error(err)
    return res.status(400).json({
      error: 'Malformed Plant ID'
    })
  }
  if (data.position === null || data.position === undefined) {
    return res.status(400).json({
      error: 'Missing Plant Position (Servo Degree)'
    })
  }
  if (!data.sensor_pin) {
    return res.status(400).json({
      error: 'Missing Plant Moisture Sensor PIN'
    })
  }
  if (sensors[data.sensor_pin]) {
    return res.status(400).json({
      error: `Moisture Sensor PIN ${data.sensor_pin} Already Occupied`
    })
  }
  // optional values
  data.water_time = data.water_time || 1500
  data.threshold = data.threshold || 10
  // add sensor information
  let sensor_opt = {
    freq: 1000,
    pin: data.sensor_pin
  }
  try {
    sensors[data.sensor_pin] = new five.Sensor(sensor_opt)
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: `Unable to connect Moisture Sensor On PIN ${data.sensor_pin}`
    })
  }
  // add plants information
  plants[data.id] = data
  return res.json({
    message: `Plant ${data.id} Successfully Added`
  })
})

api.get('/check/:id', (req, res) => {
  let id = req.params.id
  let plant = plants[id]
  if (!plant) {
    return res.status(404).json({
      error: `Plant ID: ${id} Not Found`
    })
  }
  let sensor = sensors[plants[id].sensor_pin]
  if (!sensor) {
    return res.status(500).json({
      error: 'Plant Moisture Sensor Not Ready'
    })
  }
  plant.moisture = sensor.value
  plant.updated = new Date()
  return res.json({
    moisture: plant.moisture,
    updated: plant.updated
  })
})

api.get('/water/:id', (req, res) => {
  let id = req.params.id
  let plant = plants[id]
  if (!plant) {
    return res.status(404).json({
      error: `Plant ID: ${id} Not Found`
    })
  }
  let sensor = sensors[plants[id].sensor_pin]
  if (!sensor) {
    return res.status(500).json({
      error: 'Plant Moisture Sensor Not Ready'
    })
  }
  if (!relay) {
    return res.status(500).json({
      error: 'Pump Relay Not Ready'
    })
  }
  if (!servo) {
    return res.status(500).json({
      error: 'Pump Servo Not Ready'
    })
  }
  console.log(`Before: ${sensor.raw}, ${sensor.analog}, ${sensor.constrained}, ${sensor.value}`)
  if (sensor.value >= plant.threshold) {
    // update server side moisture value
    plant.moisture = sensor.value
    plant.updated = new Date()
    return res.json({
      moisture: plant.moisture,
      updated: plant.updated,
      message: 'Sufficient Moisture, Not Watering'
    })
  }
  servo.to(plant.position)
  setTimeout(() => {
    relay.on()
    setTimeout(() => {
      relay.off()
      servo.center()
      console.log(`After: ${sensor.raw}, ${sensor.analog}, ${sensor.constrained}, ${sensor.value}`)
      // update server side moisture value
      plant.moisture = sensor.value
      plant.updated = new Date()
      return res.json({
        moisture: plant.moisture,
        updated: plant.updated
      })
    }, plant.water_time || 300)
  }, 1000)
})

module.exports = api
