/*
 * @Author: zequan.wu
 * @Date: 2021-07-06 09:39:44
 * @LastEditors: zequan.wu
 * @LastEditTime: 2021-07-06 09:41:51
 * @Description: file content
 */

import axios from "axios";

export const getRequest = (url, params) => {
  return axios({
    method: "get",
    url,
    params,
  });
};
