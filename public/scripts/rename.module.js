define("renameWidget",function(require,exports,module){
	"use strict";

	(function($){

		if (!$) {
            return console.warn("widgetMenu needs jQuery");
        }
        $.fn.renameWidget = function(){
        	var _this = $(this),
        		_mask = $(".page-mask"),
        		_blk_show_cls = "rename-show",
        		_ipt_show_cls = "ipt-show";

    		return this.each(function(){
    			_this.addClass(_ipt_show_cls).trigger("select");
    			_mask.addClass(_blk_show_cls);

    			_this.on("keydown", renameComplete);

    			_mask.on("click contextmenu", renameComplete);
    		});
    		function renameComplete(e){
    			var e_type = e.type,
    				_val = _this.val();
    			if(e_type==="keydown"){
    				var keyCode = e.keyCode;
    				if (keyCode === 13) {
    					renameAjax(_val);    					
    				}
    			}else{
    				renameAjax(_val);
    			}    			
    		}
    		function renameAjax(val){

    			var this_par = _this.parents(".item-cont"),
    				pre_name = this_par.children(".btn-text");

    			if(val === ""){
					_this.val(pre_name.text());
    			}else{
    				var post_data = {
    					val: val,
    					folder_id: this_par.data("folder-id")
    				};

    				_this.val(val);
    				pre_name.text(val);

    				// $.ajax({
    				// 	url: "/rename",
    				// 	type: "POST",
    				// 	dataType: "JSON",
    				// 	data: post_data,
    				// 	success:function(data){
    				// 		if(data){
    				// 			rename_item.children(".btn-text").text(data.new_name);
    				// 		}
    				// 	}
    				// });
    			}
    			_this.removeClass(_ipt_show_cls);
    			_mask.removeClass(_blk_show_cls);
    		}        	
        };

	})(window.jQuery || require("jquery"));
});