module.exports = (dbModel, req, res, next, cb)=>{
	switch(req.method){
		case 'POST':
		send(dbModel,req,res,next,cb)
		break

		default:
		error.method(req, next)
		break
	}

}

function send(dbModel,req,res,next,cb){
	var data = req.body || {}
	if(data['connectorId']==undefined || data['connectorPass']==undefined || data['connectionType']==undefined)
		return next({code:'WRONG_PARAMETER',message:'connectorId, connectorPass, connectionType are required.'})

	switch(data.connectionType){
		case 'mssql':
		data.command='MSSQL_QUERY'
		break
		case 'mysql':
		data.command='MYSQL_QUERY'
		break
		default:
		data.command=data.command || data.connectionType || ''
		break
	}

	connector.sendCommand({
		connectorId:data.connectorId,
		connectorPass:data.connectorPass
	},
	(data.command || ''),
	data,
	(result)=>{
		if(result.success){
			cb(result.data)
		}else{
			next(result.error)
		}
	})

	
}

