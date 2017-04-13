<template>
  <div id="app">
    <index></index>
  </div>
</template>

<script>
// import Hello from './components/Hello'
import Index from './components/Index'

export default {
  name: 'app',
  components: {
    Index
  }
}
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 14px;
  }
</style>
