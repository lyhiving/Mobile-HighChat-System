var disip="";

function HighChat(){
	document.f2.n.disabled = false;		//フォーム名前
	document.f2.login.disabled = false;	//ボタン入退室
	document.f.c.disabled = true;		//フォームメッセージ
	//document.f.hatsugen.disabled = true;	//ボタン発言
	document.f2.n.value=this.GetCookie("name_chat");

}
HighChat.prototype={
	startid: null,  //最も古いログのid
	lastid: null,
	userdata: {},
	userlist: [],
	loginid: null,
	sessionid: [],
	
	//更新を調べる
	check: function(func){
		this.message("<b>更新中</b>");
		this.submit("check", func);
	},
	//userlistからユーザー一覧を表示する
	writeuserlist: function(userlist){
		var node = this.gid("disp");
		var output="";
		var cntrom="";
		var cnt=0;
		for(var i=0, l=userlist.length; i<l; i++){
			var thisid=userlist[i];
			var thisdata=this.userdata[thisid];
//			if(tmp[0]=="(ROM)"){
//				cntrom++;
//			}else{
				output+="<a href=\"javascript:alert( title='"+thisdata.ip.join(".")+" / "+thisdata.ua+"')\">"+thisdata.name+"</li>";
				cnt++;
//			}
		}
    	node.innerHTML ="<span style='font-size:x-large;'>入室"+cnt+(cntrom?"(ROM"+cntrom+")":"")+"</span>"+output+"</ul>";
	},
	//発言する
	post: function(message, func){
		if(message=="") return;
		this.submit("comment="+encodeURIComponent(message)+(this.lastid==null?"":"&last="+this.lastid+"&sessionid="+this.sessionid), func);
		document.f.c.value = "";
	},
	//通常のレスポンス処理
	standardResponse: function(responseText){
		try{
			var obj=JSON.parse(responseText);
		}catch(e){
			this.message("パースエラー: "+responseText);
			return;
		}
		if(obj.error!=false){
			this.message("エラー! "+obj.errormessage);
		}
		this.write(obj.newcomments);
                if(!this.startid || (obj.startid && this.startid>obj.startid))this.startid=obj.startid;
                this.lastid=obj.lastid;
                this.userlist=obj.userlist;
                this.sessionid=obj.sessionid;
		if(obj.myid==null){
			if(this.loginid!=null){//自分のidが入っててnullが与えられた場合はログアウト
				this.loginid=null;
//				this.logout();
				this.inout(document.f2.n.value);
				return;
			}
		}else{
			if(this.loginid==null){//自分のidが空っぽでidが与えられた場合ログイン(自動継続ログイン)
				this.loginid=obj.myid;
				this.login();
			}
		}

		for(var i=0, l=obj.newusers.length; i<l; i++){
			var thisuser=obj.newusers[i];
			this.userdata[thisuser.id]={
				name: thisuser.name,
				last: thisuser.last,
				ip: this.getIpByNum(thisuser.ip),
				ua: thisuser.ua
			}
		}
		this.writeuserlist(obj.userlist);
		this.message("更新済");
		this.lastObj=obj;
	},
	//XHR送信
	submit: function(send, func, to){    //to:送り先
		var http = this.LetsHTTP();
		http.parent=this;
		if(!http)return;
                if(!to)to="chat.php";

		http.onreadystatechange = func || function(){
			if(this.readyState == 4 && this.status == 200){
				this.parent.standardResponse(this.responseText);
			}
		};
		http.parent=this;
		http.open("POST", to, true);
		http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		var send2=send+"&userlist="+JSON.stringify(this.userlist)+"&last="+this.lastid+"&sessionid="+this.sessionid;
		http.send(send2);
	},
	//ip配列から色を算出
	getColorByIp: function(ip){
		return "rgb("+Math.floor(parseInt(ip[0])*0.75)+", "+
				Math.floor(parseInt(ip[1])*0.75)+", "+
				Math.floor(parseInt(ip[2])*0.75)+")";
	},

	//発言を表示
	//mode:falseなら従来通り（上に付け足し）　trueならもっと読むモード（下に付け足し）
	write: function(comments,mode){
		if(comments.length==0)return;
                if(mode)comments=comments.reverse();
                
		for(var i=0, l=comments.length;i<l;i++){
			var line=comments[i];
			var ip=this.getIpByNum(line.ip);
			var colorna2=this.getColorByIp(ip);

			ip=ip.join(".");
			if(ip==disip) continue;
			var D = new Date(line.date*1000).formatTime();
			if(/NaN/.test(D)){continue}

			var newline1 = document.createElement("dt");
			newline1.style.color=colorna2;
			newline1.className="name";
			newline1.innerHTML=line.name;

			var newline2 = document.createElement("dd");
			newline2.style.color=colorna2;
			newline2.innerHTML=[
				line.comment
					.replace(/(http:\/\/gyazo.com\/[\x21\x23-\x3b\x3d-\x7e]+?\.png)/ig, "<a href=\"$1\" target='_blank'>[Gyazo]</a>")
					.replace(/([^">])http(s?):\/\/([^\s\[<　]+)/gi, "$1<a href=\"option.php?url=http$2://$3\" target='_blank'>[URL]</a>")
					.replace(/^http(s?):\/\/([^\s\[<　]+)/gi, "<a href=\"option.php?url=http$1://$2\" target='_blank'>[URL]</a>")
					.replace(/\[small\](.+?)$/ig, "<small>$1</small>")
					.replace(/\[math\]([ -~]+?)\[\/math\]/ig, "<a href=\"option.php?math=$1\" target=\"_blank\">[Math]</a>")
					.replace(/\[s\](.+?)\[\/s\]/ig, "<s>$1</s>")
					.replace(/\[s\](.+?)$/ig, "<s>$1</s>")
					.replace(/#0(\d)(\d\d)/ig, "<a href='/m/$1/$2.php' target='_blank'>#0$1$2</a>")
					.replace(/#([1-9]\d)(\d\d)/ig, "<a href='/m/$1/$2.php' target='_blank'>#$1$2</a>"),
				" <br><span class='small'>(",D,", ",ip,")</span>"
			].join("");

                        if(!mode){
                            //上に付け足し
                            this.gid("log").insertBefore(newline2,this.gid("log").firstChild);
                            this.gid("log").insertBefore(newline1,this.gid("log").firstChild);
                        }else{
                            //下に付け足し
                            this.gid("log").appendChild(newline1);
                            this.gid("log").appendChild(newline2);
                        }
		}
	},
	//入退室
	inout: function(name) {
		if(document.f2.n.value == "" || document.f2.n.value.length>25){return}

		if(this.loginid==null) {
			this.submit("login="+encodeURIComponent(name), function(){
				if(this.readyState == 4 && this.status == 200){
					try{
						var obj=JSON.parse(this.responseText);
					}catch(e){
						this.parent.message(e+": "+this.responseText);
						return;
					}
					if(obj.error!=false){
						this.parent.message("エラー! "+obj.errormessage);
						return;
					}
					this.parent.login();
					this.parent.SetCookie("name_chat", document.f2.n.value);
					this.parent.loginid=obj.id;
					this.parent.standardResponse(this.responseText);
					this.parent.message("入室しました: "+obj.id);
				}
			});


		} else {
			this.submit("logout=1", function(){
				if(this.readyState == 4 && this.status == 200){
					try{
						var obj=JSON.parse(this.responseText);
					}catch(e){
						this.parent.message(e+": "+this.responseText);
						return;
					}
					if(obj.error!=false){
						this.parent.message("エラー! "+obj.errormessage);
						return;
					}
					this.parent.logout();
					this.parent.loginid=null;
					this.parent.standardResponse(this.responseText);
				}
			});
		}
	},
	//もっと読む
	motto: function(){
		var th=this;
		if(!this.startid)return;
		this.submit("motto="+this.startid, function(){
			if(this.readyState == 4 && this.status == 200){
					this.parent.mottoResponse(this.responseText);
			}
		},"chalog.php");
	},
	//もっと読む用レスポンスを返す
	mottoResponse:function(responseText){
		try{
			var obj=JSON.parse(responseText);
		}catch(e){
			this.message("パースエラー: "+responseText);
			return;
		}
		if(obj.error!=false){
			this.message("エラー! "+obj.errormessage);
		}
		this.write(obj.newcomments,true);
		if(!this.startid || this.startid>obj.startid)this.startid=obj.startid;
	},
	//入室時の表示
	login: function(name){
		if(name!=null) document.f2.n.value=name;
		document.f2.n.disabled = true;		//フォーム名前
		document.f.c.disabled = false;		//フォームメッセージ
		document.f2.login.value = "退室";

		document.f.c.focus();

	},
	//退室時の表示
	logout: function(){
		document.f2.n.disabled = false;		//フォーム名前
		document.f.c.disabled = true;		//フォームメッセージ
		document.f2.login.value = "入室";

		document.f2.n.focus();
	},
	//数字からip配列を得る
	getIpByNum: function(num){
		var ret=[];
		for(var i=3; i>=0; i--){
			ret[i]=num%256;
			num=parseInt(num/256);
		}
		return ret;
	},
	//０で埋める
	zeroFill: function(num,keta){
		num=String(num);
		while(1){
			if(num.length>=keta) break;
			num="0"+num;
		}
		return num;
	},

	//クッキー関連開始 GetCookie("名前");で値を取得、SetCookie("名前", 値);
	GetCookie: function(key){
		var tmp = document.cookie + ";";
		var index1 = tmp.indexOf(key, 0);
		if(index1 != -1){
			tmp = tmp.substring(index1,tmp.length);
			var index2 = tmp.indexOf("=",0) + 1;
			var index3 = tmp.indexOf(";",index2);
			return(unescape(tmp.substring(index2,index3)));
		}
		return("");
	},

	SetCookie: function(key, val){
		document.cookie = key + "=" + escape(val) + ";expires=Fri, 31-Dec-2030 23:59:59;";
	},

	LetsHTTP: function()	//Let's HTTP!!
	{
		var http = null;
		try{
			http = new XMLHttpRequest();
		}catch(e){
			try{
				http = new ActiveXObject("Msxml2.XMLHTTP");
			}catch(e){
				try{
					http = new ActiveXObject("Microsoft.XMLHTTP");
				}catch(e){
					return null;
				}
			}
		}
		return http;
	},
	gid: function(id){
		return document.getElementById(id);
	},
	//アラートなどのメッセージを表示
	message: function(mess){
		this.gid("status").innerHTML = mess;
	}
}

window.document.onkeydown = function (ev){
	var e = ev||event;
	if (e.keyCode == 116){
		e.keyCode = null;
		return false;
	}
}

String.prototype.mReplace = function(pat,flag){
	var temp = this;
	if(!flag){flag=""}
	for(var i in pat){
		var re = new RegExp(i,flag);
		temp = temp.replace(re,pat[i])
	}
	return temp;
};
//日付の書式
Date.prototype.format = "yyyy-mm-dd HH:MM:SS";
Date.prototype.formatTime = function(format){
	var yy;
	var o = {
		yyyy : ((yy = this.getYear()) < 2000)? yy+1900 : yy,
		mm   : this.getMonth() + 1,
		dd   : this.getDate(),
		HH   : this.getHours(),
		MM   : this.getMinutes(),
		SS   : this.getSeconds()
	}
	for(var i in o){
		if (o[i] < 10) o[i] = "0" + o[i];
	}
	return (format) ? format.mReplace(o) : this.format.mReplace(o);
}