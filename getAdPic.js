//配置服务相关内容
//配置node  web框架express
const express = require('express')
const port = 8082
const app = express()
//配置mongodb数据库相关内容
const request = require('request')


app.get('/',function(req,res){
    res.send('')
})
.listen(port,()=>{
    console.log('Server Running At '+port)
})

let getQueryString = (name,url) => {  //截取search
    var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)",'i');
    var r = url.substr(url.indexOf('?')+1).match(reg);
    if(r!=null){
        return  unescape(r[2])
    }else{
       return null; 
    } 
}


const baseUrl = 'http://dashboard.adtoken.one/dolphinads'
const Host = 'dashboard.adtoken.one'

//定义初始变量，避免返回的js报错
let location = {
    protocol : 'http'
}
let document = {
    charset :'windows-1252',
    write(){
    }
}
let window = {
    location:'http',
    OA_zones:''
}


//处理返回数据的方法
const getKeywords = (str,keyword) => {  //截取导航地址
    var reg = new RegExp(keyword+"='.+?'",'ig')
    return str.match(reg)
}

const getUrl = (str) => {  //将获取到的图片喝和导航地址进行处理
    return str.substring(str.indexOf('=')+2,str.length-1)
}
const unescapeHTML = (a)=>{//解码
    a = "" + a;
   return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\\/g,'').replace(/\"/g,'');
}

//模拟浏览器发送请求，所需要的请求头
const headers = {  
    "Access-Control-Allow-Origin" : "*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36" ,
    "Upgrade-Insecure-Requests": 1,
    "Pragma" : "no-cache",
    "Host" : Host,
    "Cookie" : "OAID=0da80651e5e6ce91137dfa432573cc3b; OAZBLOCK=5.1521772541_23.1522751283_24.1522154770; OXLCA=26.p6lvne-23; OABLOCK=26.1522757703_28.1522165013; OACAP=26.343_28.17; OAZCAP=5.12_23.343_24.2; OXLIA=26.p6lzd3-23; OAGEO=CN%7C%7C%7C%7C%7C%7C%7C%7C%7C%7C; OACBLOCK=2.1521772541_3.1521773222_6.1522046228_12.1522757703_13.1522165013_15.1523429211_18.1523429211_16.1523429211; OACCAP=2.14_3.30_6.55_12.348_13.17_15.118_18.165_16.137; OASCCAP=16.1_18.1_15.1",
    "Connection" : "keep-alive",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Accept": "*/*"
}


const  responseData = (data) =>{
    return {
        data,
        msg:'success',
        ret:0
    }
}

const  responseErrData = (msg) =>{
    return {
        msg,
        ret:1
    }
}

const dolphinAds = {
    3001:79
}




//根据网站Id和区域Id拉取广告
app.get('/getAds', (req, res) => {
    const search = req._parsedUrl.search
    const websitesId =  getQueryString('websitesId',search)
    const zoneId =  getQueryString('zoneId',search)
    const dolphinAdZoneId = getQueryString('dolphinAdZoneId',search)

    const sendData = res
    if(!req._parsedUrl.search){
        sendData.send(responseErrData('缺少参数'));
        return
    }
    if(websitesId){
        new Promise((resolve,reject) =>{
            let options = {
                method:'get',
                url: baseUrl + '/www/delivery/spcjs.php?id='+websitesId,
                headers: headers
            };
            request(options, (err, res, body) =>{ //spcjs
                if (err) {
                    sendData.send(responseErrData('request javaScriptTempleStr err'))
                }else {
                    try {
                        const scriptText = body
                        eval(scriptText)  //执行返回的结果
                        if(!OA_zoneids || !OA_zoneids[0]){  //有pubulish没有广告位
                             sendData.send(responseErrData('no ads'))
                        }
                        let options = { 
                            method:'get',
                            url:baseUrl + '/www/delivery/spc.php?zones=' + OA_zoneids + '&r=' + OA_r+'&loc=http://123.206.205.11&source=&charset=UTF-8',
                            headers: headers
                        }
                        resolve(options)
                    }
                    catch(err){
                        sendData.send(responseErrData('request err'))
                    }
                    
                }
            })
        }).then((res) =>{
            console.log(res)
            return new Promise((resolve,reject) =>{
                request(res, (err, res, body) => {
                    if(err){
                       sendData.send(responseErrData('request HtmlTempleStr err'))
                    }else {
                        eval(body); //执行字符串语句,得到的是一个所有广告的数组
                        // console.log(OA_output)
                        // console.log(`--------------------------分割线--------------------------------------`)
                        if(zoneId || dolphinAdZoneId){ //查找指定zone
                            let a = zoneId;
                            if(dolphinAdZoneId){
                                a = dolphinAds[dolphinAdZoneId]
                            }
                            console.log(a)
                            try {
                                const HtmlTempleStr = OA_output[a]
                                // console.log(HtmlTempleStr)
                                // console.log(`--------------------------分割线--------------------------------------`)
                                let location_url = getUrl(getKeywords(HtmlTempleStr,'href')[0])

                                let imgsrcs =  getKeywords(HtmlTempleStr,'src')
                                let ad_img_url =  getUrl(imgsrcs[0])
                                let impress_api = unescape(unescapeHTML(getUrl(imgsrcs[1])))

                                let adInfo = ['width','height','title','alt','target']
                                let adInfoData = {}
                                adInfo.forEach((v,i)=>{
                                    adInfoData[v] =  getUrl(getKeywords(HtmlTempleStr,v)[0])
                                })

                                // console.log(adInfoData)
                                // console.log(`--------------------------分割线--------------------------------------`)

                                var data = {
                                  location_url , ad_img_url,...adInfoData
                                }
                                // console.log(data)
                                // console.log(`--------------------------分割线--------------------------------------`)
                                let options = {
                                    method:'get',
                                    url: impress_api,
                                    headers: headers
                                };
                                let resolveData = {
                                    options,data
                                }
                                // console.log(resolveData)
                                // console.log(`--------------------------分割线--------------------------------------`)
                                resolve(resolveData)    
                            }
                            catch (err){
                                console.log(err)
                                sendData.send(responseErrData('request HtmlTempleStr err'))
                            }
                        }else{//查找websites下所有 zone
                            try{
                                OA_output = OA_output.filter((v,i)=>{
                                    return v && v.indexOf('<a')>-1
                                })
                                // console.log(OA_output)
                                // console.log(`--------------------------分割线 OA_output--------------------------------------`)
                                let adsList = [];
                                let adInfo = ['width','height','title','alt','target'] 
                                OA_output.forEach((v,i)=>{
                                    adsList[i] = {};
                                    adsList[i].location_url = unescape(unescapeHTML(getUrl(getKeywords(v,'href')[0])))
                                    adsList[i].ad_img_url =  getUrl( getKeywords(v,'src')[0])
                                    let impress_api = unescape(unescapeHTML(getUrl( getKeywords(v,'src')[1])))
                                    adsList[i].impress_api = impress_api
                                    adInfo.forEach((adInfokey,adInfoIndex)=>{
                                        adsList[i][adInfokey] =  getUrl(getKeywords(v,adInfokey)[0])
                                    })
                                
                                    
                                })
                                
                                sendData.send(responseData(adsList))
                            }
                            catch (err){
                                console.log(err)
                                sendData.send(responseErrData('request HtmlTempleStr err'))
                            }
                        }
                       
                    }
                })
            })
        }).then((resolveData) =>{
            // console.log(resolveData)
            // console.log(`--------------------------分割线--------------------------------------`)
            return new Promise((resolve,reject) =>{
                request(resolveData.options, (err, res, body) => {
                      // console.log(resolveData.options)
                      // console.log(`--------------------------请求结束--------------------------------------`)
                    if(err){
                        throw 'request imgpress err'
                    }else {
                        // console.log(resolveData.options)
                        // console.log(`--------------------------请求结束--------------------------------------`)
                        sendData.send(responseData(resolveData.data))
                    }
                })
            }) 
        })
    }else{
         sendData.send('no websitesId');
    }
});



//根据区域Id拉取广告
// app.get('/getAdInfo',(req, res) => {
//     const websitesId =  getQueryString('websitesId',req._parsedUrl.search)
//     const zoneId =  getQueryString('zoneId',req._parsedUrl.search)
//     const sendData = res
//     if(!req._parsedUrl.search){
//         sendData.send('缺少参数');
//         return
//     }
//     if(zoneId && websitesId){
//         new Promise((resolve,reject) =>{
//             let url = baseUrl + '/www/delivery/avw.php?zoneid='+zoneId+'&cb=INSERT_RANDOM_NUMBER_HERE&n=a2522711'
//             let options = {
//                 method:'get',
//                 url:url,
//                 headers: headers
//             }
//             request(options, (err, res, body) =>{
//                 if(err){
//                     throw err
//                 }else {
//                     console.log(body)
//                     var m3_r = Math.floor(Math.random()*99999999999);
//                     let url =  baseUrl + '/www/delivery/ajs.php?zoneid='+zoneId+'&cb='+m3_r+'&charset=windows-1252&loc=file:///C:/Users/ripple/Desktop/ins.html'
//                     let options = { 
//                         method:'get',
//                         url:url,
//                         headers: headers
//                     }
//                     resolve(options)
//                 }
//             })
//         }).then((res) =>{
//             return new Promise((resolve,reject) =>{
//                 request(res, (err, res, body) =>{
//                     if(err){
//                        throw err
//                     }else {
                        
//                         let HtmlTempleStr = unescapeHTML(body)
//                         var locationUrl = getKeywords(HtmlTempleStr,'href')[0]
//                         var imgUrl = getKeywords(HtmlTempleStr,'src')[0]
//                         locationUrl =  getUrl(locationUrl)
//                         imgUrl = getUrl(imgUrl)


//                         let adInfo = ['width','height','title','alt','target']
//                         let adInfoData = {}
//                         adInfo.forEach((v,i)=>{
//                             adInfoData[v] =  getUrl(getKeywords(HtmlTempleStr,v)[0])
//                         })


//                         var data = {
//                           locationUrl , imgUrl,...adInfoData
//                         }
//                         sendData.send(data)
//                     }
//                 })
//             })
//         })
//     }else{
//         sendData.send('参数错误');
//     }
// });
