;
(function anonymous(window) {
  // 设置默认的参数配置项
  let _default = {
    method: 'GET',
    url: '',
    baseURL: '',
    headers: {},
    dataType: 'JSON',
    data: null, // post系列请求基于主体传递给服务器的内容
    params: null, // get系列请求基于问号传参传递给服务器的内容
    cache: true
  };
  // 基于promise设计模式管理ajax请求
  let ajaxPromise = function ajaxPromise(options) {
    // options中融合了：默认配置信息，用户基于default修改的信息、用户执行get等方法传递的配置信息，越靠后的优先级越高
    let {
      method,
      url,
      baseURL,
      headers,
      dataType,
      data,
      params,
      cache
    } = options;
    // 把传递的参数进一步进行处理
    if (/^(GET|DELETE|HEAD|OPTIONS)$/i.test(method)) {
      // get系列
      if (params) {
        url += `${ajaxPromise.check(url)}${ajaxPromise.formatData(params)}`;
      }
      if (cache === false) {
        url += `${ajaxPromise.check(url)}_=${+(new Date())}`;
      }
      // get系列下请求主体就是什么都不放置
      data = null;
    } else {
      // post系列
      if (data) {
        data = ajaxPromise.formatData(data);
      }
    }
    // 基于promise发送ajax
    return new Promise((reslove, reject) => {
      let xhr = new XMLHttpRequest;
      xhr.open(method, `${baseURL}${url}`);
      // 如果headers存在，我们需要设置请求头 请求头中不能出现中文
      if (headers !== null && typeof headers === 'object') {
        for (let attr in headers) {
          if (headers.hasOwnProperty(attr)) {
            let val = headers[attr];
            if (/[\u4e00-\u9fa5]/.test(val)) {
              // val包含中文，进行编码encodeURIComponent/解码decodeURIComponent
              val = encodeURIComponent(val);
            }
            xhr.setRequestHeader(attr, headers[attr]);
          }
        }
      }
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (/^(2|3)\d{2}$/.test(xhr.status)) {
            let result = xhr.responseText;
            dataType = dataType.toUpperCase();
            dataType === 'JSON' ? result = JSON.parse(result) : (dataType === 'XML' ? result = xhr.responseXML : null);
            reslove(result);
            return;
          }
          reject(xhr.statusText);
        }
      };
      xhr.send(data);
    })
  };
  // 把默认配置暴露出去，后期用户在使用的时候可以自己设置一些继承的默认值（发送ajax请求的时候按照配置的信息进行处理）
  ajaxPromise.default = _default;
  // 把对象转换为uriencoded格式的字符串
  ajaxPromise.formatData = function formatData(obj) {
    let str = ``;
    for (let attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        str += `${attr}=${obj[attr]}&`;
      }
    }
    return str.substring(0, str.length - 1);
  };
  // 检查url中是否带 "?" 问号
  ajaxPromise.check = function check(url) {
    return url.indexOf('?') > -1 ? '&' : '?';
  };
  ['get', 'delete', 'head', 'options'].forEach(item => {
    ajaxPromise[item] = function anonymous(url, options) {
      options = {
        ..._default,
        ...options,
        url: url,
        method: item.toUpperCase()
      };
      return ajaxPromise(options);
    };
  });
  ['post', 'put', 'patch'].forEach(item => {
    ajaxPromise[item] = function anonymous(url, data = {}, options = {}) {
      options = {
        ..._default,
        ...options,
        url: url,
        method: item.toUpperCase(),
        data: data
      };
      return ajaxPromise(options);
    };
  });
  window.ajaxPromise = ajaxPromise;
})(window);