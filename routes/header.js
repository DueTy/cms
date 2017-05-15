var express = require('express');
var router = express.Router();
var userCon = require('../dao/dbCon');
var uuidV4 = require("uuid/v4");
var changesets = require("changesets");
var dmpod = require("diff-match-patch");
var dmp = new dmpod.diff_match_patch();

//引入art-template，并延展.ejs
var art_temp = require("art-template");
require.extensions[".ejs"] = art_temp.extension;
//引入multer和md5依赖
var multer = require("multer");
var md5 = require("md5");


var diff0 = "<div tabindex=\"1\" spellcheck=\"false\" contenteditable=\"true\" class=\"note-view\" style=\"visibility: visible;\"><div class=\"highlight-view\" style=\"display: none;\"></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view43\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">模块化的好处：</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view44\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">1、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">可维护性：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">根据定义，没个模块都是独立的。良好设计的模块会尽量与外界代码分隔开，减少关联，以便独立地维护和改进。维护一个独立的代码团，要比一整团代码来的轻松。</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view45\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">2、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">命名空间：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">在JavaScript中，最高级别函数外定义的变量都是全局变量（所有人都能访问到），也正因为如此，当一些无关代码碰巧使用同名变量时， 就会遇到“命名空间污染”的问题。</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view46\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">3、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">可复用性：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">在日常中写的代码，有时候觉得自己写的老好老好的，但是下次想用的时候，又要去找，然后复制过来改参数，那为什么不写一个类似插件的东西，对代码进行封装呢。不是复制粘贴，而是直接引用优秀的旧代码。</span></div></div></div>";
var diff1 = "<div tabindex=\"1\" spellcheck=\"false\" contenteditable=\"true\" class=\"note-view\" style=\"visibility: visible;\"><div class=\"highlight-view\" style=\"display: none;\"></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view43\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">模块化的好处：</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view44\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">1、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">可维护性：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">根据定义，没个模块都是独立的。良好设计的模块会尽量与外界代码分隔开，减少关联，以便独立地维护和改进。维护一个独立的代码团，要比一整团代码来的轻松。</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view45\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">2、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">命名空间：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">在JavaScript中，最高级别函数外定义的变量都是全局变量（所有人都能访问到），也正因为如此，当一些无关代码碰巧使用同名变量时， 就会遇到“命名空间污染”的问题。</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view46\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">3、</span><span style=\"color: rgb(255, 0, 0); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">可复用性：</span><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">在日常中写的代码，有时候觉得自己写的老好老好的，但是下次想用的时候，又要去找，然后复制过来改参数，那为什么不写一个类似插件的东西，对代码进行封装呢。不是复制粘贴，而是直接引用优秀的旧代码。</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view47\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">4、这是一条测试版本数据</span></div></div></div>"; 
var diff2 = "<div tabindex=\"1\" spellcheck=\"false\" contenteditable=\"true\" class=\"note-view\" style=\"visibility: visible;\"><div class=\"highlight-view\" style=\"display: none;\"></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view43\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">web前端（实习生）---杜豪</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view44\"><div class=\"para-text\" style=\"min-height: 25px; line-height: 1.875; text-align: left; font-size: 14px;\"><br></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view45\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">已做: 双旦建行提测·</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view46\"><div class=\"para-text\" style=\"min-height: 25px; line-height: 1.875; text-align: left; font-size: 14px;\"><br></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view47\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">正做: tffui更新（left-menu），双旦建行bug修改</span></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view48\"><div class=\"para-text\" style=\"min-height: 25px; line-height: 1.875; text-align: left; font-size: 14px;\"><br></div></div><div class=\"block-view paragraph-view\" data-yne-cid=\"view49\"><div class=\"para-text\" style=\"line-height: 1.875; text-align: left; font-size: 14px;\"><span style=\"color: rgb(57, 57, 57); font-family: -apple-system, BlinkMacSystemFont, &quot;PingFang SC&quot;, Helvetica, Tahoma, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, 微软雅黑, SimSun, 宋体, Heiti, 黑体, sans-serif; font-size: 14px; background-color: transparent; font-weight: normal; font-style: normal; text-decoration: none;\">要做: 途风精品优化方案需求梳理</span></div></div></div>";

// var computeChangesets = changesets.comp;

// var c01 = computeChangesets(diff0,diff1);
// var c02 = computeChangesets(diff0,diff2);

console.log(decodeURI(dmp.patch_toText(dmp.patch_make(diff0,diff1))));

var side_test_data = [];
for (var i = 0; i < 20; i++) {
    var obj = {
        folder_name: "笔记"+(i+1),
        level: 1,
        folder_id: "folder"+(i+1)+"lv1",
        sub_list:[
        	{
        		folder_name: "level21",
        		level:2,
        		folder_id: "folder"+(i+1)+"lv21",
        		sub_list: [
        			{
        				folder_name: "level3",
        				level:3,
        				folder_id: "folder"+(i+1)+"lv3",
        				sub_list:[]
        			}
        		]
        	},{
        		folder_name: "level22",
        		level:2,
        		folder_id: "folder"+(i+1)+"lv22",
        		sub_list: [
        		]
        	}
        ]
    };
    side_test_data.push(obj); 
}

var search_test_data = [];
for (var i = 0; i < 8; i++) {
	var note_type = i%2===0?"note":"mk";
	var obj = {
		note_type: note_type
	};
	search_test_data.push(obj);
}