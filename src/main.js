import Vue from "vue";
import App from "./App.vue";
import vToolTip from "v-tooltip";

Vue.use(vToolTip)

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
