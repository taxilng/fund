<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style>
html,
body,
#app {
  min-height: 100%;
  margin: 0;
  background: #f6f8fb;
}

html[data-app-theme="dark"],
html[data-app-theme="dark"] body,
html[data-app-theme="dark"] #app {
  background: #0b1220;
}
</style>
