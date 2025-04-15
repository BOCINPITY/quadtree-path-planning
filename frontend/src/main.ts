import './assets/main.css'
import './assets/iconfont/iconfont.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate);

app.use(router)
app.use(VueKonva)
app.use(pinia)
app.mount('#app')
