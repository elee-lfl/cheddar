cheddar.AniSequence = cheddar.Class({
	
	fps : 0,
	frames : 0,
	timers : null,
	keyframes : null,
	running : false,
	onstart : null,
	onstop : null,
	
	initialize : function(fps, f) {
		this.fps = fps;
		this.frames = f;
		this.timers = new Array();
		this.keyframes = new Array();
	},
	
	run : function() {
		var ASeq = this;
		ASeq.timer || (ASeq.timer = setInterval(function(){
			
			for(var h, d = +(new Date), t = ASeq.timers, i = t.length; i--;){
				for (var j=0;j<ASeq.keyframes.length;j++) {
					if (ASeq.keyframes[j].frame == t[i].current) {
						ASeq.keyframes[j].method.apply(ASeq, ASeq.keyframes[j].args);
					}
				}
				t[i].current++;
				if (t[i].current >= ASeq.frames) {
					ASeq.stop(1);
				}
			}
		}, 1000/this.fps));
	},
	
	addKeyframe : function(frame,method,args) {
		this.frames = Math.max(frame, this.frames);
		this.keyframes.push({frame:frame,method:method,args:args});
	},
	
	start : function(c) {
		
		if(this.running) return;
		this.running = true, this.current = c || 0;
		this.time = new Date, this.onstart && this.onstart();
		if(this.frames <= 0 || this.fps <= 0)
			return this.stop(1);
		this.timers.push(this), this.run();
	},
	
	stop : function(r) {
		this.keyframes = null;
		this.running = false;
		if(this.timers.length)
			this.timer = clearInterval(this.timer), null;
		if (r) { this.onstop && this.onstop(); }
	}
	
})