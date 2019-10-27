import request from '@/utils/request'
/**
 *  an api
 * @param {*} data
 */
export const anApi = (data) => request({ url: 'anApi/list', data, contentType: 'application/x-www-form-urlencoded', showLoading: false })