import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:3000',
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
        console.error('Unauthorized: Redirecting to login')
        //触发登出逻辑或跳转到登录页
        window.location.href = '/login'
      } else if (status === 403) {
        console.error('Forbidden: Access denied')
      } else if (status === 500) {
        console.error('Server Error: Please try again later')
      }
    } else {
      console.error('Network Error:', error.message)
    }
    return Promise.reject(error)
  },
)

export default request
