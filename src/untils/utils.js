import axios from "axios";
export const elementSize = 'small';

const _toString = Object.prototype.toString

var Interval;
var holiday;
var RealtimeFundcode = null;
var fundListM = [];
var showBadge = 1;
var BadgeContent = 1;
var BadgeType = 1;
var userId = null;

export function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
}

export function noop () { }

export const storage = {
    get: function (name) {
        //支持数组和字符串 参数
        const resultObj = {}
        if (!name) {
            Reflect.ownKeys(localStorage).forEach(function (key) {
                let val = localStorage[key]
                try {
                    val = JSON.parse(localStorage[key])
                } catch (error) {
                    //do nothing
                }
                resultObj[key] = val
            });
        }
        if (typeof name === 'string') {
            name = [name]
        }
        // if (!Array.isArray(name)) {
        //     return Promise.reject('Please pass in an array or string')
        // }
        if (Array.isArray(name)) {
            name.forEach(v => {
                let val = localStorage.getItem(v)
                try {
                    val = JSON.parse(localStorage.getItem(v))
                } catch (error) {
                    //do nothing
                }
                resultObj[v] = val
            })
        }
        return Promise.resolve(resultObj)
    },
    set: function (storageVals, fn = noop) {
        if (!isPlainObject(storageVals)) {
            return Promise.reject('Please pass in an object')
        }
        Reflect.ownKeys(storageVals).forEach(function (key) {
            localStorage.setItem(key, JSON.stringify(storageVals[key]))
        });
        fn()
    }
}
/**
 * 存储localStorage
 */
export const setStore = (name, content) => {
    if (!name) return;
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }
    window.localStorage.setItem(name, content);
}

/**
 * 存储sessionStorage
 */
export const setStoreSe = (name, content) => {
    if (!name) return;
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }
    window.sessionStorage.setItem(name, content);
}

/**
 * 获取localStorage
 */
export const getStore = name => {
    if (!name) return;
    return window.localStorage.getItem(name);
}

/**
 * 获取sessionStorage
 */
export const getStoreSe = name => {
    if (!name) return;
    return window.sessionStorage.getItem(name);
}

/**
 * 删除localStorage
 */
export const removeStore = name => {
    if (!name) return;
    window.localStorage.removeItem(name);
}
/**
 * 获取sessionStorage
 */
export const removeStoreSe = name => {
    if (!name) return;
    window.sessionStorage.removeItem(name);
}

/**
 * 获取style样式
 */
export const getStyle = (element, attr, NumberMode = 'int') => {
    let target;
    // scrollTop 获取方式不同，没有它不属于style，而且只有document.body才能用
    if (attr === 'scrollTop') {
        target = element.scrollTop;
    } else if (element.currentStyle) {
        target = element.currentStyle[attr];
    } else {
        target = document.defaultView.getComputedStyle(element, null)[attr];
    }
    //在获取 opactiy 时需要获取小数 parseFloat
    return NumberMode == 'float' ? parseFloat(target) : parseInt(target);
}

/**
 * 页面到达底部，加载更多
 */
export const loadMore = (element, callback) => {
    let windowHeight = window.screen.height;
    let height;
    let setTop;
    let paddingBottom;
    let marginBottom;
    let requestFram;
    let oldScrollTop;

    document.body.addEventListener('scroll', () => {
        loadMore();
    }, false)
    //运动开始时获取元素 高度 和 offseTop, pading, margin
    element.addEventListener('touchstart', () => {
        height = element.offsetHeight;
        setTop = element.offsetTop;
        paddingBottom = getStyle(element, 'paddingBottom');
        marginBottom = getStyle(element, 'marginBottom');
    }, { passive: true })

    //运动过程中保持监听 scrollTop 的值判断是否到达底部
    element.addEventListener('touchmove', () => {
        loadMore();
    }, { passive: true })

    //运动结束时判断是否有惯性运动，惯性运动结束判断是非到达底部
    element.addEventListener('touchend', () => {
        oldScrollTop = document.body.scrollTop;
        moveEnd();
    }, { passive: true })

    const moveEnd = () => {
        requestFram = requestAnimationFrame(() => {
            if (document.body.scrollTop != oldScrollTop) {
                oldScrollTop = document.body.scrollTop;
                loadMore();
                moveEnd();
            } else {
                cancelAnimationFrame(requestFram);
                //为了防止鼠标抬起时已经渲染好数据从而导致重获取数据，应该重新获取dom高度
                height = element.offsetHeight;
                loadMore();
            }
        })
    }

    const loadMore = () => {
        if (document.body.scrollTop + windowHeight >= height + setTop + paddingBottom + marginBottom) {
            callback();
        }
    }
}

/**
 * 显示返回顶部按钮，开始、结束、运动 三个过程中调用函数判断是否达到目标点
 */
export const showBack = callback => {
    let requestFram;
    let oldScrollTop;

    document.addEventListener('scroll', () => {
        showBackFun();
    }, false)
    document.addEventListener('touchstart', () => {
        showBackFun();
    }, { passive: true })

    document.addEventListener('touchmove', () => {
        showBackFun();
    }, { passive: true })

    document.addEventListener('touchend', () => {
        oldScrollTop = document.body.scrollTop;
        moveEnd();
    }, { passive: true })

    const moveEnd = () => {
        requestFram = requestAnimationFrame(() => {
            if (document.body.scrollTop != oldScrollTop) {
                oldScrollTop = document.body.scrollTop;
                moveEnd();
            } else {
                cancelAnimationFrame(requestFram);
            }
            showBackFun();
        })
    }

    //判断是否达到目标点
    const showBackFun = () => {
        if (document.body.scrollTop > 500) {
            callback(true);
        } else {
            callback(false);
        }
    }
}


/**
 * 运动效果
 * @param {HTMLElement} element   运动对象，必选
 * @param {JSON}        target    属性：目标值，必选
 * @param {number}      duration  运动时间，可选
 * @param {string}      mode      运动模式，可选
 * @param {function}    callback  可选，回调函数，链式动画
 * 使用  animate(document.body, {scrollTop: '0'}, 400,'ease-out');
 */
export const animate = (element, target, duration = 400, mode = 'ease-out', callback) => {
    clearInterval(element.timer);

    //判断不同参数的情况
    if (duration instanceof Function) {
        callback = duration;
        duration = 400;
    } else if (duration instanceof String) {
        mode = duration;
        duration = 400;
    }

    //判断不同参数的情况
    if (mode instanceof Function) {
        callback = mode;
        mode = 'ease-out';
    }

    //获取dom样式
    const attrStyle = attr => {
        if (attr === "opacity") {
            return Math.round(getStyle(element, attr, 'float') * 100);
        } else {
            return getStyle(element, attr);
        }
    }
    //根字体大小，需要从此将 rem 改成 px 进行运算
    const rootSize = parseFloat(document.documentElement.style.fontSize);

    const unit = {};
    const initState = {};

    //获取目标属性单位和初始样式值
    Object.keys(target).forEach(attr => {
        if (/[^\d^\.]+/gi.test(target[attr])) {
            unit[attr] = target[attr].match(/[^\d^\.]+/gi)[0] || 'px';
        } else {
            unit[attr] = 'px';
        }
        initState[attr] = attrStyle(attr);
    });

    //去掉传入的后缀单位
    Object.keys(target).forEach(attr => {
        if (unit[attr] == 'rem') {
            target[attr] = Math.ceil(parseInt(target[attr]) * rootSize);
        } else {
            target[attr] = parseInt(target[attr]);
        }
    });


    let flag = true; //假设所有运动到达终点
    const remberSpeed = {};//记录上一个速度值,在ease-in模式下需要用到
    element.timer = setInterval(() => {
        Object.keys(target).forEach(attr => {
            let iSpeed = 0;  //步长
            let status = false; //是否仍需运动
            let iCurrent = attrStyle(attr) || 0; //当前元素属性址
            let speedBase = 0; //目标点需要减去的基础值，三种运动状态的值都不同
            let intervalTime; //将目标值分为多少步执行，数值越大，步长越小，运动时间越长
            switch (mode) {
                case 'ease-out': {
                    speedBase = iCurrent;
                    intervalTime = duration * 5 / 400;
                    break;
                }
                case 'linear': {
                    speedBase = initState[attr];
                    intervalTime = duration * 20 / 400;
                    break;
                }
                case 'ease-in': {
                    let oldspeed = remberSpeed[attr] || 0;
                    iSpeed = oldspeed + (target[attr] - initState[attr]) / duration;
                    remberSpeed[attr] = iSpeed
                    break;
                }
                default: {
                    speedBase = iCurrent;
                    intervalTime = duration * 5 / 400;
                }
            }
            if (mode !== 'ease-in') {
                iSpeed = (target[attr] - speedBase) / intervalTime;
                iSpeed = iSpeed > 0 ? Math.ceil(iSpeed) : Math.floor(iSpeed);
            }
            //判断是否达步长之内的误差距离，如果到达说明到达目标点
            switch (mode) {
                case 'ease-out':
                    status = iCurrent != target[attr];
                    break;
                case 'linear':
                    status = Math.abs(Math.abs(iCurrent) - Math.abs(target[attr])) > Math.abs(iSpeed);
                    break;
                case 'ease-in':
                    status = Math.abs(Math.abs(iCurrent) - Math.abs(target[attr])) > Math.abs(iSpeed);
                    break;
                default:
                    status = iCurrent != target[attr];
            }

            if (status) {
                flag = false;
                //opacity 和 scrollTop 需要特殊处理
                if (attr === "opacity") {
                    element.style.filter = "alpha(opacity:" + (iCurrent + iSpeed) + ")";
                    element.style.opacity = (iCurrent + iSpeed) / 100;
                } else if (attr === 'scrollTop') {
                    element.scrollTop = iCurrent + iSpeed;
                } else {
                    element.style[attr] = iCurrent + iSpeed + 'px';
                }
            } else {
                flag = true;
            }

            if (flag) {
                clearInterval(element.timer);
                if (callback) {
                    callback();
                }
            }
        })
    }, 20);
}


/*
* 判断是否是ie
 */
export const getWebIE = () => {
    var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
    var isIE =
        userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1; //判断是否IE<11浏览器
    var isEdge = userAgent.indexOf("Edge") > -1 && !isIE; //判断是否IE的Edge浏览器
    if (
        (userAgent.indexOf("Trident") > -1 && userAgent.indexOf("rv:11.0")) ||
        (userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1)
    ) {
        return true;
    } //判断是否IE浏览器
    else {
        return false;
    }
}

const isDuringDate = () => {

    //时区转换为东8区
    var zoneOffset = 8;
    var offset8 = new Date().getTimezoneOffset() * 60 * 1000;
    var nowDate8 = new Date().getTime();
    var curDate = new Date(nowDate8 + offset8 + zoneOffset * 60 * 60 * 1000);

    if (checkHoliday(curDate)) {
        return false;
    }
    var beginDateAM = new Date();
    var endDateAM = new Date();
    var beginDatePM = new Date();
    var endDatePM = new Date();

    beginDateAM.setHours(9, 30, 0);
    endDateAM.setHours(11, 35, 0);
    beginDatePM.setHours(13, 0, 0);
    endDatePM.setHours(15, 5, 0);
    if (curDate.getDay() == "6" || curDate.getDay() == "0") {
        return false;
    } else if (curDate >= beginDateAM && curDate <= endDateAM) {
        return true;
    } else if (curDate >= beginDatePM && curDate <= endDatePM) {
        return true;
    } else {
        return false;
    }
};
const getGuid = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
        c
    ) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
var getHoliday = () => {
    let url = "/rabt/funds/holiday.json";
    // let url = "https://rabt.gitee.io/funds/holiday.json";
    return axios.get(url);
};
var checkHoliday = date => {
    var nowMonth = date.getMonth() + 1;
    var nowYear = date.getFullYear();
    var strDate = date.getDate();
    if (nowMonth >= 1 && nowMonth <= 9) {
        nowMonth = "0" + nowMonth;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }

    let check = false;
    var nowDate = nowMonth + "-" + strDate;
    let holidayList = holiday.data;
    for (const year in holidayList) {
        if (holidayList.hasOwnProperty(year)) {
            const yearData = holidayList[year];
            if (year == nowYear) {
                for (const day in yearData) {
                    if (yearData.hasOwnProperty(day)) {
                        const dayData = yearData[day];
                        if (nowDate == day && dayData.holiday) {
                            check = true;
                        }
                    }
                }
            }
        }
    }
    return check;
};
var formatNum = val => {
    let num = parseFloat(val);
    let absNum = Math.abs(num);
    if (absNum < 10) {
        return num.toFixed(2);
    } else if (absNum < 100) {
        return num.toFixed(1);
    } else if (absNum < 1000) {
        return num.toFixed(0);
    } else if (absNum < 10000) {
        return (num / 1000).toFixed(1) + 'k';
    } else if (absNum < 1000000) {
        return (num / 1000).toFixed(0) + 'k';
    } else if (absNum < 10000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else {
        return (num / 1000000).toFixed(0) + 'M';
    }
}
var setBadge = (fundcode, Realtime, type) => {
    let fundStr = null;
    if (type == 1) {
        fundStr = fundcode;
    } else {
        fundStr = fundListM.map((val) => val.code).join(",");
    }

    let url =
        "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=50&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=" + userId + "&Fcodes=" +
        fundStr;
    axios
        .get(url)
        .then((res) => {
            let allAmount = 0;
            let allGains = 0;
            let textStr = null;
            if (type == 1) {
                let val = res.Datas[0];
                let data = {
                    fundcode: val.FCODE,
                    name: val.SHORTNAME,
                    jzrq: val.PDATE,
                    dwjz: val.NAV,
                    gsz: isNaN(val.GSZ) ? null : val.GSZ,
                    gszzl: isNaN(val.GSZZL) ? 0 : val.GSZZL,
                    gztime: val.GZTIME,
                    num: 0
                };
                let slt = fundListM.filter(
                    (item) => item.code == data.fundcode
                );
                if (!slt.length) {
                    return false;
                }
                data.num = slt[0].num;
                var sum = 0;

                let num = data.num ? data.num : 0;

                if (val.PDATE == val.GZTIME.substr(0, 10)) {
                    data.gsz = val.NAV;
                    data.gszzl = isNaN(val.NAVCHGRT) ? 0 : val.NAVCHGRT;
                    sum = (
                        (data.dwjz - data.dwjz / (1 + data.gszzl * 0.01)) *
                        num
                    ).toFixed(1);
                } else {
                    if (data.gsz) {
                        sum = ((data.gsz - data.dwjz) * num).toFixed(1);
                    }

                }


                if (BadgeType == 1) {
                    textStr = data.gszzl + '%';
                } else {
                    if (num != 0) {
                        textStr = formatNum(sum);
                    } else {
                        textStr = "0";
                    }
                }

            } else {
                res.Datas.forEach((val) => {
                    let slt = fundListM.filter(
                        (item) => item.code == val.FCODE
                    );
                    let num = slt[0].num ? slt[0].num : 0;
                    allAmount += val.NAV * num;
                    var sum = 0;
                    if (val.PDATE == val.GZTIME.substr(0, 10)) {
                        sum = (val.NAV - val.NAV / (1 + val.NAVCHGRT * 0.01)) * num
                    } else {
                        let gsz = isNaN(val.GSZ) ? null : val.GSZ
                        if (gsz) {
                            sum = (gsz - val.NAV) * num
                        }
                    }
                    allGains += sum;

                });
                if (BadgeType == 1) {
                    if (allAmount == 0 || allGains == 0) {
                        textStr = "0"
                    } else {
                        textStr = (100 * allGains / allAmount).toFixed(2) + '%';
                    }

                } else {
                    textStr = formatNum(allGains);
                }
            }


            chrome.browserAction.setBadgeText({
                text: textStr
            });
            let color = Realtime ?
                allGains >= 0 ?
                    "#F56C6C" :
                    "#4eb61b" :
                "#4285f4";
            // chrome.browserAction.setBadgeBackgroundColor({
            //     color: color
            // });

        })
        .catch((error) => {

        });


};


var startInterval = (RealtimeFundcode, type = 1) => {
    endInterval(Interval);
    let Realtime = isDuringDate();
    RealtimeFundcode = RealtimeFundcode;
    setBadge(RealtimeFundcode, Realtime, type);
    Interval = setInterval(() => {
        if (isDuringDate()) {
            setBadge(RealtimeFundcode, true, type);
        } else {
            // chrome.browserAction.setBadgeBackgroundColor({
            //     color: "#4285f4"
            // });
        }
    }, 2 * 60 * 1000);
};

var endInterval = () => {
    clearInterval(Interval);
    chrome.browserAction.setBadgeText({
        text: "自选基金"
    });
};
var runStart = RealtimeFundcode => {

    if (showBadge == 1 && BadgeContent == 1) {
        if (RealtimeFundcode) {
            startInterval(RealtimeFundcode);
        } else {
            endInterval();
        }
    } else if (showBadge == 1 && BadgeContent == 2) {
        startInterval(null, 2);
    } else {
        endInterval();
    }

};
const getData = () => {
    storage
        .get(["holiday", "fundListM", "RealtimeFundcode", "showBadge", "BadgeContent", "BadgeType", "userId"])
        .then(res => {
            RealtimeFundcode = res.RealtimeFundcode ? res.RealtimeFundcode : null;
            fundListM = res.fundListM ? res.fundListM : [];
            showBadge = res.showBadge ? res.showBadge : 1;
            BadgeContent = res.BadgeContent ? res.BadgeContent : 1;
            BadgeType = res.BadgeType ? res.BadgeType : 1;
            if (res.userId) {
                userId = res.userId;
            } else {
                userId = getGuid();
                storage.set({
                    userId: userId,
                });
            }
            if (res.holiday) {
                holiday = res.holiday;
                runStart(RealtimeFundcode);
            } else {
                getHoliday().then(res => {
                    storage.set({
                        holiday: res
                    },
                        () => {
                            holiday = res;
                            runStart(RealtimeFundcode);
                        }
                    );
                });
            }
        });
}
getData();

export const chrome = {
    runtime: {
        sendMessage: function (request, fn = noop) {
            if (request.type == "DuringDate") {
                let DuringDate = isDuringDate();
                fn({
                    farewell: DuringDate
                });
            }
            if (request.type == "refresh") {
                getData();
            }
            if (request.type == "refreshBadgeAllGains") {
                let allAmount = 0;
                let allGains = 0;
                request.data.forEach((val) => {
                    let slt = fundListM.filter(
                        (item) => item.code == val.FCODE
                    );
                    let num = slt[0].num ? slt[0].num : 0;
                    allAmount += val.NAV * num;
                    var sum = 0;
                    if (val.PDATE == val.GZTIME.substr(0, 10)) {
                        sum = (val.NAV - val.NAV / (1 + val.NAVCHGRT * 0.01)) * num
                    } else {
                        let gsz = isNaN(val.GSZ) ? null : val.GSZ;
                        if (gsz) {
                            sum = (gsz - val.NAV) * num;
                        }

                    }
                    allGains += sum;

                });
                let textStr = null;
                if (BadgeType == 1) {
                    if (allAmount == 0 || allGains == 0) {
                        textStr = "0"
                    } else {
                        textStr = (100 * allGains / allAmount).toFixed(2) + '%';
                    }

                } else {
                    textStr = formatNum(allGains);
                }

                chrome.browserAction.setBadgeText({
                    text: textStr
                });
                let color = isDuringDate() ?
                    allGains >= 0 ?
                        "#F56C6C" :
                        "#4eb61b" :
                    "#4285f4";
                // chrome.browserAction.setBadgeBackgroundColor({
                //     color: color
                // });
            }
            if (request.type == "endInterval") {
                endInterval();
            }
            if (request.type == "startInterval") {
                startInterval(request.id);
            }
            if (request.type == "refreshOption") {
                switch (request.data.type) {
                    case "showBadge":
                        showBadge = request.data.value;
                        break;
                    case "BadgeContent":
                        BadgeContent = request.data.value;
                        break;
                    case "BadgeType":
                        BadgeType = request.data.value;
                        break;
                }
                getData();
            }
            if (request.type == "refreshBadge") {
                let textstr = null;
                if (BadgeType == 1) {
                    textstr = request.data.gszzl + '%';
                } else {
                    textstr = formatNum(request.data.gains);
                }
                chrome.browserAction.setBadgeText({
                    text: textstr
                });
                let color = isDuringDate() ?
                    request.data.gszzl >= 0 ?
                        "#F56C6C" :
                        "#4eb61b" :
                    "#4285f4";
                // chrome.browserAction.setBadgeBackgroundColor({
                //     color: color
                // });
            }
        }
    },
    browserAction: {
        setBadgeText: function (txtObj) {
            document.title = txtObj.text
        }
    }
}