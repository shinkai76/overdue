import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from "axios";
import "./registerServiceWorker";
import ElementUI from "element-ui";
import "element-ui/lib/theme-chalk/index.css";

Vue.config.productionTip = false;
Vue.prototype.$axios = axios;
Vue.use(ElementUI);

function ready(infoData) {
    new Vue({
        router,
        store,
        data: {
            infoData: infoData,
            newToken: ''
        },
        mounted() {
            this.getToken(infoData);
            this.interceptors(); // 拦截器
        },
        render: h => h(App),
        methods: {
            getToken(infoData) {
                let referrerUrl = document.referrer;
                let url = referrerUrl.slice(0, referrerUrl.indexOf("/static"));
                let userInfo = infoData.user;
                this.$axios({
                    url: "/api/access_token",
                    params: {
                        url: url,
                        set_of_book: userInfo.set_of_book,
                        user_name: userInfo.name
                    },
                    headers: {
                        Token: userInfo.token
                    }
                })
                  .then(res => {
                      if (res.data.state === 1) {
                          this.newToken = res.data.token;
                          this.$router.push('/home')
                      }
                  })
                  .catch(err => {
                      console.log("err", err);
                  });
            },
            interceptors() {
                this.$axios.interceptors.request.use(
                  config => {
                      config.headers["Token"] = this.newToken;
                      this.$loading({
                          text: '加载中...',
                          spinner: 'el-icon-loading',
                          background: 'rgba(0, 0, 0, 0.7)'
                      });
                      return config;
                  },
                  error => {
                      return Promise.reject(error);
                  }
                );
                this.$axios.interceptors.response.use(
                  response => {
                      this.$loading({
                          text: '加载中...',
                          background: 'rgba(0, 0, 0, 0.1)'
                      }).close();
                      return response.data;
                  },
                  error => {
                      this.$loading({
                          text: '加载中...',
                          background: 'rgba(0, 0, 0, 0.1)'
                      }).close();
                      return Promise.reject(error.response);
                  }
                );
            }
        }
    }).$mount("#app");
}

//event 参数中有 data 属性，就是父窗口发送过来的数据
window.addEventListener(
  "message",
  function (event) {
      if ( typeof event.data === "string" )
          ready(JSON.parse(event.data));
  },
  false
);
