import './assets/main.css'
import './assets/iconfont/iconfont.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueKonva from 'vue-konva'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
const app = createApp(App)
const pinia = createPinia()
app.use(ElementPlus, {
  locale: zhCn,
})
pinia.use(piniaPluginPersistedstate);

app.use(router)
app.use(VueKonva)
app.use(pinia)
app.mount('#app')
