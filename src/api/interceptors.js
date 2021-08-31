import { Message } from "element-ui";

// 请求自定义状态
export const REQUEST_SUCCESS_CODE = 0;
export const AUTH_FAIL_CODE = -1;

import router from "../router/index";

/**
 * @typedef {{
 *    get: BaseSuccessResponseHandler,
 *    post: BaseSuccessResponseHandler,
 *    put: BaseSuccessResponseHandler,
 *    delete: BaseSuccessResponseHandler
 * }} requestMethodHandlers
 */

function isFunction(fn) {
  return Object.prototype.toString.call(fn) === "[object Function]";
}

export class BaseSuccessResponseHandler {
  constructor() {
    this.handlerMap = {};
  }

  /**
   * @description 添加一个指定特殊路径的处理函数，每个特殊路径的处理函数只能有一个
   * @param {string} url 特殊路径
   * @param {function(import("axios").AxiosResponse): any} handler 处理函数，一定要返回一个值给 service 使用
   */
  add(url, handler) {
    this.handlerMap[url] = handler;
  }

  /**
   * @description 移除指定 url 的处理函数
   * @param {string} url 特殊路径
   */
  remove(url) {
    delete this.handlerMap[url];
  }

  /**
   * @description 判断是否添加了指定特殊路径的处理函数
   * @param {string} url 特殊路径
   */
  hasMatchUrl(url) {
    return !!this.handlerMap[url];
  }

  /**
   * @description 根据路径处理对应的情况，如果返回结果 code 验证不正确，将数据转换为类似 AxiosError 的结构直接抛出错误
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  handle(axiosResponse) {
    return this.handlerMap[axiosResponse.config.url](axiosResponse);
  }
}

export class SuccessResponseSpecialDispatcher {
  /**
   * @param {requestMethodHandlers} handlersMap 定义分发请求的去处
   */
  constructor(handlersMap) {
    this.handlersMap = handlersMap;
  }

  /**
   * @description  分发对应 method 的 handler 的 hasMatchUrl 方法
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  hasMatchUrl(axiosResponse) {
    const { url, method } = axiosResponse.config;

    if (!this.handlersMap[method.toLowerCase()]) {
      return false;
    }

    return this.handlersMap[method.toLowerCase()].hasMatchUrl(url);
  }

  /**
   * @description 分发对应 method 的 handler 的 handle 方法
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  handle(axiosResponse) {
    const { method } = axiosResponse.config;
    return this.handlersMap[method.toLowerCase()].handle(axiosResponse);
  }
}

export class ResponseInterceptor {
  /**
   * @param {Object} options 选项对象
   * @param {function(import("axios").AxiosResponse): number} [options.getCode] 自定义如何从 axiosResponse 上获取返回 code
   * @param {function(import("axios").AxiosResponse): string} [options.getMessage] 自定义如何从 axiosResponse 上获取返回的 message
   * @param {function(import("axios").AxiosResponse): any} [options.getData] 自定义如何从 axiosResponse 上获取返回的数据，记得处理 responseType = blob 的情况
   * @param {function(import("axios").AxiosResponse): any} options.successNormal 必传，定义如何处理正常的请求返回，并返回 service 需要的数据
   * @param {SuccessResponseSpecialDispatcher} [options.successSpecialDispatcher] 分发特殊路径处理的 handler 对象的分发器
   * @param {function(import("axios").AxiosResponse): void} options.errorHandler 必传，当 code 验证不通过时执行的函数
   * @param {function(import("axios").AxiosResponse): boolean} [options.validateCode] 如何验证是否后端返回的 code 是请求正常的 code，返回 false 则表示 code 不是请求正确码
   * @param {number} [options.successCode] 标识正确的返回码，默认是 0
   * @param {function(import("axios").AxiosResponse): void} [options.beforeSuccessHandle] 在 success interceptor 最开始执行，用于处理一些流程之外的操作，返回值被忽略
   * @param {function(import("axios").AxiosError): void} [options.beforeErrorHandle] 在 error interceptor 最开始执行，用于处理一些流程之外的操作，返回值被忽略
   * @param {boolean} [options.useErrorHandlerReturn] 如果 errorHandler 有返回值就使用 errorHandler 的返回值作为 interceptor 的返回值(只要返回值不是 undefined)，会直接返回该值，如需 reject，请自行返回 rejected promise
   */
  constructor(options = {}) {
    const {
      getCode,
      getMessage,
      getData,
      successNormal,
      successSpecialDispatcher,
      successCode,
      errorHandler,
      validateCode,
      beforeErrorHandle,
      beforeSuccessHandle,
      useErrorHandlerReturn,
    } = options;

    if (!successNormal || !isFunction(successNormal)) {
      console.error(
        "successNormal option is required and it must be a function"
      );
    }

    if (!isFunction(errorHandler)) {
      console.error(
        "errorHandler option is required and it must be a function"
      );
    }

    this.successCode = successCode || 0;
    this.customGetCode = isFunction(getCode) ? getCode : null;
    this.customGetMessage = isFunction(getMessage) ? getMessage : null;
    this.customGetData = isFunction(getData) ? getData : null;
    this.successSpecialDispatcher = successSpecialDispatcher;
    this.handleSuccessNormal = successNormal;
    this.errorHandler = errorHandler;
    this.customValidateCode = isFunction(validateCode) ? validateCode : null;
    this.beforeErrorHandle = isFunction(beforeErrorHandle)
      ? beforeErrorHandle
      : null;
    this.beforeSuccessHandle = isFunction(beforeSuccessHandle)
      ? beforeSuccessHandle
      : null;
    this.useErrorHandlerReturn =
      useErrorHandlerReturn === undefined ? false : useErrorHandlerReturn;

    // 使用bind的原因：successInterceptor errorInterceptor是异步请求的回调中执行的，里面访问this默认是指向windows/undefined
    this.successInterceptor = this.successInterceptor.bind(this);
    this.errorInterceptor = this.errorInterceptor.bind(this);
  }

  /**
   * @description 定义如何从 axiosResponse 中获取后端返回码
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  _getCode(axiosResponse) {
    return this.customGetCode
      ? this.customGetCode(axiosResponse)
      : axiosResponse.data.code;
  }

  /**
   * @description 定义如何从 axiosResponse 中获取后端返回信息
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  _getMessage(axiosResponse) {
    return this.customGetMessage
      ? this.customGetMessage(axiosResponse)
      : axiosResponse.data.message;
  }

  /**
   * @description 定义如何从 axiosResponse 中获取后端返回数据
   * @param {import("axios").AxiosResponse} axiosResponse
   */
  _getData(axiosResponse) {
    if (this.customGetData) {
      return this.customGetData(axiosResponse);
    }

    // 处理特殊返回数据类型
    if (
      axiosResponse.config.responseType &&
      axiosResponse.config.responseType === "blob"
    ) {
      return axiosResponse.data;
    }

    return axiosResponse.data.data;
  }

  /**
   * @description 验证返回数据的 code 是否是请求成功的 code，返回 false 表示验证不通过
   * @param {number} code
   */
  _validateCode(code) {
    if (this.customValidateCode) {
      return this.customValidateCode(code);
    }

    return code === this.successCode;
  }

  /* methods to expose */
  /**
   * @description 传给 axios 的 successResponseInterceptor 的方法
   * @param {import("axios").AxiosResponse} axiosResponse axios 的 response 对象
   */
  successInterceptor(axiosResponse) {
    try {
      // 防止影响后面的流程
      this.beforeSuccessHandle && this.beforeSuccessHandle(axiosResponse);
    } catch (e) {
      console.error(e);
    }

    // 如果是 blob 数据
    if (
      axiosResponse.config.responseType &&
      axiosResponse.config.responseType === "blob"
    ) {
      return this._getData(axiosResponse);
    }

    try {
      // 可以没有需要处理的特殊路径
      if (
        !this.successSpecialDispatcher ||
        !this.successSpecialDispatcher.hasMatchUrl(axiosResponse)
      ) {
        // 只有不需要处理特殊路径时才需要去验证 code，特殊路径的 code 验证交给 对应的 handler 自行处理
        if (!this._validateCode(this._getCode(axiosResponse))) {
          if (this.errorHandler) {
            const returnVal = this.errorHandler(axiosResponse);

            // 使用 errorHandler 的返回值
            if (this.useErrorHandlerReturn && returnVal !== undefined) {
              return returnVal;
            }
          }

          Message.warning(this._getMessage(axiosResponse));
          return Promise.reject(new Error(this._getMessage(axiosResponse)));
        }

        return this.handleSuccessNormal(axiosResponse);
      }

      return this.successSpecialDispatcher.handle(axiosResponse);
    } catch (e) {
      // 处理特殊路径的 handler 抛出的错误
      const isCustomError = !!e.response;

      if (this.errorHandler && isCustomError) {
        const returnVal = this.errorHandler(e.response);

        // 使用 errorHandler 的返回值
        if (this.useErrorHandlerReturn && returnVal !== undefined) {
          return returnVal;
        }
      }

      Message.warning(
        isCustomError ? this._getMessage(axiosResponse) : e.message
      );
      return Promise.reject(
        new Error(isCustomError ? this._getMessage(axiosResponse) : e.message)
      );
    }
  }

  /**
   * @description 传给 axios 的 errorResponseInterceptor 的方法
   * @param {import("axios").AxiosError} axiosError axios 的 response 对象
   */
  errorInterceptor(axiosError) {
    try {
      // 防止影响后面流程
      this.beforeErrorHandle && this.beforeErrorHandle(axiosError);
    } catch (e) {
      console.error(e);
    }

    // 没有 response 的错误请求当作 NetworkError 处理
    if (!axiosError.response) {
      return Promise.reject(new Error("网络错误"));
    }

    if (this.errorHandler) {
      const returnVal = this.errorHandler(axiosError.response);

      // 使用 errorHandler 的返回值
      if (this.useErrorHandlerReturn && returnVal !== undefined) {
        return returnVal;
      }
    }

    Message.warning(this._getMessage(axiosError.response));
    return Promise.reject(new Error(this._getMessage(axiosError.response)));
  }
}

/**
 * @description 返回数据 code 与对应的成功码不匹配时，执行该函数
 * @param {import('axios').AxiosResponse} axiosResponse
 */
const errorHandler = (axiosResponse) => {
  // const isNotCustomReturnData = !axiosResponse.data || (axiosResponse.data.timestamp && axiosResponse.data.error && axiosResponse.data.path);

  // 处理非 2xx http code 的不是后端定义返回数据
  if (!(axiosResponse.status >= 200 && axiosResponse.status <= 300)) {
    const statusCode = axiosResponse.status;

    if (statusCode >= 300 && statusCode <= 400) {
      axiosResponse.data = { message: undefined };
    }

    if (statusCode >= 400 && statusCode <= 500) {
      if (statusCode === 401) {
        Message.warning("认证失败，请重新登陆");
        axiosResponse.data = { message: "认证失败，请重新登陆" };
        router.push("/login");
        return;
      }

      axiosResponse.data = { message: "请求错误" };
    }

    if (statusCode >= 500) {
      axiosResponse.data = { message: "服务器错误" };
    }
  }
  return axiosResponse;
};

/**
 * @description 普通的不需要特殊处理的路径的拦截器执行函数
 *
 * @param {import('axios').AxiosResponse} axiosResponse
 */
const normalSuccess = (axiosResponse) => {
  // 已经在 interceptor 中验证过 code 了，这里只需要关注如何返回数据
  return axiosResponse.data.data;
};

const interceptor = new ResponseInterceptor({
  errorHandler,
  successNormal: normalSuccess,
  successCode: REQUEST_SUCCESS_CODE,
});

export default interceptor;
