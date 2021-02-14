
require('colors')
var request=require('request')
var parseString = require('xml2js').parseString
var js2xmlparser = require("js2xmlparser")
global.os=require('os')
global.uuid=require('uuid')

Date.prototype.yyyymmdd = function () {
	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) 
  }

  Date.prototype.yyyymmddhhmmss = function (middleChar) {
  	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) + (middleChar?middleChar:' ') + (HH[1]?HH:"0" + HH[0]) + ':' + (min[1]?min:"0" + min[0]) + ':' + (sec[1]?sec:"0" + sec[0]) 
  }

  Date.prototype.yyyymmddmilisecond = function () {
  	var yyyy = this.getFullYear().toString()
    var mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
    var dd = this.getDate().toString()
    var HH = this.getHours().toString()
    var min = this.getMinutes().toString()
    var sec = this.getSeconds().toString()
    var msec = this.getMilliseconds().toString()
    return yyyy + '-' + (mm[1]?mm:"0" + mm[0]) + '-' + (dd[1]?dd:"0" + dd[0]) + ' ' + (HH[1]?HH:"0" + HH[0]) + ':' + (min[1]?min:"0" + min[0]) + ':' + (sec[1]?sec:"0" + sec[0]) + '.' + msec 
  }


  Date.prototype.addDays = function(days)
  {
  	var dat = new Date(this.valueOf())
  	dat.setDate(dat.getDate() + days)
  	return dat
  }



exports.timeStamp = function () { return (new Date).yyyymmddhhmmss() }  //UTC time stamp


exports.datefromyyyymmdd = function (text) {
	var yyyy = Number(text.substring(0,4))
	var mm = Number(text.substring(5,7))
	var dd = Number(text.substring(8,10))
	var tarih=new Date(yyyy,mm-1,dd,5,0,0)
	return tarih
}


String.prototype.replaceAll = function (search, replacement) {
	var target = this
	return target.split(search).join(replacement)
}

exports.replaceAll= function (search, replacement) {
	var target = this
	return target.replace(new RegExp(search, 'g'), replacement)
}


global.atob=require('atob')
global.btoa=require('btoa')

global.tempLog=(fileName,text)=>{
	if(config.status!='development')
		return
	var tmpDir=os.tmpdir()
	if(config){
		if(config.tmpDir){
			tmpDir=config.tmpDir
		}
	}
	fs.writeFileSync(path.join(tmpDir,fileName),text,'utf8')
}

global.moduleLoader=(folder,suffix,expression,cb)=>{
	try{
		var moduleHolder={}
		var files=fs.readdirSync(folder)

		files.forEach((e)=>{
			let f = path.join(folder, e)
			if(!fs.statSync(f).isDirectory()){
				var fileName = path.basename(f)
				var apiName = fileName.substr(0, fileName.length - suffix.length)
				if (apiName != '' && (apiName + suffix) == fileName) {
					moduleHolder[apiName] = require(f)
				}
			}
		})

		cb(null,moduleHolder)
	}catch(e){
		errorLog(
		         `moduleLoader Error:
		         folder:${folder} 
		         suffix:${suffix}
		         expression:${expression}
		         `)
		cb(e)
	}
}

global.sendFileId=(dbModel,fileId,req,res,next)=>{
	if(fileId){
		dbModel.files.findOne({_id:fileId},(err,doc)=>{
			if(dberr(err,next)){
				if(dbnull(doc,next)){
					sendFile(doc,req,res,next)
				}
			}
		})
	}else{
		next({code:'WRONG_ID',message:'fileId bos'})
	}
}

global.sendFile=(file,req,res,next)=>{
	var tmpFile=path.join(os.tmpdir(),`${uuid.v4()}.api`)
	try{
		if(file.data){
			var fileName=file.fileName || 'file'
			var data=file.data
			if(file.data.indexOf('data:')==0 && file.data.indexOf('base64,')>-1){
				data=b64DecodeUnicode(file.data.split('base64,')[1])
			}else{
				data=file.data
			}

			fs.writeFileSync(tmpFile,data,'utf8')

			res.sendFile(tmpFile,{},(err)=>{
				fs.unlinkSync(tmpFile)
				if(err)
					next(err)
			})


		}else{
			next({code:'FILE_EMPTY',message:'Dosya icerigi bos'})
		}

	}catch(tryErr){
		if(fs.existsSync(tmpFile)){
			fs.unlinkSync(tmpFile)
		}
		next(tryErr)
	}

}


global.downloadFileId=(dbModel,fileId,req,res,next)=>{
	if(fileId){
		dbModel.files.findOne({_id:fileId},(err,doc)=>{
			if(dberr(err,next)){
				if(dbnull(doc,next)){
					downloadFile(doc,req,res,next)
				}
			}
		})
	}else{
		next({code:'WRONG_ID',message:'fileId bos'})
	}
}

global.downloadFile=(file,req,res,next)=>{
	var tmpFile=path.join(os.tmpdir(),`${uuid.v4()}.api`)
	try{
		if(file.data){
			var fileName=file.fileName || 'file'
			var data=file.data
			if(file.data.indexOf('data:')==0 && file.data.indexOf('base64,')>-1){
				data=b64DecodeUnicode(file.data.split('base64,')[1])
			}else{
				data=file.data
			}

			fs.writeFileSync(tmpFile,data,'utf8')

			res.download(tmpFile,fileName,(err)=>{
				fs.unlinkSync(tmpFile)
				if(err)
					next(err)
			})


		}else{
			next({code:'FILE_EMPTY',message:'Dosya icerigi bos'})
		}

	}catch(tryErr){
		if(fs.existsSync(tmpFile)){
			fs.unlinkSync(tmpFile)
		}
		next(tryErr)
	}

}

global.b64EncodeUnicode=(str)=>{
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	                                            function toSolidBytes(match, p1) {
	                                            	return String.fromCharCode('0x' + p1)
	                                            }))
}

global.b64DecodeUnicode=(str)=>{
	return decodeURIComponent(atob(str).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
	}).join(''))
}


global.clone=(obj)=>{
	return JSON.parse(JSON.stringify(obj))
}

global.iteration=(dizi, fonksiyon, interval=0, errContinue=false, callback)=>{
	var index=0
	var result=[]
	var errors=''

	function tekrar(cb){
		if(index>=dizi.length)
			return cb(null)
		if(config.status=='dev' && index>=3){
			return cb(null)
		}
		fonksiyon(dizi[index],(err,data)=>{
			if(!err){
				if(data) result.push(result)
					index++
				setTimeout(tekrar,interval,cb)
			}else{
				errorLog(`iteration():`,err)
				if(errContinue){
					errors +=`iteration(): ${err.message}\n`
					index++
					setTimeout(tekrar,interval,cb)
				}else{
					cb(err)
				}

			}
		})
	}

	tekrar((err)=>{
		if(!err){
			if(errContinue && errors!=''){
				callback({code:'IterationError',message:errors},result)
			}else{
				callback(null,result)
			}
		}else{
			callback(err,result)
		}

	})
}



var crypto = require('crypto'),
algorithm = 'aes-256-cbc',
password = 'metinalifeyyaz',
key = crypto.createHash('md5').update(password, 'utf-8').digest('hex').toUpperCase()

exports.encrypt=function(text){
	var iv = Buffer.alloc(16)
	var cipher = crypto.createCipheriv(algorithm, key, iv)

	var crypted = cipher.update(text.toString(),'utf8','hex')
	crypted += cipher.final('hex')
	return crypted
}

exports.decrypt=function(text){
	var iv = Buffer.alloc(16)
	var decipher = crypto.createDecipheriv(algorithm, key, iv)

	var dec = decipher.update(text.toString(),'hex','utf8')
	dec += decipher.final('utf8')
	return dec

}

exports.encryptbuffer=function(buffer){
	var iv = Buffer.alloc(16)
	var cipher = crypto.createCipheriv(algorithm, key, iv)

	var crypted = Buffer.concat([cipher.update(buffer),cipher.final()])
	return crypted
}

exports.decryptBuffer=function(buffer){
	var iv = Buffer.alloc(16)
	var decipher = crypto.createDecipheriv(algorithm, key, iv)
	var dec = Buffer.concat([decipher.update(buffer) , decipher.final()])
	return dec
}

exports.reqPackage=function(connectinfo, command, params,requestid) {
	requestid=requestid || uuid.v4()
	return JSON.stringify({ connectinfo:connectinfo, type : 'REQUEST', requestid:requestid, command: command || '', params:params || ''})
}

exports.resPackage=function(connectinfo, command, data,requestid) {
	requestid=requestid || uuid.v4()
	return JSON.stringify({ connectinfo:connectinfo, type : 'RESPONSE',requestid:requestid, command: command || '', data:data || ''})
}



exports.socketwrite=function(socket,data,callback){
	socket.write(exports.encrypt(data) + '\0',callback)
}

exports.socketread=function(data){
	return exports.decrypt(data.toString('utf-8'))
}



exports.getParameters=function(callback){
	var dbHelper = require('./dbhelper_mysql.js')
	var sql="SELECT * FROM `parameters` WHERE 1=1 " 
	
	dbHelper.query(sql, null, function (result) {
		if(!result.success){
			callback(null) 
		}else{
			var parameters={}
			result.data.rows.forEach((e)=>{
				parameters[e.ParamName]=e.ParamValue
			})
			
			callback(parameters)
		}
	})
}



global.b64EncodeUnicode=(str)=>{
	return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
	                                            function toSolidBytes(match, p1) {
	                                            	return String.fromCharCode('0x' + p1)
	                                            }))
}

global.b64DecodeUnicode=(str)=>{
	return decodeURIComponent(atob(str).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
	}).join(''))
}


global.encodeURIComponent2=(str)=>{
	return encodeURIComponent(str).replace(/[!'()*]/g, escape)
}


global.atob2=(str)=>{
	try{
		return b64DecodeUnicode(str)
	}catch(e){
		return str
	}
}

global.btoa2=(str)=>{
	try{
		return b64EncodeUnicode(str)
	}catch(e){
		return str
	}
}

exports.renderFiles=(files,data,cb)=>{
	try{
		if(typeof data=='string'){
			data=atob2(data)
			try{
				data=JSON.parse(data)
			}catch(err){

			}
		}else{
			if(data.files!=undefined){
				data.files.forEach((e)=>{
					e.data=atob2(e.data)
				})
			}
		}

		var renderedCode=''
		var includeCode=''
		var code=''
		files.forEach((e)=>{
			if(e.fileName=='index.ejs'){
				code=atob2(e.data)
				return
			}
		})

		code=code.replaceAll('include(','includeLocal(')
		code=code.replaceAll('encodeURIComponent(','encodeURIComponent2(')

		includeCode +=`\n<% \nfunction includeLocal(fileName){ \n`
			includeCode +=` switch(fileName){  \n`
				files.forEach((e)=>{
					if(e.fileName!='index.ejs'){
						includeCode +=` case '${e.fileName}' : \n`
						if(e.fileName.substr(-4)=='.ejs') {
							includeCode +=` case '${e.fileName.substr(0,e.fileName.length-4)}' :
							%>
							${atob2(e.data)}`
						}else {
							includeCode +=`%>
							${atob2(e.data)}`
						}
						includeCode +=`<% break \r\n`
					}
				})
				includeCode +=` default: %>

				<% break
			}
		} %>`

		code=includeCode + code


		renderedCode=ejs.render(code,{data:data})

		cb(null,renderedCode)
	}catch(err){
		errorLog(err)

		cb({code:err.name || 'EJS_RENDER_ERROR' ,name:err.name || 'EJS_RENDER_ERROR',message: err.message || err.toString()})
	}

}