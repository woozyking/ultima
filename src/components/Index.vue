<template>
  <el-row class="index" :gutter="10" v-loading.fullscreen.lock="loading" element-loading-text="Please wait...">
    <el-col :sm="24" :md="12" :lg="8" v-for="plant in plants" :key="plant.id">
      <el-card>
        <div slot="header" class="clearfix">
          <span style="line-hight: 36px;font-size: 24px;">{{ plant.id }}</span>
          <span style="float: right;">
            <el-button @click="checkPlant(plant.id)">Check Now</el-button>
            <el-button type="primary" @click="waterPlant(plant.id)">Water Now</el-button>
          </span>
        </div>
        <div class="text-center">
          <el-tag type="primary">Plant Position: {{ plant.position }}</el-tag>
          <el-tag type="primary">Sensor PIN: {{ plant.sensor_pin }}</el-tag>
          <el-tag type="primary">Ideal Moisture: {{ plant.threshold }}</el-tag>
        </div>
        <div class="text-center" style="margin-top: 1rem;">
          <el-progress type="circle" :percentage="capMoisture(plant.moisture * 5)"></el-progress>
        </div>
        <div class="text-center" style="margin-top: 1rem;">
          Last Checked
          <span v-text="(new Date(plant.updated)).toISOString()"></span>
        </div>
      </el-card>
    </el-col>
    <el-col :sm="24" :md="12" :lg="8">
      <el-card>
        <el-form ref="form" :model="form" label-width="120px">
          <el-form-item label="Plant ID">
            <el-input v-model="form.id"></el-input>
          </el-form-item>
          <el-form-item label="Plant Position">
            <el-input-number v-model="form.position" :min="0" :max="180"></el-input-number>
          </el-form-item>
          <el-form-item label="Sensor PIN">
            <el-input v-model="form.sensor_pin"></el-input>
          </el-form-item>
          <el-form-item label="Watering Duration">
            <el-input-number v-model="form.water_time" :min="0" :max="1500"></el-input-number>
          </el-form-item>
          <el-form-item label="Ideal Moisture">
            <el-input-number v-model="form.threshold" :min="0" :max="20"></el-input-number>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addPlant" icon="plus">Add</el-button>
            <el-button>Clear</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
    <el-col :sm="24" :md="12" :lg="8">
      <el-card>
        <h4>Debug Info</h4>
        <pre>{{ plants }}</pre>
      </el-card>
    </el-col>
  </el-row>
</template>

<script>
  import axios from 'axios'

  export default {
    name: 'Index',
    data () {
      return {
        loading: false,
        plants: {},
        // new plant form
        form: {
          id: '',
          position: 0,
          sensor_pin: '',
          water_time: 500,
          threshold: 10
        }
      }
    },
    methods: {
      capMoisture (moisture) {
        moisture *= 5
        if (moisture > 100) {
          return 100
        }
        return moisture
      },
      addPlant () {
        axios.post('/api/add', this.form).then((response) => {
          const data = response.data
          if (data.message) {
            this.$notify.info({
              title: 'Information',
              message: data.message
            })
          }
          this.plants[this.form.id] = Object.assign({
            moisture: 0,
            updated: -1
          }, this.form)
          this.form = {
            id: '',
            position: 0,
            sensor_pin: '',
            water_time: 1500,
            threshold: 10
          }
        }).catch((err) => {
          let message = 'Unknown Error'
          if (err.response) {
            message = (err.response.data || {}).error || message
          }
          this.loading = false
          this.$notify.error({
            title: 'Error',
            message
          })
        })
      },
      waterPlant (id) {
        this.loading = true
        axios.get(`/api/water/${id}`).then((response) => {
          const data = response.data
          if (data.message) {
            this.$notify.info({
              title: 'Information',
              message: data.message
            })
          }
          this.plants[id].updated = data.updated
          this.plants[id].moisture = data.moisture
          this.loading = false
        }).catch((err) => {
          let message = 'Unknown Error'
          if (err.response) {
            message = (err.response.data || {}).error || message
          }
          this.loading = false
          this.$notify.error({
            title: 'Error',
            message
          })
        })
      },
      checkPlant (id) {
        this.loading = true
        axios.get(`/api/check/${id}`).then((response) => {
          const data = response.data
          if (data.message) {
            this.$notify.info({
              title: 'Information',
              message: data.message
            })
          }
          this.plants[id].updated = data.updated
          this.plants[id].moisture = data.moisture
          this.loading = false
        }).catch((err) => {
          let message = 'Unknown Error'
          if (err.response) {
            message = (err.response.data || {}).error || message
          }
          this.loading = false
          this.$notify.error({
            title: 'Error',
            message
          })
        })
      },
      getPlants () {
        this.loading = true
        axios.get('/api').then((response) => {
          const data = response.data
          Object.keys(data).forEach((key) => {
            this.plants[key] = Object.assign({
              moisture: 0,
              updated: -1
            }, data[key])
          })
          this.loading = false
        }).catch((err) => {
          let message = 'Unknown Error'
          if (err.response) {
            message = (err.response.data || {}).error || message
          }
          this.loading = false
          this.$notify.error({
            title: 'Error',
            message
          })
        })
      }
    },
    created () {
      this.$nextTick(() => {
        this.getPlants()
      })
    }
  }
</script>

<style>
  .index .el-col {
    border-radius: 4px;
    margin-bottom: .5rem;
  }
  .index .clearfix:before,
  .index .clearfix:after {
    display: table;
    content: "";
  }
  .index .clearfix:after {
    clear: both
  }
  .index .text-center {
    text-align: center;
  }
  small {
    font-size: 80%;
  }
</style>
