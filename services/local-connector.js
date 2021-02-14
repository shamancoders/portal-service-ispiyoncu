var minVersion='01.00.0002'


var net = require('net')
var tcpPORT = config.tcpserver.port
var clients = []
var clientRequests=[]
var serviceName=`[connector]`.yellow
net.Socket.prototype.clientid = ''
net.Socket.prototype.connectorId = ''
net.Socket.prototype.connectorPass = ''
net.Socket.prototype.version = ''
net.Socket.prototype.uuid = ''
net.Socket.prototype.lastcheck = new Date()


function request_CONNECT(sc,data){
    
    db.local_connectors.findOne({connectorId:data.connectinfo.id,connectorPass:data.connectinfo.password,uuid:data.connectinfo.uuid},function(err,doc){
        if(err){
            util.socketwrite(sc,util.resPackage(data.connectinfo,data.command,{success:false,error:{code:'REJECTED',message:'Connection failed'}},data.requestid))
        }else{
            if(doc==null){
                eventLog('data.connectinfo:',data.connectinfo)
                util.socketwrite(sc,util.resPackage(data.connectinfo,data.command,{success:false,error:{code:'REJECTED',message:'ID or PASSWORD was wrong'}},data.requestid))
                return                
            }
            
            
            
            var bFound= false
            clients.forEach((e,index)=>{
            	if(e.connectorId==data.connectinfo.id && e.connectorPass==data.connectinfo.password  && e.uuid==data.connectinfo.uuid){
                  bFound=true
                  
                  e.lastcheck=new Date()
                  util.socketwrite(clients[i],util.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid))
                  return
              }
            })
            
            if(bFound==false){
                sc.connectorId=data.connectinfo.id
                sc.connectorPass=data.connectinfo.password
                sc.uuid=data.connectinfo.uuid
                sc.lastcheck=new Date()
                sc.version=data.params.version || ''
                util.socketwrite(sc,util.resPackage(data.connectinfo,'CONNECT',{success:true,data:'CONNECTED'},data.requestid))
            }
            clients.forEach((e,index)=>{
            	eventLog(`client[${index}].connectorId: ${e.connectorId}`)
            })
            doc.lastOnline=new Date()
            doc.version=data.params.version || ''
            doc.platform=data.params.platform || ''
            doc.architecture=data.params.architecture || ''
            doc.release=data.params.release || ''
            doc.hostname=data.params.hostname || ''
            doc.lastError=''
            
            doc.save((err,doc2)=>{
                if(!err){
                    if(data.params.version<minVersion){
                        var params={url:'https://portal.tr216.com/downloads/localconnector.zip',version:minVersion}
                        eventLog('connectore update komutu gonder')
                        exports.sendCommand(data.connectinfo,'UPDATE',params,(result)=>{
                            eventLog('UPDATE result:',result)
                            if(!result.success){
                                if(result.error!=undefined){
                                    doc2.lastError=result.error.code + ' - ' + result.error.message
                                    doc2.save()
                                }
                                
                            }
                            
                        })
                        
                    }
                }
            })
            
           
        }
    })
}


function request_NEWPASS(sc,data){

    if(data.params.newPassword==undefined){
        util.socketwrite(sc,util.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR0',message:'newPassword is required.'}},data.requestid))
    }else{
        db.local_connectors.findOne({connectorId:sc.connectorId,connectorPass:sc.connectorPass,uuid:sc.uuid},function(err,doc){
            if(err){
                util.socketwrite(sc,util.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR1',message:err.message}},data.requestid))
            }else{
                
                if(doc==null){
                    util.socketwrite(sc,util.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR2',message:'ID or PASSWORD was wrong'}},data.requestid))
                }else{
                    sc.lastcheck=new Date()
                    doc.lastOnline=new Date()
                    doc.connectorPass=data.params.newPassword
                    

                    doc.save(function(err,doc2){
                        if(!err){
                            var result={success:true,data:{id:doc2.connectorId,password:doc2.connectorPass,uuid:doc2.uuid}}
                            util.socketwrite(sc,util.resPackage(data.connectinfo,'NEW_PASS',result,data.requestid))
                            sc.connectorPass=doc2.connectorPass
                            sc.uuid=doc2.uuid
                        }else{
                            util.socketwrite(sc,util.resPackage(data.connectinfo,'NEW_PASS',{success:false,error:{code:'NEW_PASS_ERROR',message:err.message}},data.requestid))
                        }
                        
                        
                    })
                }
                
                
            }
        })
    }
}


function request_NEWID(sc,data){
    var d={connectorPass: util.randomNumber(1001,9998).toString(),uuid:uuid.v4(), ip:sc.remoteAddress}

    var newresonance=new db.local_connectors(d)

    newresonance.save((err,doc)=>{
        if(err){
            var result={success:false,error:{code:err.name,message:err.message}}
            util.socketwrite(sc,util.resPackage(data.connectinfo,data.command,result,data.requestid))

        }else{
            sc.connectorId=doc.connectorId
            sc.connectorPass=doc.connectorPass
            sc.uuid=doc.uuid
            sc.lastcheck=new Date()
            util.socketwrite(sc,util.resPackage(data.connectinfo,data.command,{success:true,data:{id:doc.connectorId,password:doc.connectorPass,uuid:doc.uuid}},data.requestid))
        }
    })
}

function keepAlive(sc,data){
    
    db.local_connectors.findOne({connectorId:data.connectinfo.id,connectorPass:data.connectinfo.password,uuid:data.connectinfo.uuid},function(err,doc){
        if(err){
            
            util.socketwrite(sc,util.resPackage(data.connectinfo,'KEEPALIVE',{success:false,error:{code:'REJECTED',message:'Connection failed'}},data.requestid))
        }else{
            
            if(doc==null){
                
                util.socketwrite(sc,util.resPackage(data.connectinfo,'KEEPALIVE',{success:false,error:{code:'REJECTED',message:'ID or PASSWORD was wrong'}},data.requestid))
                return                
            }
            sc.lastcheck=new Date()
            doc.lastOnline=new Date()
           
            
            eventLog('keepAlive params:',data.params)
            doc.save(function(err,doc2){
                var result={success:true, data:(new Date()).yyyymmddhhmmss()}
                util.socketwrite(sc,util.resPackage(data.connectinfo,'KEEPALIVE',result,data.requestid))
                
            })
            
        }
    })
} 

// 5 dk uzerindeki istekleri temizler
function Cleaner_clientRequests(){
    var i=0
    while(i<clientRequests.length){
        if(clientRequests[i].requesttime<(new Date())){
            var datediff=((new Date())-clientRequests[i].requesttime)/1000
            if(datediff>60){
                var timeoutresult={success:false,error:{code:'TIMEOUT', message:'Timeout'}}
                clientRequests[i].callback(timeoutresult)
                clientRequests.splice(i,1)
            }else{
                i++
            }
        }else{
            //if something was wrong. request time bigger than now
            var datediff=(clientRequests[i].requesttime-(new Date()))/1000
            if(datediff>10){
                var result={success:false,error:{code:'TIMESYNCERROR', message:'Time sync error'}}
                clientRequests[i].callback(result)
                clientRequests.splice(i,1)
            }else{
                i++
            }
        }
    }
}

// 5 dk uzerindeki istekleri temizler
function Cleaner_resonanceClient(){
    var i=0
    while(i<clients.length){
        if(clients[i].lastcheck<(new Date())){
            var datediff=((new Date())-clients[i].lastcheck)/1000
            if(datediff>120){
                // clients[i].close(function(){
                    
                // })
                clients[i].destroy()
                delete clients[i]
                clients.splice(i,1)
            }else{
                i++
            }
        }else{
            i++
        }
    }
}

function destroyClient(sc){
    var i=0
    while(i<clients.length){
        if(clients[i].clientid==sc.clientid){
            clients[i].destroy()
            delete clients[i]
            clients.splice(i,1)
            return
        }else{
            i++
        }
    }
}

exports.getResonanceClientRequestQueue =()=>clientRequests

exports.sendCommand=(connectinfo,command,params,callback)=>{
    
    var summary=''
    var bFound=false
    if(connectinfo.id!=undefined && connectinfo.connectorId==undefined)
    	connectinfo.connectorId=connectinfo.id

    if(connectinfo.password!=undefined && connectinfo.connectorPass==undefined)
    	connectinfo.connectorPass=connectinfo.password

    clients.forEach((e,index)=>{
    	if(e.connectorId==connectinfo.connectorId && e.connectorPass==connectinfo.connectorPass ){
          var reqid=uuid.v4()
          util.socketwrite(
              e,
              util.reqPackage(
                  {id:e.connectorId,password:e.connectorPass,uuid:e.uuid},
                  command,params,reqid
              ),function(err){
                  if(!err){
                      clientRequests.push({requestid:reqid, requesttime:(new Date()), callback:callback})
                  }else{
                      callback({success:false,error:{code:'NOT_CONNECTED',message:"Connector is not connected"}})
                  }
              })

         
          bFound=true
          
          return
      }
    })
    

    if(bFound==false){
        eventLog(`"${connectinfo.connectorId}" resonance bagli degil`)
        callback({success:false,error:{code:'NOT_CONNECTED',message:`"${connectinfo.connectorId}" Connector is not connected`}})
    }
}



exports.run=require('./run.js')

function taskCleaner(){
	setInterval(function () {
	    
	    Cleaner_clientRequests()
	    Cleaner_resonanceClient()
	}, 15000)
}

function tcpListener(cb){
	var tcpserver = net.createServer(function (sc) {
	    clients.push(sc)
	    sc.clientid = uuid.v4()// clients.length
	    
	    eventLog(`${serviceName} client connected : ${sc.remoteAddress},${sc.remotePort}`)
	    eventLog(`${serviceName} client id : ${sc.clientid}`)
	    eventLog(`${serviceName} total connections : ${clients.length}`)
	    

	    sc.on('end', function () {
	        eventLog(`${serviceName} client disconnected : ${sc.clientid}`)
	        destroyClient(sc)
	        eventLog(`${serviceName} total connections : ${clients.length}`)
	    })

	    sc.on('error', function (err) {
	       errorLog(`${serviceName} id: ${sc.clientid} error:${err.code} - ${err.message}`)
	        if(err.code=='ERR_STREAM_DESTROYED' || err.code=='ECONNRESET'){
	            destroyClient(sc)
	        }
	    })


	    var buffer = ''
	    sc.on('data', function (data) {
	        try {
	            
	            buffer += data.toString('utf8')

	            var data2
	            if (buffer.charCodeAt(buffer.length - 1) == 0) {
	                data2= util.socketread(buffer.substring(0, buffer.length - 1)) 
	                buffer=''
	            }else{
	                return
	            }

	            var ondata=JSON.parse(data2)
	            if(ondata.type=="REQUEST" || ondata.type=="request"){
	                switch(ondata.command){
	                    case 'CONNECT':
	                        request_CONNECT(sc,ondata)
	                    break
	                    case 'NEW_ID':
	                        request_NEWID(sc,ondata)
	                    break
	                    case 'NEW_PASS':
	                        request_NEWPASS(sc,ondata)
	                    break
	                    case 'KEEPALIVE':
	                        keepAlive(sc,ondata)
	                       
	                        break
	                    default:
	                        sc.lastcheck=new Date()
	                        var result={success:false,error:{code:'UNKNOWN_COMMAND',message:'Unknown command:'}}
	                        util.socketwrite(sc,util.resPackage(ondata.connectinfo,ondata.command,result,ondata.requestid))
	                }

	            }else if(ondata.type=="RESPONSE" || ondata.type=="response"){
	            	clientRequests.forEach((e,index)=>{
	            		if(e.requestid==ondata.requestid){
                      e.callback(ondata.data)
                      clientRequests.splice(index,1)
                      return
                  }
	            	})
	              
	            }else{
	            	errorLog(`${serviceName} Error data :`, data2)
	            }
	            
	        } catch ( err ) {
	            eventLog(err)
	        }
	            
	    })
	   
	})

	tcpserver.listen(tcpPORT, function (err) {
	    if (!err) {
	    	eventLog(`${serviceName} service running on TCP port:${tcpPORT.toString().yellow}`)
	    	cb(null)
	    } else {

	        errorLog(`${serviceName} Error :`, err)
	        cb(err)
	    }
	    
	})
}

exports.getResonanceClientList=()=>clients

exports.start=(cb)=>{
	tcpListener((err)=>{
		if(!err){
			taskCleaner()
		}else{
			cb(err)
		}
	})
}



