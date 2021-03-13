global.fs=require('fs')
global.path=require('path')
global.appName=require(path.join(__root,'package.json')).name

require('colors')

function simdi()
{
	var s= yyyymmddhhmmss(new Date())
	return s

	function yyyymmddhhmmss(tarih, middleChar) {
		var yyyy = tarih.getFullYear().toString()
	    var mm = (tarih.getMonth() + 1).toString() // getMonth() is zero-based
	    var dd = tarih.getDate().toString()
	    var HH = tarih.getHours().toString()
	    var min = tarih.getMinutes().toString()
	    var sec = tarih.getSeconds().toString()
	    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) + (middleChar?middleChar:' ') + (HH[1]?HH:"0" + HH[0]) + ':' + (min[1]?min:"0" + min[0]) + ':' + (sec[1]?sec:"0" + sec[0]) 
	  }
	}

	global.eventLog=function(obj,...placeholders){
		console.log(simdi() ,obj,...placeholders)
	}

	global.errorLog=function(obj,...placeholders){
		console.error(simdi().red ,obj,...placeholders)
	}

	global.privateConfig={}
	if(fs.existsSync(path.join(__root,'config.json'))){
		privateConfig=require(path.join(__root,'private-config.json'))
	}else if(fs.existsSync(path.join(__root,'../private-config-all.json'))){
		privateConfig=require(path.join(__root,'../private-config-all.json'))
	}

	if(global.privateConfig[appName]!=undefined){
		Object.keys(global.privateConfig[appName]).forEach((key)=>{
			global.privateConfig[key]=global.privateConfig[appName][key]
		})
	}

	global.config={}
	if(fs.existsSync(path.join(__root,'config.json'))){
		config=require(path.join(__root,'config.json'))
	}else if(fs.existsSync(path.join(__root,'../config-all.json'))){
		config=require(path.join(__root,'../config-all.json'))
	}


//proje folderda config varsa onu al yoksa bir uste bak


if(process.argv[2]=='localhost' || process.argv[2]=='-l' || process.argv[2]=='-dev' || process.argv[2]=='-development'){
	global.config.status='development'
}else{
	global.config.status='release'
}

if(global.config[appName]!=undefined){
	Object.keys(global.config[appName]).forEach((key)=>{
		global.config[key]=global.config[appName][key]
	})
}

global.util = require(path.join(__root,'/bin/util'))
global.mail = require(path.join(__root,'/bin/mail'))
global.taskHelper=require(path.join(__root,'/bin/taskhelper'))
global.restServices={}
Object.keys(config.restServices).forEach((key)=>{
	if(config.restServices[key].enabled===true){
		global.restServices[key]=require(path.join(__root,'/bin/rest-helper'))(config.restServices[key].url)
	}
})

global.appInfo=()=>{
	console.log('-'.repeat(70))
	console.log(`${'Application Name:'.padding(25)} ${app.get('name').brightYellow}`)
	console.log(`${'Version:'.padding(25)} ${app.get('version').yellow}`)
	console.log(`${'Http Port:'.padding(25)} ${(app.get('port') || '').toString().yellow}`)
	if(global.config[appName]!=undefined){
		Object.keys(global.config[appName]).forEach((key)=>{
			if(!['httpserver','mongodb'].includes(key)){
				if(typeof global.config[appName][key]=='object' || Array.isArray(global.config[appName][key])){
					console.log(`${key.padding(25)} ${JSON.stringify(global.config[appName][key],null,4).yellow}`)
				}else{
					console.log(`${key.padding(25)} ${global.config[appName][key].toString().yellow}`)
				}
			}
		})
	}
	console.log(`${'Running Mode:'.padding(25)} ${config.status.cyan}`)
	console.log(`${'Uptime Started:'.padding(25)} ${simdi().yellow}`)
	console.log('-'.repeat(70))
}