var express = require('express');
var router = express.Router();
var dbCon = require('../dao/dbCon');
var uuidV4 = require("uuid/v4");
var sd_time = require("silly-datetime");
//引入art-template，并延展.ejs
var art_temp = require("art-template");
require.extensions[".ejs"] = art_temp.extension;
//引入multer和md5依赖
var multer = require("multer");
var md5 = require("md5");

var client = dbCon.connect();


function getDateTime(){
	return sd_time.format(new Date(), 'YYYY-MM-DD hh:mm:ss');
}

function getDate(dateTime){
    return sd_time.format(dateTime, "YYYY-MM-DD");
}

function calcuByteLength(text){
    var bf = new Buffer(text);
    var byte = bf.length,
        byte_str = "";
    if (byte>1048576) {
        byte_str = (byte/1048576).toFixed(0)+"MB";
    }else if(byte>1024){
        byte_str = (byte/1024).toFixed(1)+"KB";
    }else{
        byte_str = byte+"B";
    }
    return byte_str;
}

router.post("/getSearchNote", function(req, res, next){
	var req_body = req.body;
	var keyword = req_body.keyword,
		user_id = req.session.islogin.user_id;

	var get_sql = "select note_id,note_name,note_type,note_abstract,show_modify,note_size "+
    "from note where note_name LIKE '%"+keyword+"%' order by modify_time DESC";
    
	dbCon.newestAndSearch(client, get_sql, function(err, result){
		if(err) throw err;
		if(!err){
			var list_data = result,
				list_dom = "";
			for (var i = 0; i < list_data.length; i++) {
				list_dom += search_bar_item_temp({
					item: list_data[i]
				});
			}
			res.send({
				msg: "notes get successfully",
				list_dom: list_dom,
				is_get: true
			});
		}
	});


});
router.get('/home', function(req, res) {
    var folder_list_data = [],
        view_list_data = [];

    if (req.session.islogin) {
        res.locals.islogin = req.session.islogin;
    }
    if (req.cookies.islogin) {
        req.session.islogin = req.cookies.islogin;
    }
    var user_msg = res.locals.islogin;

    dbCon.folderSelect(client, user_msg.user_id, function(err,result){
        if(err) throw err;
        if(!err){
            var max_level = 1,
                temp_arr = [],
                temp_2d_arr = [];
            for (var i = 0; i < result.length; i++) {                
                if (result[i].folder_level>max_level) {
                    max_level = result[i].folder_level;
                }
                result[i].sub_list = [];
                temp_arr.push(result[i]);
            }
            for (var i = 0; i < max_level; i++) {
                temp_2d_arr.push(new Array());
            }
            for (var i = 0; i < temp_arr.length; i++) {
                temp_2d_arr[temp_arr[i].folder_level-1].push(temp_arr[i]);
            }
            arrRecur(folder_list_data, temp_2d_arr, 0, max_level, "root");

            var note_select_opt = {
                belong_folder_id: "root",
                user_id: user_msg.user_id
            };

            dbCon.noteSelect(client, note_select_opt, function(err,result){
                if(err) throw err;
                if(!err){
                    var view_list_data = result;
                    res.render('home', {
                        title: '首页',
                        user_msg: res.locals.islogin, 
                        side_data: folder_list_data,
                        search_data: view_list_data
                    });
                }
            });            
        }
    }); 

    function arrRecur(sub_list, temp_2d_arr, cur_level, max_level, par_folder_id){
        cur_level++;
        if(cur_level>max_level){
            return false;
        }else{

            for (var i = 0; i < temp_2d_arr[cur_level-1].length; i++) {
                var this_folder = temp_2d_arr[cur_level-1][i];

                if (this_folder.par_folder_id === par_folder_id) {
                    sub_list.push(this_folder);
                    arrRecur(
                        this_folder.sub_list, 
                        temp_2d_arr, 
                        cur_level, 
                        max_level,
                        this_folder.folder_id
                    );
                }
            }            
            
        }
    }
});

/* GET home page. */
router.get('/', function(req, res) {
    if (req.cookies.islogin) {
        req.session.islogin = req.cookies.islogin;
    }
    if (req.session.islogin) {
        res.locals.islogin = req.session.islogin;
        res.redirect("/home");
    }else{
        res.locals.islogin = req.session.islogin;
        res.redirect("/login");
    }
});
router.route('/login').get(function(req, res) {
    if (req.session.islogin) {
        res.locals.islogin = req.session.islogin;
    }

    if (req.cookies.islogin) {
        req.session.islogin = req.cookies.islogin;
    }
    res.render('login', {
        title: '用户登录',
        user: res.locals.islogin
    });
}).post(function(req, res) {
    result = null;
    dbCon.userSelect(client, req.body.username, function(result) {
        if (result[0] === undefined) {
            res.send('没有该用户');
        } else {
            if (result[0].password === req.body.password) {

                var user_msg = {
                    user_name: req.body.username,
                    user_id: result[0].user_id
                };
                req.session.islogin = user_msg;
                res.locals.islogin = req.session.islogin;
                res.cookie('islogin', res.locals.islogin, {
                    maxAge: 60000
                });
                res.redirect('/home');
            } else {
                res.redirect('/login');
            }
        }
    });
});

router.get('/logout', function(req, res) {
    res.clearCookie('islogin');
    req.session.destroy();
    res.redirect('/login');
});
router.get('/share/:share_note_id/:note_type', function(req, res, next) {
	// console.log('url参数对象 :',req.params);  
	// console.log('get请求参数对象 :',req.query);  
	// console.log('post请求参数对象 :',req.body);  
	// console.log('q的值为 :',req.params.share_note_id); 

    var	share_note_id = req.params.share_note_id,
		note_type = req.params.note_type;
	var get_opt = {
		note_id: share_note_id,
		share_note_get: true
	};

	dbCon.noteGet(client, get_opt, function(err, result){
		if (err) {
			throw err
		}else{
			var note_content = result[0].note_content,
				note_name = result[0].note_name;
			res.render("noteShare",{
				note_content: note_content,
				note_type: note_type,
				note_name: note_name
			});
		}
	});


    // console.log(req.headers.host);


});

router.route('/reg').get(function(req, res) {
    res.render('reg', {
        title: '注册'
    });
}).post(function(req, res) {
    var req_body = req.body;
    
    var user_msg = {
        user_id: uuidV4(),
        user_name: req_body.username,
        gender: req_body.gender,
        personal_desc: req_body.personal_desc,
        password: req_body.password,
        orgnazition_build_count: 1,
        created_at: getDateTime(),
        belong_org_id: "",
        note_mag_permisstion: 0
    };
    var sql_param =[
        user_msg.user_id,
        user_msg.user_name,
        user_msg.gender,
        user_msg.personal_desc,
        user_msg.password,
        user_msg.orgnazition_build_count,
        user_msg.created_at,
        user_msg.belong_org_id,
        user_msg.note_mag_permisstion
    ];
    dbCon.userInsert(client,
     sql_param,
     function(err) {
        if (err) throw err;
        if(!err){
            req.session.islogin = user_msg.user_name;
            res.locals.islogin = req.session.islogin;
            res.cookie('islogin', res.locals.islogin, {
                maxAge: 60000
            });
            res.redirect('/regMsg');
        }else {
            res.redirect('/regMsg');
        }

    });
});

router.route('/regMsg').get(function(req, res){
    if (req.session.islogin) {
        res.locals.islogin = req.session.islogin;
    }
    if (req.cookies.islogin) {
        req.session.islogin = req.cookies.islogin;
    }
    var html = res.render('regMsg', {
        msg: '注册成功',
        user: res.locals.islogin
    });
});


router.route('/userMsgModify').get(function(req, res) {

}).post(function(req, res) {
    var req_body = req.body;
    
    var user_id = req.session.islogin.user_id;
    var user_msg = {
        user_name: req_body.username,
        gender: req_body.gender,
        personal_desc: req_body.personal_desc,
        password: req_body.password,
        user_id: user_id
    };
    dbCon.userUpdate(client,
     user_msg,
     function(err) {
        if (err) throw err;
        if(!err){
            res.clearCookie('islogin');
            req.session.destroy();
            res.redirect('/login');
        }

    });
});
router.post("/delFolder",function(req, res, next){
	
	var req_body = req.body;

	var start_level;

	start_level = req_body.folder_level,
	start_folder_id = req_body.folder_id;


    var user_msg = req.session.islogin;

    var delete_folders = [];

    delete_folders.push(start_folder_id);

    var folder_affected_rows = 0,
        note_affected_rows = 0;

	dbCon.folderSelect(client, user_msg.user_id, function(err,result){
		if(err) throw err;
		if(!err){
			var max_level = 1,
                temp_arr = [],
                temp_2d_arr = [];
            for (var i = 0; i < result.length; i++) {                
                if (result[i].folder_level>max_level) {
                    max_level = result[i].folder_level;
                }
                result[i].sub_list = [];
                temp_arr.push(result[i]);
            }
            for (var i = 0; i < max_level; i++) {
                temp_2d_arr.push(new Array());
            }
            for (var i = 0; i < temp_arr.length; i++) {
                temp_2d_arr[temp_arr[i].folder_level-1].push(temp_arr[i]);
            }
            arrRecur(
                delete_folders, 
                temp_2d_arr, 
                start_level, 
                max_level, 
                start_folder_id
            );
            dbCon.folderDel(client, delete_folders, function(err, result){
                if(err) throw err;
                if(!err){
                    folder_affected_rows = result.affectedRows;
                    var set_str = "",
                        tail = ",";
                    for (var i = 0; i < delete_folders.length; i++) {
                        if(i===delete_folders.length-1){
                            tail = "";
                        }
                        set_str+= "'"+delete_folders[i]+"'"+tail;
                    }
                    var condition = " belong_folder_id in ("+set_str+")";
                    dbCon.noteDel(client, condition, function(err, result){
                        if(err) throw err;
                        if(!err){
                            note_affected_rows = result.affectedRows;
                            if(folder_affected_rows===delete_folders.length){
                                res.send({
                                    is_delete_all: true,
                                    msg: "删除成功"
                                });
                            }else{
                                res.send({
                                    is_delete_all: false,
                                    msg: "删除失败"
                                });
                            }
                        }
                    });
                }
            });
		}
	});
	function arrRecur(list, temp_2d_arr, cur_level, max_level, par_folder_id){
		cur_level++;
        if(cur_level>max_level){
            return false;
        }else{
            for (var i = 0; i < temp_2d_arr[cur_level-1].length; i++) {
                var this_folder = temp_2d_arr[cur_level-1][i];

                if (this_folder.par_folder_id === par_folder_id) {
                    list.push(this_folder.folder_id);
                    arrRecur(
                        list, 
                        temp_2d_arr, 
                        cur_level, 
                        max_level,
                        this_folder.folder_id
                    );
                }
            }            
            
        }
	}

});
router.post("/delNote",function(req, res, next){
	
	var req_body = req.body;

	var condition = "note_id='"+req_body.note_id+"'";

	dbCon.noteDel(client, condition, function(err, result){
		if(err) throw err;
		if (!err) {
			var is_delete = result.affectedRows>0;
			res.send({
				msg: "删除成功",
				is_delete: is_delete
			});
		}
	})

});
router.post("/getNewestNote", function(req, res, next){
	var req_body = req.body;
	var time_a_week = sd_time.format(new Date(new Date().getTime() - 86400000*7)),
		user_id = req.session.islogin.user_id;

	var get_sql = "select note_id,note_name,note_type,note_abstract,show_modify,note_size "+
    "from note where owner_id='"+user_id+"' and created_at>'"+time_a_week+"' order by modify_time DESC";
    
	dbCon.newestAndSearch(client, get_sql, function(err, result){
		if(err) throw err;
		if(!err){
			var list_data = result,
				list_dom = "";
			for (var i = 0; i < list_data.length; i++) {
				list_dom += search_bar_item_temp({
					item: list_data[i]
				});
			}
			res.send({
				msg: "notes get successfully",
				list_dom: list_dom,
				is_get: true
			});
		}
	});


});
var side_bar_item_temp = require("../views/sideItemTemp.ejs");

router.post("/newFolder",function(req, res, next){
	

	var folder_id = uuidV4();
	var req_body = req.body;

	var user_msg = {};
	if(req.session.islogin){
		user_msg = req.session.islogin;
	}
	var created_at = getDateTime(),
		modify_time = created_at;
	var new_folder_msg = {
		folder_id: uuidV4(),
		folder_name: "新建文件夹",
		folder_level: parseInt(req_body.par_folder_level)+1,
		belong_id: user_msg.user_id,
		par_folder_id: req_body.par_folder_id,
		created_at: getDateTime(),
		modify_time: modify_time
	};
	var sql_param = [
		new_folder_msg.folder_id,
		new_folder_msg.folder_name,
		new_folder_msg.folder_level,
		new_folder_msg.belong_id,
		new_folder_msg.par_folder_id,
		new_folder_msg.created_at,
		new_folder_msg.modify_time
	];

	dbCon.folderInsert(client, sql_param, function(err){
		if (err) throw err;
		if(!err){
			var item_data = {
				folder_name: new_folder_msg.folder_name,
				folder_level: new_folder_msg.folder_level,
				folder_id: new_folder_msg.folder_id
			};
			var item_html = side_bar_item_temp({
				item: item_data
			});
			res.send({
				msg:"folder inited success",
				dom_data: item_html,
				folder_id: new_folder_msg.folder_id
			});
		}
	});
});

var search_bar_item_temp = require("../views/searchItemTemp.ejs");

router.post("/newNote", function(req, res, next){
	
	var req_body = req.body;
	
	var user_msg = req.session.islogin;

	var created_at = getDateTime(),
		modify_date = getDate(created_at);
	var note_msg = {
		note_id: uuidV4(),
		note_name: "新建笔记",
		note_type: req_body.type,
		owner_id: user_msg.user_id,
		belong_folder_id: req_body.belong_folder_id,
		created_at: created_at,
		modify_time: created_at,
		show_modify: modify_date,
		note_content: "",
		note_abstract:"",
		note_size: "0B"
	};

	var sql_param = [
		note_msg.note_id,
		note_msg.note_name,
		note_msg.note_type,
		note_msg.owner_id,
		note_msg.belong_folder_id,
		note_msg.created_at,
		note_msg.modify_time,
		note_msg.show_modify,
		note_msg.note_content,
		note_msg.note_abstract,
		note_msg.note_size
	];

	dbCon.noteInsert(client, sql_param, function(err,result){
		if (err) throw err;
		if(!err){
			var item_data = {
				note_name: note_msg.note_name,
				note_type: note_msg.note_type,
				note_id: note_msg.note_id,
				note_abstract: note_msg.note_abstract,
				modify_date: note_msg.modify_date,
				note_size: note_msg.note_size
			};
			var item_html = search_bar_item_temp({
				item: item_data
			});

			res.send({
				msg: "note inited success",
				dom_data: item_html
			});
		}
	});
});

router.post("/getNoteList",function(req, res, next){
	
	var req_folder = req.body.belong_folder_id;

	var list_dom = "",
		list_data = [];

	var user_msg = req.session.islogin,
		sql_param = {
			user_id: user_msg.user_id,
			belong_folder_id: req_folder
		};

	dbCon.noteSelect(client, sql_param, function(err, result){
		if(err) throw err;
		if(!err){
			list_data = result;
			for (var i = 0; i < list_data.length; i++) {
				list_dom += search_bar_item_temp({
					item: list_data[i]
				});
			}
			res.send({
				msg: "folder's notes get successfully",
				list_dom: list_dom
			});
		}
	});

	

});
router.post("/saveNote",function(req, res, next){
	var req_body = req.body;

	var save_opt = {
		user_id: req.session.islogin.user_id,
		note_content: req_body.note_content,
		note_id: req_body.note_id,
		note_abstract: req_body.note_abstract,
		note_size: calcuByteLength(req_body.note_content),
		show_modify: getDate(getDateTime())
	};

	dbCon.noteSave(client, save_opt, function(err, result){
		if(err) throw err;
		if(!err){
			var affected_row = result.affectedRows;
			if(affected_row>0){				
				res.send({
					is_saved: true,
					msg: "内容修改成功",
				});
			}
		}
	});


});
router.post("/getNote", function(req, res, next){
	
	var req_body = req.body;

	var note_id = req_body.note_id;

	var get_opt = {
		note_id: note_id
	};

	dbCon.noteGet(client, get_opt, function(err, result){
		if(err) throw err;
		if(!err){
			var content = result[0].note_content;
			res.send({
				is_get: true,
				note_content: content
			})
		}
	});


});
router.post("/rename",function(req, res, next){
	
	var req_body = req.body;

	var modify_time = getDateTime();
	if(req_body.entity_type==="note"){
		req_body.show_modify = getDate(modify_time);
	}
	req_body.modify_time = modify_time;

	if (req_body.val.length>20) {
		res.send({
			msg: "名字太长了，要不短点？",
			is_tooLong: true
		});
	}else{
		dbCon.renameFun(client,req_body,function(err,result){
			if (err) throw err;
			if(!err){
				var is_affected = result.affectedRows>0?true:false;
				res.send({
					msg: req_body.entity_type+" rename success",
					is_tooLong: false,
					new_name: req_body.val,
					is_affected: is_affected
				});
			}
		});
	}

	
});
router.post("/verBack",function(req, res, next){
	var req_body = req.body;

	var back_opt = {
		note_id: req_body.belong_note_id,
		ver_id: req_body.ver_id
	};
	dbCon.verBack(client, back_opt, function(err,result){
		if(err) throw err;
		if(!err){
			var is_affected = result.affectedRows>0;
			res.send({
				is_back:is_affected
			});
		}
	});
});
router.post("/verDel",function(req, res, next){
	var req_body = req.body;
	var ver_id = req_body.ver_id;

	dbCon.verDel(client, ver_id, function(err,result){
		if(err) throw err;
		if(!err){
			console.log(result);
			var is_affected = result.affectedRows>0;
			res.send({
				is_del:is_affected
			});
		}
	});

});
var ver_item_temp = require("../views/verItemTemp.ejs");
router.post("/verGet",function(req, res, next){
	var req_body = req.body,
		get_opt = {};
	if(req_body.is_belong_id==="true"){
		
		get_opt = {
			select_opt: "note_id,created_at",
			where_opt: "belong_note_id='"+req_body.belong_note_id+"'"
		};

		dbCon.verGet(client, get_opt, function(err,result){
			if(err) throw err;
			if(!err){
				var is_get = result.length>0;
				if (is_get) {
					var list_dom = "";
					for (var i = 0; i < result.length; i++) {
						result[i].created_at = sd_time
						.format(result[i].created_at, 
							"YYYY-MM-DD hh:mm");
						list_dom+= ver_item_temp({
							item: result[i]
						});
					}
					res.send({
						is_get: is_get,
						list_dom: list_dom
					});
				}else{
					res.send({
						is_get: is_get
					});
				}
			}
		});
	}else{
		get_opt = {
			select_opt: "note_content",
			where_opt: "note_id='"+req_body.ver_id+"'"
		};
		dbCon.verGet(client, get_opt, function(err,result){
			if(err) throw err;
			if(!err){
				console.log(result);
				var is_get = result.length>0;
				var note_content = result[0].note_content;
				res.send({
					is_get: is_get,
					note_content: note_content
				});
			}
		});
	}

	

	
});
router.post("/verSave",function(req, res, next){
	var req_body = req.body;

	var ver_note_msg = {
		note_content: req_body.note_content,
		note_abstract: req_body.note_abstract,
		belong_note_id: req_body.belong_note_id,
		note_id: uuidV4(),
		note_type: req_body.note_type,
		created_user_id: req.session.islogin.user_id,
		created_at: getDateTime()
	};

	var insert_val = [
		ver_note_msg.note_id,
		ver_note_msg.belong_note_id,
		ver_note_msg.note_type,
		ver_note_msg.created_at,
		ver_note_msg.created_user_id,
		ver_note_msg.note_content,
		ver_note_msg.note_abstract
	];

	dbCon.verSave(client, insert_val, function(err,result){
		if(err) throw err;
		if(!err){
			var is_affected = result.affectedRows>0;
			if (is_affected) {
				res.send({
					is_saved: is_affected
				});
			}
		}
	});

	

});

module.exports = router;