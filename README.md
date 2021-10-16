# 自选基金助手

[阿里云(2021.11.06到期)](http://39.100.236.137:81/)

[新网站netlify](https://fundsforweb.netlify.app)

[新阿里云](http://120.26.91.101:8088/)

## 项目启动
``` bash
# 安装依赖
yarn 

# 项目运行
yarn dev

# 项目打包
yarn build

```

## nginx配置
```bash
server {
        listen       81;
        server_name  _;
        charset utf-8;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
            root /home/fundsForWeb;
            index  index.html index.htm;
        }

        location /FundMApi/ {
            proxy_pass https://fundmobapi.eastmoney.com;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
        }
        location /FundMNewApi/ {
            proxy_pass https://fundmobapi.eastmoney.com;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
            proxy_set_header 'User-Agent' 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Mobile Safari/537.36';
        }
        location /api/qt/ {
            proxy_pass http://push2.eastmoney.com;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
        }
        location /fundsuggest/ {
            proxy_pass https://fundsuggest.eastmoney.com/;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
        }
        location /rabt/ {
            proxy_pass https://x2rr.github.io/;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
        }
        location /bspapp {
            proxy_pass https://2955b122-0e37-42a7-a4ee-4ddd503fe6b6.bspapp.com/http/user-center/;
            proxy_read_timeout 1500;  # 秒
            proxy_connect_timeout 1500;
            send_timeout 1500;
            proxy_ssl_session_reuse off;
            proxy_ssl_ciphers HIGH:!DH:!MD5;
        }

        error_page 404 /404.html;
            location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
            location = /50x.html {
        }
    }
```

## 更新日志
---
### 2021.10.14
* fix: 修复无法基金列表无法请求的bug；
### 2021.08.09
* feat: 累计收益增加当日的估值，方便判断是否加仓；
### 2021.07.19
* feat: 合并了累计收益和历史收益，界面精简；
### 2021.07.05
* feat: 增加累计收益功能；以前用历史累计净值估算不准确；
* fix: 查看基金详情，点下一页，然后关闭；再查看详情，基金详情显示错误的bug；
### 2021.05.20
* fix: 关闭当日收益曲线弹窗，还调用接口的问题；某些基金收益曲线不是最新的时，用最新收益来估算；
* feat: 当日收益曲线加上刷新按钮；
### 2021.05.12
* fix: 打开持有收益率，不展示成本价输入框的bug
### 2021.05.06
* 累计净值的涨幅修复误差；y轴修复； 
### 2021.04.30
* 增加了当日收益曲线波动和波动率； 
### 2021.04.29  
* 增加了最新的收益和收益率；  
* 增加了累计净值的涨跌幅；  

### 2020.04.14
* 新增了当日收益曲线