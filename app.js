var express = require('express');
//解析路径
var path = require('path');
//处理收藏夹图标 /favicon.ico
var favicon = require('serve-favicon');
//打印客户端访问日志 GET / 500 13.403 ms - 1085(响应体的字节数)
var logger = require('morgan');
//处理和解析cookie req.cookies
var cookieParser = require('cookie-parser');
//处理请求体 req.body
var bodyParser = require('body-parser');
//路由
var routes = require('./routes/route_app');
//app是一个请求监听函数
var app = express();
var ejs = require('ejs');

//模板的存放路径
app.set('views', path.join(__dirname, 'views'));
//设置html类型的模板用ejs来进行渲染
app.engine('.html', ejs.__express);
//设置模板引擎
app.set('view engine', 'html');// app.set('view engine', 'ejs');

// 处理收藏夹图标 /favicon.ico
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//静态文件中间件 把当前目录下面的public目录作为静态文件根目录
app.use(express.static(path.join(__dirname, 'public')));


//获得get请求，第一个参数是匹配内容，第二个参数是匹配成功后执行的回调函数
//首页
app.get('/vote/index', routes.index);
//详情页
app.get(/\/vote\/detail/, routes.detail);
//注册页=报名页
app.get('/vote/register', routes.register);
//搜索结果页
app.get('/vote/search', routes.search);
//规则页
app.get('/vote/rule', routes.rule);
//首页的用户列表
app.get('/vote/index/data', routes.index_data);
//投票
app.get(/\/vote\/index\/poll/, routes.index_poll);
//搜索接口
app.get(/\/vote\/index\/search/, routes.index_search);
//个人详情页接口
app.get(/\/vote\/all\/detail\/data/, routes.detail_data);
//注册接口
app.post(/\/vote\/register\/data/, routes.register_data);
//登录
app.post('/vote/index/info', routes.index_info);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
