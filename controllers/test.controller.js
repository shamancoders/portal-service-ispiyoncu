module.exports = (dbModel, req, res, next, cb)=>{
    switch(req.method){
        case 'POST':
        	test(dbModel,req,res,next,cb)
        break
        
        default:
        error.method(req, next)
        break
    }

}

function test(dbModel,req,res,next,cb){
	var data = req.body || {}

	if(data['connectorId']==undefined || data['connectorPass']==undefined || data['connectionType']==undefined)
		return next({code:'WRONG_PARAMETER',message:'connectorId, connectorPass, connectionType are required.'})

	switch(data.connectionType){
		case 'mssql':
		
		connector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
		                                                ,'MSSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
		                                                	if(result.success){
		                                                		cb(result.data)
		                                                	}else{
		                                                		next(result.error)
		                                                	}
		                                                	
		                                                })
		break
		case 'mysql':
		connector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
		                                                ,'MYSQL_CONNECTION_TEST',{connection:data.connection,query:''},(result)=>{
		                                                	if(result.success){
		                                                		cb(result.data)
		                                                	}else{
		                                                		next(result.error)
		                                                	}
		                                                })
		break
		default:
		connector.sendCommand({connectorId:data.connectorId,connectorPass:data.connectorPass}
		                                                ,'TIME',{},(result)=>{
		                                                	if(result.success){
		                                                		cb(result.data)
		                                                	}else{
		                                                		next(result.error)
		                                                	}
		                                                })
		break
	}
}

