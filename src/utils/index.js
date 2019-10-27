import Taro from '@tarojs/taro'
import { HTTP_STATUS } from '../const/status'
import { logError } from './index'

let LOADING = true  //是否加载
export default ({ url = '', method = 'POST', data, contentType = 'application/x-www-form-urlencoded', showLoading = true }) => {
  LOADING = showLoading
  const baseOptions = {
    header: {
      'content-type': contentType,
      'X-Requested-With': 'XMLHttpRequest',
    },
    data,
    url: process.env.baseUrl + url,
    method,
  }
  const JSESSIONID = Taro.getStorageSync('JSESSIONID')
  if (JSESSIONID) {
    baseOptions.header['Cookie'] = `JSESSIONID=${JSESSIONID}`
  }
  //H5页面是怎么头部信息
  if (Taro.getEnv() === 'WEB') {
    baseOptions.credentials = 'include'
    baseOptions.mode = 'cors'
  }
  const interceptor = function (chain) {
    const requestParams = chain.requestParams
    const { method, data, url } = requestParams
    LOADING && Taro.showLoading({
      mask: true,
      title: '加载中...'
    })
    return chain.proceed(requestParams)
      .then(({ statusCode, data }) => {
        LOADING && Taro.hideLoading()
        const code = data.code //数据请求状态码 
        //服务返回状态码
        if (statusCode === HTTP_STATUS.NOT_FOUND) {
          return logError('api', '请求资源不存在')
        } else if (statusCode === HTTP_STATUS.BAD_GATEWAY) {
          return logError('api', '服务端出现了问题')
        } else if (statusCode === HTTP_STATUS.FORBIDDEN) {
          return logError('api', '没有权限访问')
        } else if (statusCode === HTTP_STATUS.SUCCESS) {
          if (code === 405) {//未登录
            Taro.redirectTo({
              url: '/pages/login/index'
            })
            Taro.removeStorageSync('userInfo')
            Taro.removeStorageSync('JSESSIONID')
            Taro.showToast({
              title: '登录信息已过期,请重新登录',
              icon: 'none',
              duration: 2000
            })
            return Promise.reject(data)
          } else if (code === 403) { //未授权
            Taro.showToast({
              title: data.msg,
              icon: 'none',
              duration: 2000
            })
            return Promise.reject(data)
          } else if (code === 500) { //其他错误
            Taro.showToast({
              title: data.msg,
              icon: 'none',
              duration: 2000
            })
            return Promise.reject(data)
          } else {
            return data
          }
        }
      })
  }

  Taro.addInterceptor(interceptor)
  //请求相关信息
  Taro.addInterceptor(Taro.interceptors.logInterceptor)
  //请求超时抛错
  Taro.addInterceptor(Taro.interceptors.timeoutInterceptor)
  return Taro.request(baseOptions)
}