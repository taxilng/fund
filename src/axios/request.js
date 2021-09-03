import axios from 'axios'
import Vue from "vue";
const vueObj = new Vue();

// 请求超时 TODO 性能优化后 修改至 30000
axios.defaults.timeout = 30000;
//axios.defaults.withCredentials=true;
let isClose = true;
// 添加一个请求拦截器
axios.interceptors.request.use(
  res => {
    // res.baseURL = baseUrl || '',
    res.params = res.params || {};
    if(res.headers['Content-Type']=='application/json' && res.method=='post'){
      res.params= res.data || {};
    }else{
      res.params = res.params || {};
    }
    // if(localStorage.getItem('loginToken')) {
    //   res.headers.common['Authorization'] = localStorage.getItem('loginToken');
    // }
    // if(localStorage.getItem('userId')) {
    //     res.headers.common['userId'] = localStorage.getItem('userId');
    // }
    // if(process.env.NODE_ENV === "development"){
    //     res.headers.common['userId'] = 1;
    //     res.headers.common['orgCode'] = "1.336.";
    //     res.headers.common['orgId'] = 1;
    //     res.headers.common['isDesensitization'] = 1;
    //     res.headers.common['authLevel'] = 3;
    //     res.headers.common['ApiKey'] = 123456;
    //     res.headers.common['isSuperAdmin'] = true;
    // }
    return res;
  },
  err => {
    return Promise.reject(err);
  }
);

// 添加一个响应拦截器
axios.interceptors.response.use(
  res => {
    return res.data;
  },
  error => {
    if(String(error).indexOf("timeout") > -1) {
      vueObj.$notify.closeAll();
      vueObj.$notify.error({
          name: "reqTimeoutHint",
          title: '请求超时'
      });
      return;
    } else {
      vueObj.$notify.close("serviceHint");
        vueObj.$notify.error({
          name: "serviceHint",
          title: '服务异常，请稍后再试'
      });
    }
    if (error.response.status) {
      switch (error.response.status) {
        // 401: 未登录
        // 未登录则跳转登录页面，并携带当前页面的路径
        // 在登录成功后返回当前页面，这一步需要在登录页操作。
        case 401:
          // console.log("401");
          // router.replace({
          //     path: '/login',
          //     query: {
          //         redirect: router.currentRoute.fullPath
          //     }
          // });
          break;

        // 403 token过期
        // 登录过期对用户进行提示
        // 清除本地token和清空vuex中token对象
        // 跳转登录页面
        case 403:
          // Toast({
          //     message: '登录过期，请重新登录',
          //     duration: 1000,
          //     forbidClick: true
          // });
          // 清除token
          //localStorage.removeItem('token');
          // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
          setTimeout(() => {
            // router.replace({
            //     path: '/login',
            //     query: {
            //         redirect: router.currentRoute.fullPath
            //     }
            // });
          }, 1000);
          break;

        // 404请求不存在
        case 404:
          // Toast({
          //     message: '网络请求不存在',
          //     duration: 1500,
          //     forbidClick: true
          // });
          break;
        // 其他错误，直接抛出错误提示
        default:
          // vueObj.$notify.error({
          //   title: "服务异常，请稍后再试",
          //   //
          // });
          
      }
      return Promise.reject(error.response);
    }
  }
);


export const  postHeaderJson=(url,params)=>{
  return new Promise((resolve,reject) => {
    axios.post(url,params,{headers:{'Content-Type':'application/json'}},{
      emulateJSON: true
    }).then(res => {

      resolve(res);
    },err => {
      reject(err)
    })
  })
}
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 *
 */
export const get = (url, params, config = {}) => {
  return axios.get(url, {
        params: params,
        ...config
      })
};

/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export const post = (url, params, obj={}) => {
  //以x-www-form-urlencoded 格式post数据的时候，需要使用qs.stringify()
  return new Promise((resolve, reject) => {
    axios
      .post(url, params, obj)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
};
/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export const postFile = (url, params) => {
  return new Promise((resolve, reject) => {
    axios
      .post(url, params, {
        headers: {
          "Content-Type": "multipart/form-data;charset=utf-8"
        }
      })
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
};
/**
 * postForm  
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export const postForm = (url, params) => {
  //以x-www-form-urlencoded 格式post数据的时候，需要使用qs.stringify()
  return new Promise((resolve, reject) => {
    axios({
      url: url,
      method: "post",
      data: params,
      transformRequest: [
        function(data) {
          // Do whatever you want to transform the data
          let ret = "";
          for (let it in data) {
            const value = data[it] !== undefined ? data[it] : ''
            ret += `&${encodeURIComponent(it)}=${encodeURIComponent(value)}`
          }
          return ret.slice(1)
        }
      ],
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        //   'Content-Type': 'multipart/form-data'
      }
    })
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      });
  });
};
/**
 * put 对应put请求
 * @param {String} url
 * @param {Object} data
 */
export const put = (url, params) => {
  return new Promise((resolve, reject) => {
    axios
      .put(url, params, { headers: { "Content-Type": "application/json" } })
      .then(
        response => {
          resolve(response);
        },
        err => {
          reject(err);
        }
      );
  });
};
/**
 * delete方法，delete请求
 * @param {String} url
 * @param {Object} params
 */

export const delet = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    axios
      .delete(url, {
        params: params
      })
      .then(response => {
        resolve(response);
      })
      .catch(err => {
        reject(err);
      });
  });
};