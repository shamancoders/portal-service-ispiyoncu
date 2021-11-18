var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var logger = require('morgan')
var favicon = require('serve-favicon')
var methodOverride = require('method-override')

//var indexRouter = require('./routes/index')
var dbLoader = require('./db/db-loader')
var httpServer = require('./lib/http-server.js')

global.staticValues = require('./resources/static-values.json')
global.version = '20210916'


global.app = express()
var cors = require('cors')
app.use(cors())
var flash = require('connect-flash')

app.use(favicon(path.join(__dirname, 'resources', 'web-icon.png')))

app.use(logger('dev'))
app.use(bodyParser.json({ limit: "100mb" }))
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 50000 }))
app.use(cookieParser())
app.use(methodOverride())

//indexRouter(app)

app.set('port', config.httpserver.port)

// global.fileImporter = require('./lib/file_importer')
// global.documentHelper = require('./lib/document_helper')
// global.printHelper = require('./lib/print_helper')
// global.programs=require('./services/programs/programs')
global.auth = require('./lib/rest-helper')(config.passport_api)

process.on('uncaughtException', function(err) {
	errorLog('Caught exception: ', err)

	if(config.status != 'development') {
		mail.sendErrorMail(`${(new Date()).yyyymmddhhmmss()} ${app.get('name')} Error`, errObj)

	}
})


module.exports = () => {
	httpServer(app, (err, server, port) => {
		dbLoader((err) => {
			if(!err) {
				require('./routes/index')(app)
				global.socketHelper = require('./lib/socket-helper')
				socketHelper.start(server, (token,cb) => {
					auth.request('/passport', {method:'POST', body:{token:token}}, {}, (err, resp) => {
						if(!err) {
							cb(null,resp.data)
						} else {
							cb(err)
						}
					})
				})

				testControllers(false)
			} else {
				errorLog(err)
			}
		})
	})
}



/* [CONTROLLER TEST] */
function testControllers(log) {
	moduleLoader(path.join(__dirname, 'controllers'), '.controller.js', (log ? 'controllers checking' : ''), (err, holder) => {
		if(err)
			throw err
		else {
			eventLog(`checking controllers OK ${Object.keys(holder).length.toString().yellow}`)
		}
	})
}