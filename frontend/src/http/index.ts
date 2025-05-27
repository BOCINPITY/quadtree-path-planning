import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 从环境变量读取 baseURL
  timeout: 10000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 在请求发送之前做一些处理，比如添加认证 token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers['authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    // 处理请求错误
    return Promise.reject(error)
  },
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 处理响应数据
    return response
  },
  (error) => {
    // 处理响应错误
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        ElMessage.error('未授权，请登录')
        window.location.href = '/login'
      } else if (status === 403) {
        //表明未登录
        window.location.href = '/login'
        //清空localStorage
        localStorage.clear()
        ElMessage.error('没有权限访问该资源,请登录')
      } else if (status === 500) {
        ElMessage.error('服务端错误，请稍后再试')
      }else if (status === 400) {
        ElMessage.error(error.response.data.message)
      }else if (status === 404) {
        ElMessage.error('请求的资源未找到')
      }
    } else {
      console.error('网络错误', error.message)
      ElMessage.error('网络错误，请检查您的网络连接')
    }
    return Promise.reject(error)
  },
)

export default request
