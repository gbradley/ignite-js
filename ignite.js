/*
Ignite 0.12, built on 2009-07-11 19:36:29 GMT
copyright 2009 Graham Bradley
under the Creative Commons Attribution-Share Alike 3.0 license (http://creativecommons.org/licenses/by-sa/3.0/)

Report any bugs, comments at http://gbradley.co.uk/ignite or to hello@gbradley.co.uk
*/(function(){

	if (!Array.prototype.indexOf){
		Array.prototype.indexOf=function(elt,from){
			var len=this.length, from=from || 0;
			for (;from<len;from++){
				if (from in this && this[from]===elt) return from;
				}
			return -1;
			};
		Array.prototype.lastIndexOf=function(elt,from){
			var len=this.length, from=from || 0;
			for (;from>-1;from--){
				if (from in this && this[from]===elt) return from;
				}
			return -1;
			};
		Array.prototype.forEach=function(fn){
			var len=this.length, thisp = arguments[1];
			for (var i=0;i<len;i++){
				if (i in this) fn.call(thisp, this[i], i, this);
				}
			};
		Array.prototype.every=function(fun){
			var len = this.length, thisp = arguments[1];
			for (var i = 0; i < len; i++){
				if (i in this && !fun.call(thisp, this[i], i, this)) return false;
				}
			return true;
			};
		Array.prototype.some=function(fn){
			var len = this.length, thisp = arguments[1];
			for (var i=0;i<len;i++){
				if (i in this && fn.call(thisp, this[i], i, this)) return true;
				}
			return false;
			};
		Array.prototype.filter=function(fn){
			var len = this.length, res = [], thisp = arguments[1];
			for (var i=0;i<len;i++){
				if (i in this){
					var val=this[i];
					if (fn.call(thisp, val, i, this)) res.push(val);
					}
				}
			return res;
			};
		Array.prototype.map=function(fn){
			var len=this.length, res=new Array(len), thisp=arguments[1];
			for (var i=0;i<len;i++){
				if (i in this) res[i] = fn.call(thisp, this[i], i, this);
				}
			return res;
			};
		}

	var ign=function(o){
		return new ign.DOM.NodeGroup(o==window || o==document ? [o] : ign.config.queryEngine.apply(ign,arguments));
		};

	ign.config={};
	ign.version='0.12';
	
	var uid=1, UID='ignUID';
	
	ign.util={
		augment:function(){
			var a=[].slice.call(arguments), o=a.length ? a.shift() : {};
			a.forEach(function(p){ for (var y in p) o[y]=p[y]; });
			return this;
			},
		merge:function(a){
			var a=[].slice.call(a), i=0, l=a.length, b=[];
			for (;i<l;i++){
				if (a[i].constructor==Array) b=b.concat(a[i]);
				else b.push(a[i]);
				}
			return b;
			},
		split:function(args,req,opt){
			var l=args.length, j;
			if (req==l) return [0,args,0];	// arg count eq required count
			var r=[[],[],[]];
			while (l--){
				if (opt && l>=req && typeof args[l]=="object") r[2].unshift(args[l]);	// objects coming after req count
				else if (r[1].length<req) r[1].unshift(args[l]);	// args up to req count
				else r[0].unshift(args[l]);	// args before req
				}
			return r;
			}
		};
	
	ign.core={
		'Class':(function(){		// basic idea taken from John Resig's Simple Inheritance

			var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	
			var me=function Class(){};
			me.prototype.classname=function(){
				return this.constructor.name;
				};
	
			var supered=function(fn, obj, p){
				return fnTest.test(fn) ? function(){
					this._super=p ? obj._superclass.prototype[p] : obj;
					var r=fn.apply(this,arguments);
					delete this._super;
					return r;
					}: fn;
				};
		
			me.augment=function(){
				var i=arguments.length;
				while (i--){
					var o=arguments[i];
					for (var p in o) this.prototype[p] = (typeof o[p]=='function') ? supered(o[p], this, p) : o[p];
					}
				return this;
				};

			me.extend=function(){
				var args=[].slice.call(arguments), sub=args.shift(), sup=args.length && typeof args[0]=="function" ? args[0] : null, p=sup ? null : args;
				var Inherit=function(){};
				Inherit.prototype=sup ? sup.prototype : new this();
				sub=sup ? sub : supered(sub, this);
				sub.prototype=new Inherit();
				sub.prototype.constructor=sub;
				sub._superclass=sup || this;
				if (!sup){
					sub.extend=this.extend, sub.augment=this.augment;
					if (p && p.length) sub.augment.apply(sub,p);
					return sub;
					}
				else return this;
				};
	
			return me;
		})(),
		'Array':{
			unique:function(arr){		// return a new array of unique items
				var a=[];
				arr.forEach(function(x){
					if (a.indexOf(x)<0) a.push(x);
					});
				return a;
				},
			hash:function(arr,index){	// simulate a hash table
				var i=arr.length;
				while (i--) arr[arr[i][index]]=arr[i];
				},
			intersect:function(){	// like SQL's intersect
				var a=[], args=[].slice.call(arguments), arr=args.shift();
				arr.forEach(function(x){
					if (args.every(function(y){
						return y.indexOf(x)>=0;
						})) a.push(x);
					});
				return a;
				},
			minus:function(){		// like SQL's minus
				var args=[].slice.call(arguments), arr=args.shift();
				return arr.filter(function(x){
					return !(args.some(function(y){
						return y.indexOf(x)>=0;
						}));
					});
				},
			all:function(arr){			// test if all items evaluate to something
				return arr.every(function(x){ return !!x; });
				},
			none:function(arr){			// test if all items evaluate to nothing
				return arr.every(function(x){ return !x; });
				},
			any:function(arr){			// test if any items evaluate to something
				return arr.some(function(x){ return !!x; });
				},
			clean:function(){			// remove items that evaluate to false (default)
				var args=[].slice.call(arguments), arr=args.shift();
				return arr.filter(function(x){
					return args.length ? args.indexOf(x)<0 : !!x;
					});
				}
			},
		'String':{
			trim:function(str){					// um, trim
				return str.replace(/^(\s*)|(\s*)$/g,'');
				},
			repeat:function(str,n){					// repeat the string n times
				var a=[];
				for (var i=0;i<n;i++) a.push(str);
				return a.join('');
				},
			chunk:function(str,n){					// split into n-length chunks
				var t=str.length, a=[];
				for (var i=0;i<t;i+=n) a.push(str.substring(i,i+n));
				return a;
				},
			stripHTML:function(str){				// um, strip html
				var args=ign.util.merge(arguments), str=args.shift();
				return str.replace(args.length ? new RegExp("<(\/?"+args.join("|")+")[^>]*>","gi") : /<[^>]*>/g, '');
				},
			substitute:function(str,o,opt){			// substitute with {placeholders}
				var s=str, opt=opt || {};
				if (!'flags' in opt) opt.flags='g';
				for (var t in o) s=s.replace(new RegExp("{"+t.replace('$','\\$')+"}",opt.flags),o[t]);
				return s;
				},
			toCamelCase:function(str){
				var s=str,  m=s.match(/-[^-]/g);
				if (m){
					for (var i=0;i<m.length;i++) s=s.replace(m[i],m[i].replace('-','').toUpperCase());
					}
				return s;
				},
			toProperCase:function(str){
				str=str.toLowerCase().split(" ");
				for (var i=0;i<str.length;i++) str[i]=str[i].substring(0,1).toUpperCase()+str[i].substring(1,str[i].length);
				return str.join(" ");
				},
			toRegExp:function(str,opt){				// for handling special chars to regex
				if (!opt) opt={};
				if (!opt.flags) opt.flags='g';
				var s=str.replace(new RegExp('\\\\','g'),'\\\\');
				'$^[]./+?*'.split('').forEach(function(c){
					s=s.replace(new RegExp('\\'+c,'gi'),'\\'+c);
					});
				return new RegExp(s,opt.flags);
				},
			toHash:function(str,opt){
				var p={};
				str.split("&").forEach(function(s){
					s=s.split("=");
					p[s[0]]=opt && opt.decode ? decodeURIComponent(s[1]) : s[1];
					});
				return new ign.core.Hash(p);
				},
			toNodeGroup:function(str){
				var p=document.createElement(str.toString().match(/<option/) ? "select" : "div");
				p.innerHTML=str.toString();
				return new ign.DOM.NodeGroup([p]).children();
				},
			hexToRGB:function(str,arr){				// color conversion
				var v=str.replace(/^#/,'').chunk(2).map(function(h){
					return parseInt(h,16);
					});
				return arr ? v : 'rgb('+v.join(",")+')';
				},
			RGBToHex:function(str){
				return '#'+str.replace(/[rgb\(\)\s]/ig,'').split(',').map(function(r){
					var v=(r*1).toString(16);
					return v.length==1 ? "0"+v : v;
					}).join('');
				}
			},
		'Function':{
			bind:function(func,context){
				return function(){ func.apply(context,[].slice.call(arguments)); }
				},
			subscribe:function(func,observer,context){		// subscribe to an observer
				observer.subscribers.push(func);
				observer.context.push(context);
				return func;
				},
			unsubscribe:function(func,observer){		// unsubscribe from an observer
				var index=-1;
				observer.subscribers=observer.subscribers.filter(function(x,i){
					if (func==x) index=i;
					return func!=x;
					});
				if (index>-1) observer.context.splice(index,1);
				return func;
				}
			}
			
		};
			
	ign.core.Hash=ign.core.Class.extend(function Hash(){
		ign.util.augment.apply(null,[this].concat([].slice.call(arguments)));
		},{
		keys:function(){
			var a=[];
			for (var x in this){
				if (this.hasOwnProperty(x)) a.push(x);
				}
			return a;
			},
		values:function(){
			var a=[];
			for (var x in this){
				if (this.hasOwnProperty(x)) a.push(this[x]);
				}
			return a;
			},
		add:function(o){
			for (var x in o){
				if (o.hasOwnProperty(x)) this[x]=o[x];
				}
			return this;
			},
		forEach:function(fn,c){
			for (var x in this){
				if (this.hasOwnProperty(x)) fn.call(c, this[x], x, this);
				}
			return this;
			},
		map:function(fn,c){
			var d=new this.constructor({});
			for (var x in this){
				if (this.hasOwnProperty(x)) d[x]=fn.call(c, this[x], x, this);
				}
			return d;
			},
		filter:function(fn,c){
			var d=new this.constructor({});
			for (var x in this){
				if (this.hasOwnProperty(x) && fn.call(c, this[x], x, this)) d[x]=this[x];
				}
			return d;
			},
			some:function(fn,c){
			for (var x in this){
				if (this.hasOwnProperty(x) && fn.call(c, this[x], x, this)) return true;
				}
			return false;
			},
		every:function(fn,c){
			for (var x in this){
				if (this.hasOwnProperty(x) && !fn.call(c, this[x], x, this)) return false;
				}
			return true;
			},
		intersect:function(){
			var d=new this.constructor({}), args=[].slice.call(arguments);
			this.forEach(function(v,p){
				if (args.every(function(o){
					return o.hasOwnProperty(p) && o[p]===v;
					})) d[p]=v;
				});
			return d;
			},
		minus:function(){
			var args=[].slice.call(arguments);
			return this.filter(function(v,p){
				return !(args.some(function(o){
					return o.hasOwnProperty(p) && o[p]===v;
					}));
				});
			},
		clean:function(){
			var args=[].slice.call(arguments);
			return this.filter(function(x){
				return args.length ? args.indexOf(x)<0 : !!x;
				});
			},
		toQuerystring:function(opt){
			var qs=[];
			this.forEach(function(v,p){
				if (typeof v=='string' || typeof v=='number') qs.push(p+"="+(opt && opt.encode ? encodeURIComponent(v) : v));
				});
			return qs.join("&");
			}
		});
	
	ign.core.Observer=ign.core.Class.extend(function Observer(){
		this.subscribers=ign.util.merge(arguments);
		this.context=new Array(this.subscribers.length);
		},{
		deliver:function(){
			var self=this, args=[].slice.call(arguments), context=args.length ? args.shift() : window;		// default context supplied as the first argument to deliver(). Look up context supplied during subscription, otherwise default, otherwise window.
			this.subscribers.forEach(function(x,i){
				x.apply(self.context[i] || context,args);
				});
			return this;
			},
		clear:function(){
			this.subscribers=[];
			this.context=[];
			return this;
			}
		});
		
	ign.core.Queue=ign.core.Class.extend(function Queue(){		/* the Queue class is used to operate arrays of functions */
		this.q=ign.util.merge(arguments);
		this.observe={};
		var opt=(!this.q.length || typeof this.q[this.q.length-1]=='function') ? {} : this.q.pop();	// opt object passed as final argument
		var self=this;
		['Next','Previous','Reset'].forEach(function(t){	// create observers for each method. One subscribing function per type can be added to the opt object.
			self.observe[t.toLowerCase()]=opt['on'+t] ? new ign.core.Observer(opt['on'+t]) : null;
			});
		this.count=0;
		},(function(){
		
		var move=function(obj,dir,args){
			if (!obj.q.length) return;
			obj.count+=dir;
			var rv=obj.q[dir==1 ? 0 : obj.q.length-1].apply(obj,args);
			if (dir==1) obj.q.push(obj.q.shift());
			else obj.q.unshift(obj.q.pop());
			return rv;
			};
				
		return {
			next:function(){
				var rv=move(this,1,[].slice.call(arguments));
				if (this.observe.next) this.observe.next.deliver(this);
				return rv;
				},
			previous:function(){
				var rev=move(this,-1,[].slice.call(arguments)); 
				if (this.observe.previous) this.observe.previous.deliver(this)},
			reset:function(){
				var r=Math.abs(this.count % this.q.length);
				while (r--) this.q.unshift(this.q.pop());
				this.count=0;
				if (this.observe.reset) this.observe.reset.deliver(this);
				return this;
				}
			}
		
		})());

	ign.core.Timer=ign.core.Class.extend(function Timer(){	/* a wrapper around a Queue() instance, allows scheduled invoacation of queued functions */
		var q=ign.util.merge(arguments);
		var opt=(q.length && typeof q[q.length-1]!='function') ? q.pop() : {}, self=this;	// this allows arguments as a Queue instance, a sequence of functions, or an array of functions
		this.queue=q.length==1 ? (q[0].constructor==ign.core.Queue ? q[0] : new ign.core.Queue(q[0])) : new ign.core.Queue(q);
		this.repeat=(opt.repeat ? (opt.repeat==-1 ? Number.POSITIVE_INFINITY : opt.repeat) : 1)*this.queue.q.length, this.period=opt.period || 60, this.counter=0;
		this.observe={};
		var self=this;
		['Start','Stop','Pause'].forEach(function(t){	// create observers for each method. One subscribing function per type can be added to the opt object.
			self.observe[t.toLowerCase()]=opt['on'+t] ? new ign.core.Observer(opt['on'+t]) : null;
			});
		},(function(){
		
		var move=function(self){
			self.timer=setTimeout(function(){
				self.queue.next();
				if ((self.counter++) < self.repeat-1) move(self);
				else self.stop();
				},self.period*1000);
			};
				
		return {
			start:function(){
				if (this.observe.start) this.observe.start.deliver(this);
				move(this);
				},
			stop:function(){
				clearTimeout(this.timer);
				this.counter=0;
				this.queue.reset();
				if (this.observe.stop) this.observe.stop.deliver(this);
				},
			pause:function(){
				if (this.observe.pause) this.observe.pause.deliver(this);
				if (this.timer){
					clearTimeout(this.timer);
					this.timer=null;
					}
				else move(this);
				}
			};
		
		})());
		
		
	ign.env={
		window:{
			params:ign.core.String.toHash(window.location.search.replace(/^\?/,''))
			},
		document:{}
		};
	
	ign.DOM={
		create:function(){
			var args=ign.util.merge(arguments), el=document.createElement(args.shift());
			if (args[0]) (new ign.core.Hash(args[0])).forEach(function(v,p){ el[p]=v; });	// copy optional properties to node
			for (var i=1;i<args.length;i++){	// add optional child nodes (from Strings or NodeGroups)
				(typeof args[i]=='string' ? ign.core.String.toNodeGroup(args[i]) : args[i]).forEach(function(c){
					el.appendChild(c);
					});
				}
			return new ign.DOM.NodeGroup([el]);
			},
		NodeGroup:(function(){
			
			var me=function(a,prev){
				var i=0, j=0; l=a.length;
				for (;i<l;i++){
					if (a[i]) this[j++]=a[i];
					}
				this.length=j;
				this.previousGroup=prev;
				if (prev) prev.nextGroup=this;
				if (j==1 && (a[0]==window || a[0]==document)) ign.util.augment(this,ign.env[a[0]==window ? 'window' : 'document']); // decorate if required
				};
				
				
			// navigate throught the chain
			var chain=function(ng,n,d){
				var n=n || 1, i=n, p=(d<0 ? 'previous' : 'next')+'Group';
				while (ng[p] && n--) ng=ng[p];
				return ng;
				};
				
			var uidCheck=function(n){
				if (!n[UID]) n[UID]=uid++;
				return n[UID];
				};
				
			// expose these for use in other modules
				
			me.genericGetter=function(args,ng,p){
				return me.what(args, ng, (args.length ? ng.item.apply(ng,args) : ng).mapArray(function(n){ return n[p]; }));
				};
				
			me.genericSetter=function(args,ng,p){
				var v=args[args.length-1];
				(args.length>1 ? ng.item.apply(ng,[].slice.call(args,0,args.length-1)) : ng).forEach(function(n){
					if (v && typeof v=="function") n[p]=h(n[p]);		// accepts string or modifier function
					else n[p]=v || "";
					});
				return ng;
				};
				
			me.what=function(args,ng,r){ // return all or specific item
				return (args.length==1 && !isNaN(args[0]) ? (args[0] < ng.length ? r[0] : undefined) : r);			
				};
				
			me.variableArgs=function(args){ // disambiguate variable filters / args
				var i=[], j=0, s=new ign.core.Hash(), t=/^[a-z]+$/i, only;
				[].slice.call(args).forEach(function(a){
					if (t.test(a) && a!='even' && a!='odd'){
						s[a]=1;
						only=j++ ? false : a;
						}
					else i.push(a);
					});
				return [i,s,only];
				};
				
			// these methods can just wrap array methods
			
			['indexOf','lastIndexOf','every','some'].forEach(function(x){
				me.prototype[x]=function(){ return Array.prototype[x].apply(this,arguments); };
				});
			['map','filter'].forEach(function(x){
				me.prototype[x]=function(){ return new me(Array.prototype[x].apply(this,arguments), this); };
				});
			['unique','intersect','minus','clean'].forEach(function(x){	// should re-code these to use the UID system
				me.prototype[x]=function(){ return new me(ign.core.Array[x].apply(this,arguments), this); };
				});
				
			var relations=function(ng,child,dir,end,limit,match){ // get unique nodes via relationships
				var a=[], lookup={};
				ng.forEach(function(n){
					var p=(dir ? 'next' : 'previous')+'Sibling', p2=(dir ? 'first' : 'last')+'Child';
					var c=child ? n[p2] : end ? n.parentNode[p2] : n[p];
					while (c && c.nodeType!=1) c=c[p];
					if (c && !lookup[uidCheck(c)]){
						a.push(c);
						lookup[c[UID]]=1;
						if (!limit){
							while (c=c[p]){
								if (c.nodeType==1) a.push(c);
								}
							}
						}
					});
				return new me(match ? ignite.DOM.query.match(match,a) : a, ng);
				};
				
			var nodeDataStore={};
				
			ign.util.augment(me.prototype,{
				back:function(n){ return chain(this,n,-1); },
				forward:function(n){ return chain(this,n,1); },
				write:function(){
					var args=ign.util.split(arguments,1,0);
					var items=(args[0].length ? this.item(args[0]) : this).forEach(function(n){
						var id=uidCheck(n);
						if (!nodeDataStore[id]) nodeDataStore[id]={};
						for (var x in args[1][0]) nodeDataStore[id][x]=args[1][0][x];
						});
					return this;
					},
				read:function(){
					var args=ign.util.split(arguments,1,0);
					return me.what(args[0], this, (args[0].length ? this.item.apply(this,args[0]) : this).mapArray(function(n){
						var id=uidCheck(n);
						return nodeDataStore[id] && nodeDataStore[id][args[1][0]] ? nodeDataStore[id][args[1][0]] : undefined;
						}));
					},
				forEach:function(){ [].forEach.apply(this,arguments); return this;},
				mapArray:function(fn){ return arguments.length ? [].map.apply(this,arguments) : [].slice.call(this); },	// passing no arguments to mapArray() just returns the nodes in a standard array
				concat:function(){ return new me([].concat.apply([].slice.call(this),[].slice.call(arguments).map(function(x){ return [].slice.call(x); }))); },
				item:function(){	// supports (multiple) indexes, ranges, and CSS-style position selectors
					var h=new ign.core.Hash(), l=this.length, self=this;
					[].slice.call(arguments).forEach(function(x){
						if (!isNaN(x)) h[((x*1)<0 ? l : 0)+(x*1)]=1;
						else if (x.indexOf(':')>-1){
							x=x.split(':'), x[0]=x[0] ? x[0]*1 : 0, x[1]=x[1] ? x[1]*1 : l, x[2]=x[2] ? x[2]*1 : 1;
							for (var i=0;i<l;i++){
								if (!h[i] && (x[0]>=0 ? i : i-l)>=x[0] && (x[1]>=0 ? i : i-l)<x[1] && (x[2]==1 || !((i-x[0]) % x[2]))) h[i]=1;
								}
							}
						else{
							var m=x.replace('even','2n').replace('odd','2n+1').match(/(-|\d+)(n)?([+-]\d+)?/);
							if (m){
								var a=!m[1] ? 0 : (m[1]=='-' ? -1 : m[1]*1), n=!!m[2], b=(m[3] ? m[3]*1 : 0);
								if (!n) b=a, a=0;
								b=(b<=0 ? a-b : b)-1;
								for (var i=0;i<l;i++){
									if (!h[i] && (!a ? i==b : (a<0 ? i<=b : (i % a)==b))) h[i]=1;
									}
								}
							}
						});
					return new me(h.keys().sort().map(function(i){
						return self[i];
						}), this);
					},
				match:function(selector){ return new me(ign.config.queryEngineMatch(selector,this), this); },
				parents:function(s){
					var a=[], lookup={};
					this.forEach(function(n){
						var p=n.parentNode;
						if (p && p!=document && !lookup[uidCheck(p)]){
							lookup[p[UID]]=1;
							a.push(p);
							}
						});
					return new me(s ? ignite.DOM.query.match(s,a) : a, this);
					},
				children:function(s){ return relations(this,1,1,1,0,s); },
				firstChild:function(s){ return relations(this,1,1,1,1,s); },
				lastChild:function(s){ return relations(this,1,0,1,1,s); },
				first:function(s){ return relations(this,0,1,1,1,s); },
				last:function(s){ return relations(this,0,0,1,1,s); },
				siblings:function(s){ return relations(this,0,0,1,0,s); },
				next:function(s){ return relations(this,0,1,0,1,s); },
				previous:function(s){ return relations(this,0,0,0,1,s); },
				
				copy:function(opt){
					var opt=opt || {}, d=!(opt && opt.deep===false);
					return this.map(function(n){
						var c=n.cloneNode(d);
						if (opt.modifyId && c.id) c.id=opt.modifyId(c.id);	// accepts a modifier function
						return c;
						});
					},
				remove:function(){
					return this.forEach(function(n){ n.parentNode.removeChild(n); });
					},
				getHTML:function(){ return me.genericGetter(arguments,this,'innerHTML'); },
				setHTML:function(){ return me.genericSetter(arguments,this,'innerHTML'); },
				getValue:function(){ return me.genericGetter(arguments,this,'value'); },
				setValue:function(){ return me.genericSetter(arguments,this,'value'); },
				get:function(){
					var args=me.variableArgs(arguments);
					return me.what(args[0], this, (args[0].length ? this.item.apply(this,args[0]) : this).mapArray(function(n){
						return args[2] ? n[args[2]] : args[1].map(function(v,p){
							return n[p];
							});
						}));
					},
				set:function(){
					var args=[].slice.call(arguments), o=args.pop();
					var items=(args.length ? this.item(args) : this);
					for (var x in o){
						if (o.hasOwnProperty(x)){
							items.forEach(function(n){
								n[x]=o[x];
								});
							}
						}
					return this;
					},
				prepend:function(){
					var args=ign.util.split(arguments,1,1), ng=args[1][0], opt=args[2][0] || {};
					var ng=(typeof ng=="string" ? ign.core.String.toNodeGroup(ng) : ng), copy=!(opt && opt.copy===false);
					(args[0].length ? this.item.apply(this,args[0]) : this).forEach(function(n){
						(copy ? ng.copy() : ng).forEach(function(x){ n.parentNode.insertBefore(x,n); });
						});
					return this;
					},
				append:function(){
					var args=ign.util.split(arguments,1,1), ng=args[1][0], opt=args[2][0] || {};
					var ng=(typeof ng=="string" ? ign.core.String.toNodeGroup(ng) : ng), copy=!(opt && opt.copy===false);
					(args[0].length ? this.item.apply(this,args[0]) : this).forEach(function(n){
						var z=copy ? ng.copy() : ng, s=new ign.DOM.NodeGroup([n.parentNode]).children(), l=s.length, i=s.indexOf(n); // !!! SLOW...
						z.forEach(function(x){
							if ((i+1)>=s.length) n.parentNode.appendChild(x);
							else n.parentNode.insertBefore(x,s[i+1]);
							});
						});
					return this;
					},
				insertChild:function(){	// i is the sibling position of the new child; can be pos, neg or 0
					var args=ign.util.split(arguments,2,1), ng=args[1][0], i=args[1][1], opt=args[2][0] || {};
					var ng=(typeof ng=="string" ? ign.core.String.toNodeGroup(ng) : ng), copy=!(opt && opt.copy===false);
					(args[0].length ? this.item.apply(this,args[0]) : this).forEach(function(n){
						var z=copy ? ng.copy() : ng, c=new ign.DOM.NodeGroup([n]).children();
						if (i==0 && c.length) new ign.DOM.NodeGroup([c[0]]).prepend(z);			// !!! SLOW...
						else if (i===null || i>=c.length || !c.length) z.forEach(function(x){ n.appendChild(x); });
						else new ign.DOM.NodeGroup([i<0 ? ((c.length-1)+i >=0 ? c[(c.length-1)+i] : c[c.length-1]) : c[i]]).append(z);
						});
					return this;
					},
				wrap:function(){	// tag type or simple HTML string
					var args=ign.util.split(arguments,1,0), t=args[1][0];
					t=t.match(/</) ? ign.core.String.toNodeGroup(t) : ign.DOM.create(t);
					(args[0].length ? this.item.apply(this,args[0]) : this).forEach(function(n){
						n.parentNode.replaceChild(t.copy().insertChild(new ign.DOM.NodeGroup([n]).copy())[0],n); // copy the node to be wrapped, add it as a child of the wrapping node, which then replaces the original node
						});
					return this;
					},
				unwrap:function(){	// tag type only
					var args=ign.util.split(arguments,1,0), t=args[1][0];
					(args[0].length ? this.item.apply(this,args[0]) : this).forEach(function(n){
						var p=n.parentNode;
						if (p && (t=='*' || p.tagName.toLowerCase()==t) && p.parentNode) p.parentNode.replaceChild(n,p);
						});
					return this;
					}
					
				});
			
			return me;
			})()
		};

	/* Ignite CSS Query Engine 0.1 - modified!!! */
	ign.DOM.query=(function(){	/* add the engine to DOM.query */

		var called=0, coerce=true;
	
		// create an array from a collection, and, if required, filter at the same time for speed
		var copy=function(a,ftype,selector,relation,relationTo){
			if (coerce && !selector && !relation) return Array.prototype.slice.call(a);
			var copy=[], l=a.length;
			for (var i=0;i<l;i++){
				if (relation==' > ' && a[i].parentNode!=relationTo) continue;
				if (!selector || filters[ftype](selector,a[i])) copy.push(a[i]);
				}
			return copy;
			};
	
		// find relevant descendant nodes
		function findDescendant(s,str,tag,context,relation){
		var matched=[], l=context.length, v=(s=='.' ? str : ''), lookup={};
		for (var i=0;i<l;i++){
			if (s=='#'){
				var n=document.getElementById(str);
				if (!n) return [];
				if (context[i]!=document){
					var p=n;
					while (p=p.parentNode){
						if (p==context[i]){
							matched.push(n);
							break;
							}
						if (relation==' > ') break;
						}
					}
				else matched.push(n);
				}
			else matched=matched.concat(copy(context[i].getElementsByTagName(tag),s,v,relation,context[i]));
			}
		return matched;
		}
	
		// find relevant ancestor nodes
		function findAncestor(s,str,tag,context,relation){
		var matched=[], l=context.length, v=(s=='.' ? str : ''), lookup={}, UID='ignUID';
		for (var i=0;i<l;i++){
			var n=context[i], branch=[];
			while (n=n.parentNode){
				if (!n.parentNode || (n[UID] && lookup[n[UID]])) break;	// dont search this branch if already done
				if ((s!='#' || n.id==str) && (tag=='*' || n.tagName.toLowerCase()==tag) && (!v || filters[s](v,n))){
					n[UID]=uid++;
					lookup[n[UID]]=1;
					branch.unshift(n);	// add to start in attempt to preserve DOM order
					}
				if (relation==' < ') break;
				}
			matched=matched.concat(branch);
			}
		return matched;
		}
	
		// map combinators to their find functions
		var combinators={
			' ':findDescendant,
			' > ':findDescendant,
			' < ':findAncestor,
			' { ':findAncestor
			};
	
		// filter candidate nodes based on single selector
		function filter(str,candidates){
		var f, l=candidates.length, matched=[];
		var s=(/^\w+$/).test(str) ? 'tag' : str.substring(0,1);
		if (s=='#' || s=='.') f=str.substring(1,str.length);
		else if (s=='[') f=str.match(/\[(\w+)([~\^\$\*\|]?=)?(\w+)?/);
		else if (s==':'){
			var child=false;
			if (str.indexOf('after')>-1) f=[str,'after',str.substring(7,str.length-1)];	// this is an internal representation of ~, allowing us to match on the final selector and filter based on position.
			else if (str.indexOf('not')>-1) f=[str,'not',str.substring(5,str.length-1)];
			else if (str.indexOf('range')>-1){
				f=str.match(/^:(range)(-of-type)?()?\(([^\)]+)\)$/);
				f[4]=f[4].split(',');
				}
			else{
				f=str.match(/^:([^\(-]+)(?:-(last)?-?)?(child|of-type)?\(?((?:(-?\d+)(n?)([\+-]?\d*))|[^\)]+)?\)?/);	// NOTE: so many regexes - simplify this
				child=(/(nth|first|last|only)(-last)?-(child|of-type)/).test(str);
				}
			s=child ? 'child' : f[1];
			}
		else f=str;
		for (var i=0;i<l;i++){
			if (filters[s](f,candidates[i])) matched.push(candidates[i]);
			}
		return matched;
		}
	
		// indexes nodes (by tag or all)
		var generateIndeces=function(p,t,prop,eName,expando){
			var i=0, c=p.firstChild;
			if (t){
				var types={};
				for (; c; c=c.nextSibling){
					if (c.nodeType==1){
						var tag=c.tagName;
						if (!types[tag]) types[tag]=0;
						c[prop]=types[tag]++;
						}
					}
				p[expando]=types;
				}
			else{
				for (; c; c=c.nextSibling){
					if (c.nodeType==1) c[prop]=i++;
					}
					p[expando]=i;
				}
			if (called) p[eName+(called-1)]=null;	// cleanup the previous expando
			};
		
		var split=/(?:[#\.:]?(?:[\w\-_]+|\*)(?:\([^\)]+\)+)?)|\[[^\]]+\]|\s[\+>~<{]\s|,?\s/;
		var after={}, solved={};
	
		// define filter functions
		var filters={
			'tag':function(f,node){
				return node.tagName.toLowerCase()==f;
				},
			'#':function(f,node){
				return node.id==f;
				},
			'.':function(f,node){
				return node.className.indexOf(f)>-1;
				},
			'[':function(f,node){
				var v=f[1]=='class' ? node.className : node.getAttribute(f[1]);
				if (!v) return false;
				return (!f[2] || (f[2]=='|=' && (v==f[3] || !(v.indexOf(f[3]+'-')))) || (f[2]=='=' && v==f[3]) || (f[2]=='!=' && v!=f[3]) || (f[2]=='~=' && ((v+' ').indexOf(f[3]+' ')>-1)) || (f[2]=='^=' && (!v.indexOf(f[3]))) || (f[2]=='$=' && (!(v.length-f[3].length-v.lastIndexOf(f[3])))) || (f[2]=='*=' && (v.indexOf(f[3])>-1)));
				},
			range:function(f,node){	// this custom selector allows the selection of specific nodes or node ranges
				var p=node.parentNode, t=f[2]=='-of-type' ? 'Type' : '', prop='ignNode'+t+'Index', eName='ignChild'+t+'Total_', expando=eName+called;
				if (!p[expando]) generateIndeces(p,t,prop,eName,expando);
				var total=t ? p[expando][node.tagName] : p[expando];
				var ranges=f[4], j=ranges.length, index=node[prop];
				while (j--){
					var r=ranges[j];
					if (isNaN(r)){
						r=r.split(':'), r[0]=r[0] ? r[0]*1 : 0, r[1]=r[1] ? r[1]*1 : total, r[2]=r[2] ? r[2]*1 : 1;
						if ((r[0]>=0 ? index : index-total)>=r[0] && (r[1]>=0 ? index : index-total)<r[1] && (r[2]==1 || !((index-r[0]) % r[2]))) return true;
						}
					else{
						r=r*1;
						if ((r>=0 ? index : index-total)==r) return true;
						}
					}
				return false;
				},
			child:function(f,node){
				var p=node.parentNode, t=f[3]=='of-type' ? 'Type' : '', prop='ignNode'+t+'Index', eName='ignChild'+t+'Total_', expando=eName+called;
				if (!p[expando]) generateIndeces(p,t,prop,eName,expando);
				var total=t ? p[expando][node.tagName] : p[expando];
				if (f[1].indexOf('nth')>-1){
					if (solved[f[4]]) var v=solved[f[4]], a=v[0], b=v[1], l=v[2];
					else{
						var l=!!f[2], a=!f[5] ? 0 : (f[5]=='-' ? -1 : f[5]*1), n=!!f[6], b=(f[7] ? f[7]*1 : 0);
						if (!n) b=a, a=0;
						b=(b<=0 ? a-b : b)-(l ? 0 : 1);
						solved[f[4]]=[a,b,l];
						}
					var i=l ? total-node[prop] : node[prop];
					return !a ? i==b : (a<0 ? (l ? i>=b : i<=b) : ((i % a)==b));
					}
				if (f[1]=='last') return node[prop]==total-1;
				if (f[1]=='first') return !node[prop];
				if (f[1]=='only') return total==1;
				},
			target:function(f,node) {return node.getAttribute('name')==window.location.hash.replace('#','');},
			root:function(f,node) {return node.tagName.toLowerCase()=='html';},
			disabled:function(f,node) { return node.disabled;},
			enabled:function(f,node) { return !node.disabled;},
			checked:function(f,node) { return node.checked;},
			selected:function(f,node) { return node.selected;},
			empty:function(f,node) { return !node.firstChild;},
			contains:function(f,node) { return (node.textContent ? node.textContent : (node.innerText ? node.innerText : '')).indexOf(f[4])>-1;},
			not:function(f,node){ return !filter(f[2],[node]).length;},
			after:function(f,node){
				var selector=f[2], s=node, p=s.parentNode;
				if (!p.uid) p.uid=uid++;
				else if (after[p.uid]==selector) return true;
				nextSibling:
				for (;s;s=s.previousSibling){
					if (s.nodeType==1){
						var q=selector, match;
						while (match=q.match(split)){
							if (!filter(match[0],[s]).length) continue nextSibling;
							q=q.replace(match[0],'');
							}
						after[p.uid]=selector;
						return true;
						}
					}
				return false;
				}
			};
		
		// filters out duplicates using UIDs
		var unique=function(a){
			var lookup={}, i=a.length, UID='ignUID';
			while (i--){
				if (!a[i][UID]) a[i][UID]=uid++;
				if (lookup[a[i][UID]]) a.splice(i,1);
				else lookup[a[i][UID]]=1;
				}
			return a;
			};
		
		// can the browser slice collections into arrays?
		try { Array.prototype.slice.call(document.forms); }
		catch (e) {coerce=false;}
	
		var cache=document.addEventListener ? {} : null, reset=null;
	
		if (document.evaluate) var xpathHelpers=[
			[/(^|\s)([^\w><{~\+\*])/g,'$1*$2'], // add wildcard if no tag
			[/\s>\s/g,'/'],
			[/\s<\s/g,'/parent::'],	// ancestor combinators < and {!
			[/\s{\s/g,'/ancestor::'],
			[/\s~\s/g,'/following-sibling::'],
			[/\s\+\s/g,'/following-sibling::*[1]/self::'],
			[/\s/g,'//'],
			[/%/g,' '],
			[/:first-child/g,"[count(./preceding-sibling::*) = 0]"],
			[/:last-child/g,"[count(./following-sibling::*) = 0]"],
			[/:only-child/g,"[count(../child::*) = 1]"],
			[/:first-of-type/g,"[count(./preceding-sibling::*) = 0 and name(../*[1])=name(./self::*)]"],			// these are the only 2 of-type selectors that can be converted to Xpath
			[/:last-of-type/g,"[count(./following-sibling::*) = 0 and name(../*[last()])=name(./self::*)]"]
			];
		
		var dupeCheck=/^([#\w][^,\s]+(,\s(?=[#\w]))?)+([#\w])?$/;
		
		var engine=function(query, context){

			// normalise some stuff
			query=query.replace(/even/g,'2n').replace(/odd/g,'2n+1').replace(/:nth-(last-)?child\(n\)/g,'').replace(/:(text|password|file|radio|checkbox|button|reset|submit)/g,"[type=$1]");
	
			var me=arguments.callee, cOK=cache && me.enableCache;
			var result=[];
			
			if (!reset){	// add the listeners after the first call.
				reset=function(e){
					if (cOK) cache={};
					after={}, called++;
					};
				if (document.addEventListener){
					document.addEventListener("DOMAttrModified", reset, false);					// now a pretty startard way of refreshing the cache, originally from Sizzle?
					document.addEventListener("DOMNodeInserted", reset, false);					// copyright 2008 John Resig (http://ejohn.org/) released under the MIT License
					document.addEventListener("DOMNodeRemoved", reset, false);
					cache={};
					}
				}

			if (!cOK) reset();	// IE can't listen for DOM changes, so force the next call to re-calc positions
		
			// try to retrieve from cache, or native byClassName
			if (!context || context==document){
				if (cOK && cache[query]) return cache[query];
				if (document.getElementsByClassName && (/^\.\w+$/).test(query)){
					result=copy(document.getElementsByClassName(query.substring(1,query.length)));
					if (cOK) cache[query]=result;
					return result;
					}
				var context=[document], rt=true;
				}
			else if (context.nodeType) context=[context];
	
			// try querySelectorAll
			if (document.querySelectorAll && !(/<|{|:range|:contains|!=/).test(query)){	// check for non-standard syntax
				if (rt){
					result=copy(document.querySelectorAll(query));
					if (cOK) cache[query]=result;
					return result;
					}
				else{
					for (var i=0;i<context.length;i++) result=result.concat(copy(context[i].querySelectorAll(query)));
					return i>1 ? unique(result) : result;
					}
				}
		
			// try xpath
			if (document.evaluate && me.enableXPath && rt && (/^([^:]|:(?=(first|last|nth(?:-last)?)-child))+$/).test(query)){
				var selector=query.split(', ');
				for (var i=0;i<selector.length;i++){
					if (cOK && cache[query]){
						result=result.concat(cache[query]);	// check if this part of the selector is cached
						continue;
						}
					var str=selector[i], m;
					while (m=str.match(/\[[^\]@]+\]/g)){
						var p=m[0].match(/\[(\w+)([~\^\$\*\|]?=)?(\w+)?/);
						var a='@'+p[1];
						if (p[2]=='=') a+="='"+p[3]+"'";
						else if (p[2]=='!=') a+="!='"+p[3]+"'";
						else if (p[2]=='^=') a="starts-with("+a+",'"+p[3]+"')";
						else if (p[2]=='*=') a="contains("+a+",'"+p[3]+"')";
						else if (p[2]=='$=') a="substring("+a+",string-length("+a+")-"+(p[3].length-1)+")='"+p[3]+"'";	// no ends-with() in xpath v1
						else if (p[2]=='|=') a+="='"+p[3]+"'%or%starts-with("+a+",'"+p[3]+"-')";
						else if (p[2]=='~=') a+="='"+p[3]+"'%or%contains("+a+",'%"+p[3]+"')%or%contains("+a+",'"+p[3]+"%')";
						str=str.replace(m[0],"["+a+"]");
						}
					while (m=str.match(/\.[\w\-]+/g)) str=str.replace(m[0],"[contains(@class,'"+m[0].replace('.','')+"')]");		// BUG 1
					// while (m=str.match(/\.[\w]+/g)) str=str.replace(m[0],"[contains(@class,'"+m[0].replace('.','')+"')]");
					while (m=str.match(/\#[\w\_-]+/)) str=str.replace(m[0],"[@id='"+m[0].replace('#','')+"']");
					xpathHelpers.forEach(function(x){
						str=str.replace(x[0],x[1]);
						});
					while (m=str.match(/:nth-(last-)?child\((-?\d*)(n?)[\+-]?(\d*)\)/)){
						var l=!!m[1], a=!m[2] ? 0 : (m[2]=='-' ? -1 : m[2]*1), n=!!m[3], b=(m[4] ? m[4]*1 : 0);
						if (!n) b=a, a=0;
						b=(b<=0 ? a-b : b)-1;
						str=str.replace(m[0],"[count(./"+(l ? "following" : "preceding")+"-sibling::*)"+(!a ? "" : (a<0 ? "<" : " mod "+a))+"="+b+"]");
						}
					var s=document.evaluate("//"+str,document,null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
					var thisNode = s.iterateNext();
					while (thisNode){
						result.push(thisNode);
						thisNode = s.iterateNext();
						}
					}
				if (i>1 && (dupeCheck).test(origQuery)) result=unique(result);
				if (cOK) cache[query]=result;
				return result;
				}
			
			var origQuery=query, currentQuery='', candidates=[], relation=false;
	
			// check for sibling combinator, and rewrite as custom after: pseudo
			while (match=query.match(/((?:[^~]|~(?==))+)\s(~)\s([^~\s]+)/)) query=query.replace(match[0],match[3]+':after('+match[1]+')');

			while (match=query.match(split)){
				var selector=match[0];
				currentQuery+=selector;
				query=query.replace(selector,'');
		
				var f=true;
				if (!candidates.length){
					if (rt && cache && cache[currentQuery]) candidates=cache[currentQuery], f=false;
					else{
						var s=selector.substring(0,1), str=selector.substring(1,selector.length);
						var tag=(/\W/).test(selector) ? '*' : selector;
						if (s=='#' || s=='.' || tag==selector) f=false;
						candidates=(relation ? combinators[relation] : findDescendant)(s,str,tag,context,relation);
						}
					}
				if (combinators[selector]){
					relation=selector;
					context=candidates;
					candidates=[];
					continue;
					}
				else if (selector==' + '){
					relation=false;
					var nextSelector=query.match(split)[0];
					query=query.replace(nextSelector,'');
					var matched=[], l=candidates.length;
					for (var i=0;i<l;i++){
						var c=candidates[i].nextSibling;
						for (var c;c;c=c.nextSibling){
							if (c.nodeType==1){
								if (!nextSelector || filter(nextSelector, [c]).length) matched.push(c);
								break;
								}
							}
						}
					candidates=matched;
					if (candidates.length) continue;
					}
				else if (selector==', '){
					result=result.concat(candidates);
					candidates=[];
					relation=false;
					continue;
					}

				if (f) candidates=filter(selector,candidates);
				if (candidates.length){
					if (cOK) cache[currentQuery]=candidates;
					}
				else query=query.replace(/([^,]+,\s)|.+/,'');	// if no results, go to the next selector
				relation=false;
				}
	
			result=result.length ? result.concat(candidates) : candidates;
			result=origQuery.indexOf(' ')<0 || dupeCheck.test(origQuery) ? result : unique(result);
			if (cOK) cache[origQuery]=result;
			return result;
			};
		engine.match=function(selector,nodes){
			var m;
			while (m=selector.match(split)){
				nodes=filter(m[0],nodes);
				selector=selector.replace(m[0],'');
				}
			return nodes;
			};
		engine.addCustomFilter=function(psuedo,fn){	// let users safely add their own pseudo-selector filters
			if (filters[psuedo]) return false;
			filters[psuedo]=fn;
			return true;
			};
		engine.enableCache=1;
		engine.enableXPath=1;
		
		return engine;	// expose
	
		})();
	
	
	/*****/
		
	// set the default engine
		
	ign.config.queryEngine=ign.DOM.query;
	ign.config.queryEngineMatch=ign.DOM.query.match;
		
	// allow NodeGroups to query their descendants - engine must accept 2nd param of context [elements]
	ign.DOM.NodeGroup.prototype.find=function(selector){
		return ign(selector,this);
		};
		
	/****/
	
	
	/*** modules ***/
	
	ign.module={
		'ignite':{version:ign.version},
		URLs:new ign.core.Hash({
			'moduleLibrary':'http://localhost/ignite/module.php?name=moduleLibrary'
			}),
		init:function(module){
			if (!module.version || !module.install || !module.name) return 'Module has a missing property';
			else if (this[module.name]) return 'Module is already installed or a naming conflict exists';
			if (module.requires){
				for (var x in module.requires){
					if (!this[x] || this[x].version < module.requires[x]) return 'Required module "'+x+'" not installed or incompatible version';
					}
				}
			this[module.name]=module;
			module.install(ignite);
			return true;
			},
		load:function(module){
			var result=this.init(module), success=this.cache.onComplete, fail=this.cache.onError;
			this.cache=null;
			if (result===true){
				if (success) success();
				}
			else if (fail) fail(result);
			},
		cache:{},
		fetch:function(str,opt){
			if (this[str] && opt.onComplete) opt.onComplete(); 
			var url = (this.URLs && this.URLs[str]) ? this.URLs[str] : str, opt=opt || {}, id=ign.namespace+'moduleFetch';
			if (!(/\./i).test(url)){
				if (!this.moduleLibrary && this.URLs.moduleLibrary){
					var orig={onComplete:opt.onComplete, onError:opt.onError};	// store the original callbacks
					opt.onComplete=function(){
						ign.module.fetch(url,orig);
						};
					opt.onError=function(){
						orig.onError("Autoloading Module library failed");
						};
					if (this.URLs.moduleLibrary) ignite.module.fetch(this.URLs.moduleLibrary,opt);
					else opt.onError();
					}
				else if (opt.onError) opt.onError("Module URL not found");
				return;
				}
			this.cache=opt;
			ign('#'+id).remove();
			ign('head').insertChild(ign.DOM.create('script',{id:id,type:'text/javascript',src:url}),0);
			}
		
		};
	
	// add DOMContentLoaded (seperate from events)
	
	var readyFns=[], _ready=false;
	var ContentLoader=function(f){	// Modified ContentLoaded by Diego Perini, http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
		readyFns.push(f);
		if (readyFns.length>1) return;	// invoke once
		var w=window, d=w.document, D='DOMContentLoaded', u=w.navigator.userAgent.toLowerCase(), v=parseFloat(u.match(/.+(?:rv|it|ml|ra|ie)[\/: ]([\d.]+)/)[1]);		
		var init=function(e){
			if (!_ready){
				_ready=true;
				readyFns.forEach(function(f){
					f.call(ign,e);
					});
				};
			};
		if (/webkit\//.test(u) && v < 525.13) (function(){			// safari < 525.13
				if (/complete|loaded/.test(d.readyState)) init('khtml-poll');
				else setTimeout(arguments.callee, 10);
			})();
		else if (!d.addEventListener && d.attachEvent){	// diego's looked for w.opera
			d.attachEvent('onreadystatechange',function(e){  // internet explorer all versions
				if (d.readyState=='complete'){
					d.detachEvent('on'+e.type, arguments.callee);
					init(e);
					}
				});
			if (w == top) (function(){
				try { d.documentElement.doScroll('left'); }
				catch (e) { setTimeout(arguments.callee, 10); return;}
				init('msie-poll');
				})();
			}
		else if (d.addEventListener && (/opera\//.test(u) && v > 9) || (/gecko\//.test(u) && v >= 1.8) || (/khtml\//.test(u) && v >= 4.0) || (/webkit\//.test(u) && v >= 525.13)) d.addEventListener(D,function(e){
			d.removeEventListener(D, arguments.callee, false);
			init(e);
			},false);
		else{
			var oldonload=w.onload;
			w.onload=function(e){
				if (typeof oldonload=='function') oldonload(e || w.event);
				init(e||w.event);
				};
			}
		};
	
	ign.ready=function(fn){
		if (_ready) fn.call(ign,{});
		else ContentLoader(fn);
		};
		
	// grab config params, create native methods as required and setup namespace
	
	var ns='ignite';
	var conf=ign('script').filter(function(s){ return (new RegExp(ns+'[-\\d\\.]*\\.js','i')).test(s.src); });
	var params=(conf && conf.length ? ign.core.String.toHash(conf[0].src.match(/\.js\??(.*)$/i)[1]) : new ign.core.Hash());
	
	var build=function(x,c){
		return function(){
			return ign.core[c][x].apply(ign.core[c],[this].concat([].slice.call(arguments)));
			};
		};
	
	['Array','String','Function'].forEach(function(c){
		var o=ign.core[c];
		if (!params[c] || params[c]!='false'){
			for (var x in o) window[c].prototype[x]=build(x,c);
			o.toNative=true;
			}
		else o.toNative=false;
		});
	
	var obj=window;
	(params.ns ? params.ns.split(".") : [ns]).forEach(function(p,i,a){ // create / drill down to namespace object
		if (!obj[p]) obj[p]={};
		if (i==a.length-1) obj[p]=ign;
		else obj=obj[p];
		});
	ign.namespace=params.ns || ns;
	if (ign.namespace.indexOf('.')!=-1) window[ign.namespace]=ign;	// add a global pointer if the library is in a nested namespace


	})();