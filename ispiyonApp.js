
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var logger = require('morgan')
var favicon = require('serve-favicon')

global.jwt = require('jsonwebtoken')



var indexRouter = require('./routes/index')
var dbLoader = require('./db/db-loader')
var httpServer=require('./bin/http-server.js')

global.app = express()
var cors = require('cors')
app.use(cors())
var flash = require('connect-flash')

app.use(logger('dev'))
app.use(bodyParser.json({limit: "100mb"}))
app.use(bodyParser.urlencoded({limit: "100mb", extended: true, parameterLimit:50000}))
app.use(cookieParser())

indexRouter(app)

testControllers(false)

app.set('name',require('./package').name)
app.set('version',require('./package').version)
app.set('port',config.httpserver.port)

module.exports=()=>{
	httpServer(app,(err,server,port)=>{
		global.socketHelper=require('./lib/socket-helper')
		socketHelper.start(server)
		dbLoader((err)=>{
			if(!err){
				
			}else{
				errorLog(err)
			}
		})
	})
}


process.on('uncaughtException', function (err) {
	errorLog('Caught exception: ', err)
	
	// mail.sendErrorMail(`Err ${config.status} ${app.get('name')}`,err,(mailErr,info)=>{
	// 	if(mailErr)
	// 		console.log(`mailErr:`,mailErr)
	// 	console.log(`mail info:`,info)
	// 	process.exit(0)
	// })

})

/* [CONTROLLER TEST] */
function testControllers(log){
	moduleLoader(path.join(__dirname,'controllers'),'.controller.js',(log?'controllers checking':''),(err,holder)=>{
		if(err)
			throw err
		else{
			eventLog(`checking controllers OK ${Object.keys(holder).length.toString().yellow}`)
		}
	})
}
