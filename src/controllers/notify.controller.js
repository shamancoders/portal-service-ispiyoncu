module.exports = (dbModel, req, res, next, cb)=>{
	switch(req.method){
		case 'POST':
		post(dbModel,req,res,next,cb)
		break

		default:
		error.method(req, next)
		break
	}

}

function post(dbModel,req,res,next,cb){

	var dizi=[]
	var data = req.body || {}
	
	data._id=undefined
	data.dbId=dbModel._id
	if(data.memberId==undefined){
		db.dbdefines.findOne({_id:dbModel._id},(err,dbDoc)=>{
			if(dberr(err,next)){
				if(dbnull(dbDoc,next)){
					data.memberId=dbDoc.owner
					data.dbId=dbModel._id
					dizi.push(clone(data))
					if(dbDoc.authorizedMembers){
						dbDoc.authorizedMembers.forEach((e)=>{
							data.memberId=e.memberId
							dizi.push(clone(data))
						})
					}
					kaydet(dizi,next,cb)
				}
			}
		})
	}else{
		data.dbId=dbModel._id
		dizi.push(data)
		kaydet(dizi,next,cb)
	}

	
}


function kaydet(dizi,next,callback){
	var index=0
	function calistir(cb){
		if(index>=dizi.length)
			return cb()
		var newDoc = new db.notifications(dizi[index])
		if(!epValidateSync(newDoc,cb))
			return

		newDoc.save((err, newDoc2)=>{
			if(dberr(err,cb)){

				// socketHelper.sendTotalUnread(newDoc2.memberId,newDoc2.dbId)
				socketHelper.notify(newDoc2.memberId,newDoc2.dbId,newDoc2.text,newDoc2.status,newDoc2.icon)
				index++
				setTimeout(calistir,0,cb)
			}
		})
	}

	calistir((err)=>{
		if(!err){
			callback()
		}else{
			next(err)
		}
	})
}