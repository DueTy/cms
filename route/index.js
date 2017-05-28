var express=require("express"),router=express.Router(),userCon=require("../dao/dbCon"),uuidV4=require("uuid/v4"),art_temp=require("art-template");require.extensions[".ejs"]=art_temp.extension;for(var multer=require("multer"),md5=require("md5"),side_test_data=[],i=0;i<20;i++){var obj={folder_name:"笔记"+(i+1),level:1,folder_id:"folder"+(i+1)+"lv1",sub_list:[{folder_name:"level21",level:2,folder_id:"folder"+(i+1)+"lv21",sub_list:[{folder_name:"level3",level:3,folder_id:"folder"+(i+1)+"lv3",sub_list:[]}]},{folder_name:"level22",level:2,folder_id:"folder"+(i+1)+"lv22",sub_list:[]}]};side_test_data.push(obj)}for(var search_test_data=[],i=0;i<8;i++){var note_type=i%2==0?"note":"mk",obj={note_type:note_type};search_test_data.push(obj)}router.get("/home",function(e,s){e.session.islogin&&(s.locals.islogin=e.session.islogin),e.cookies.islogin&&(e.session.islogin=e.cookies.islogin),s.render("home",{title:"首页",user:s.locals.islogin,side_data:side_test_data,search_data:search_test_data})}),router.get("/",function(e,s){e.cookies.islogin&&(e.session.islogin=e.cookies.islogin),e.session.islogin&&(s.locals.islogin=e.session.islogin),s.render("index",{title:"首页",user:s.locals.islogin,side_data:side_test_data,search_data:search_test_data})}),router.route("/login").get(function(e,s){e.session.islogin&&(s.locals.islogin=e.session.islogin),e.cookies.islogin&&(e.session.islogin=e.cookies.islogin),s.render("login",{title:"用户登录",user:s.locals.islogin})}).post(function(e,s){client=userCon.connect(),result=null,userCon.userSelect(client,e.body.username,function(i){void 0===i[0]?s.send("没有该用户"):i[0].password===e.body.password?(e.session.islogin=e.body.username,s.locals.islogin=e.session.islogin,s.cookie("islogin",s.locals.islogin,{maxAge:6e4}),s.redirect("/home")):s.redirect("/login")})}),router.get("/logout",function(e,s){s.clearCookie("islogin"),e.session.destroy(),s.redirect("/")}),router.route("/reg").get(function(e,s){s.render("reg",{title:"注册"})}).post(function(e,s){client=userCon.connect();var i=e.body.username,o=e.body.password,r=uuidV4();userCon.userInsert(client,i,o,r,function(o){if(o)throw o;o?s.redirect("/regMsg"):(e.session.islogin=i,s.locals.islogin=e.session.islogin,s.cookie("islogin",s.locals.islogin,{maxAge:6e4}),s.redirect("/regMsg"))})}),router.route("/regMsg").get(function(e,s){e.session.islogin&&(s.locals.islogin=e.session.islogin),e.cookies.islogin&&(e.session.islogin=e.cookies.islogin);s.render("regMsg",{msg:"注册成功",user:s.locals.islogin})});var side_bar_item_temp=require("../views/sideItemTemp.ejs");router.post("/newFolder",function(e,s,i){var o={folder_name:"新建文件夹",level:1,folder_id:"newfolderno1"},r=side_bar_item_temp({item:o});s.send({msg:"folder inited success",dom_data:r})});var search_bar_item_temp=require("../views/searchItemTemp.ejs");router.post("/newNote",function(e,s,i){var o={note_type:e.body.type},r=search_bar_item_temp({item:o});s.send({msg:"note inited success",dom_data:r})}),module.exports=router;