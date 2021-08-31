import axios from "axios";
import qs from "qs";
import interceptor from "./interceptors";

const axiosObj = axios.create();

axiosObj.interceptors.request.use(function (config) {
  const token = sessionStorage.getItem("token");
  // 在 header 中添加 token 信息
  token && (config.headers.authorization = `Bearer ${token}`);
  return config;
});

axiosObj.interceptors.response.use(
  interceptor.successInterceptor,
  interceptor.errorInterceptor
);

// GET
export const getRequest = (url, params) => {
  return axiosObj({
    method: "get",
    url: `${url}`,
    params,
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false, arrayFormat: "repeat" });
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const getRequestNotInterceptors = (url, params) => {
  return axios({
    method: "get",
    url: `${url}`,
    params,
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false, arrayFormat: "repeat" });
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

// POST
export const postRequest = (url, data) => {
  return axiosObj({
    method: "post",
    url,
    data,
    transformRequest: [
      // eslint-disable-next-line
      function (data) {
        return qs.stringify(data, { indices: false });
      },
    ],
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const postFormRequest = (url, formData) => {
  return axiosObj({
    method: "post",
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const postBodyRequest = (url, data) => {
  return axiosObj({
    method: "post",
    url,
    data,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
};

// PUT
export const putBodyRequest = (url, data) => {
  return axiosObj({
    method: "put",
    url,
    data,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
};

export const putFormRequest = (url, formData) => {
  return axiosObj({
    method: "put",
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const putRequest = (url, params) => {
  return axiosObj({
    method: "put",
    url,
    params,
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false });
    },
  });
};

// DELETE
export const deleteBodyRequest = (url, data) => {
  return axiosObj({
    method: "delete",
    url,
    data,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
};

export const deleteRequest = (url, params) => {
  return axiosObj({
    method: "delete",
    url,
    params,
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false });
    },
  });
};

export const patchBodyRequest = (url, data) => {
  return axiosObj({
    method: "patch",
    url,
    data,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
};

export const patchFormRequest = (url, formData) => {
  return axiosObj({
    method: "patch",
    url,
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const patchRequest = (url, params) => {
  return axiosObj({
    method: "patch",
    url,
    params,
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false });
    },
  });
};

// export file
export const getExportFileRequest = (url, params) => {
  return axiosObj({
    method: "get",
    url,
    params,
    responseType: "blob",
    paramsSerializer: (param) => {
      return qs.stringify(param, { indices: false });
    },
  });
};

export const postExportFileRequest = (url, data) => {
  return axiosObj({
    method: "post",
    url,
    data,
    responseType: "blob",
    headers: {
      "Content-Type": "application/json;charset=utf-8;application/octet-stream",
    },
  });
};
