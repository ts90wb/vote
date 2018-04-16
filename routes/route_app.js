let express = require('express');
let router = express.Router();
let fs = require('fs');
let url = require('url');
let iconv = require('iconv-lite');   
let dealFn = require('./dealfn.js');

let database = null;
let maxVoteTimes = 5;

function addTestUser(num) {
    let total = database.data.total;
    for (var i=0; i<num; i++) {
        let user = {
                        "username": "user",
                        "mobile": "18289742007",
                        "description": "hello",
                        "gender": "boy",
                        "password": "123",
                        "head_icon": "/images/boy.png",
                        "id": 0,
                        "vote": 0,
                        "rank": 0,
                        "vote_times": 0,
                        "vfriend": []
                    }
        database.data.total++;
        user.id = ++total;
        user.username = 'test' + (i + 1);
        database.data.objects.push(user);
    }
    database.data.objects = dealFn.sortRank(database.data.objects);
    dealFn.writeFileData('database.json', database).then((msg) => {
        console.log(msg);
    }, (msg) => {
        console.log(msg);
    });
}

dealFn.readFileData('database.json').then((data) => {
    database = data;
    database.data.total = database.data.objects.length;
    // addTestUser(100);
}, (msg) => {
    console.log(msg);
})

exports.index = (req, res) => {
    res.render('index');
};

exports.detail = (req, res) => {
    res.render('detail');
};

exports.register = (req, res) => {
    res.render('register');
};

exports.search = (req, res) => {
    res.render('search');
};

exports.rule = (req, res) => {
    res.render('rule');
};

exports.index_data = (req, res) => {
    //取得查询字符串对象
    let query = url.parse(req.url, true).query,
    //取得偏移量
        offset = +query.offset,
    //每页的条数
        limit = +query.limit,
    //
        sendObjs = database.data.objects.slice(offset, offset + limit),
        sendData = {
            errno: 0,
            msg: 'success',
            data: {
                total: database.data.total,
                offset: offset,
                limit: limit,
                objects: sendObjs
        }
    };
    if(offset > database.data.total) {
        sendData.data.objects = [];
    }
    res.send(JSON.stringify(sendData));
};

exports.index_poll = (req, res) => {
    let query = url.parse(req.url, true).query,
        id = +query.id,//被投票者ID
        ownObj = {},
        voterId = +query.voterId,//投票者ID
        sendData = {
            errno: 0,
            msg: '投票成功'
        },
        //从用户数组中拿到ID对应的用户对象
        pollUser = dealFn.getItem(id, database.data.objects),
       //从用户数组中拿到投票者ID
        voter = dealFn.getItem(voterId, database.data.objects);
    //pollUser是被投票者
    for(let i=0; i<pollUser.vfriend.length; i++) {
        if(pollUser.vfriend[i].id === voterId) {
            sendData.errno = '-1';
            sendData.msg = '已经给TA投过票了';
            res.send(JSON.stringify(sendData));
            return;
        }
    }
    //如果当前用户投的票数已经大于等于最大投票数了
    if(voter.vote_times >= maxVoteTimes) {
        sendData.errno = '-2';
        sendData.msg = '每个人最多能投5票，您已经使用完了';
        res.send(JSON.stringify(sendData));
        return;
    }
    //复制了一份投票者信息
    ownObj = dealFn.cloneUser(voter);
    //向被投票者的朋友们数组中添加当前投票者
    pollUser.vfriend.push(ownObj);
    //让被投票者的票数加1
    pollUser.vote++;
    //当有人的票数发生改变后，重新排名
    database.data.objects = dealFn.sortRank(database.data.objects);
    dealFn.writeFileData('database.json', database).then((msg) => {
        console.log(msg);
    }, (msg) => {
        console.log(msg);
    });
    res.send(JSON.stringify(sendData));
};

exports.register_data = (req, res) => {
    let total = database.data.total,
      //从请求体中获取到用户注册信息{username,password,mobile,description,gender}
        registerData = req.body,
        sendData = {};
    if (!registerData.username || !registerData.mobile || !registerData.description || !registerData.gender || !registerData.password ) {
        sendData = {
            errno: -1,
            msg: '报名失败，字段不匹配！'
        }
        res.send(JSON.stringify(sendData));
        return false
    }
    database.data.total++;
    //给头像字段赋值
    registerData.gender === 'boy' ? registerData.head_icon = '/images/boy.png' : registerData.head_icon = '/images/girl.png';
    //总条数+1
    registerData.id = ++total;
    registerData.vote = 0;//得到票数
    registerData.rank = 0;//排名
    registerData.vote_times = 0;//投票的次数
    registerData.vfriend = [];//给他投票的人
    //把对象放到数组中去
    database.data.objects.push(registerData);
    dealFn.writeFileData('database.json', database).then((msg) => {
        console.log(msg);
    }, (msg) => {
        console.log(msg);
    });
    sendData = {
        errno: 0,
        msg: '报名成功，您的用户编号为' + registerData.id + '（用于登入验证）,请妥善保管！',
        id: registerData.id
    }
    res.send(JSON.stringify(sendData));
};

exports.index_info = (req, res) => {
    let total = database.data.total,
        registerData = req.body,
        sendData = {
            errno: 0,
            msg: '验证通过',
            id: registerData.id
        },
        isUser = dealFn.matchUser(+registerData.id, database.data.objects, registerData.password);

    if(!isUser) {
        sendData.errno = -1;
        sendData.msg = '您输入的用户名或者密码不正确';
    }
    sendData.user = dealFn.getItem(+registerData.id, database.data.objects)
    res.send(JSON.stringify(sendData));   
};

exports.index_search = (req, res) => {
    let searchData = req.query,
        content = searchData.content,
        sendData = {
            errno: 0,
            msg: 'success',
            data: {}
        };

    sendData.data = dealFn.serchItems(content, database.data.objects);
    res.send(JSON.stringify(sendData));
};

exports.detail_data= (req, res) => {
    let detailData = req.query,
        id = +detailData.id,
        userDetailObj = dealFn.getItem(id, database.data.objects),
        sendData = {
            errno: 0,
            msg: 'success',
            data: {}
        };

    userDetailObj.vfriend = userDetailObj.vfriend.sort(function(a, b) {
        return b.time - a.time;
    })
    sendData.data = userDetailObj;
    res.send(JSON.stringify(sendData));
};


