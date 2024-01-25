class WindowBus{
    constructor(){
        const that = this;
        window.addEventListener("storage",(e)=>{
            that.emitLocal(e.key,JSON.parse(e.newValue));
        });
    }
    evtMap = new Map;
    emitLocal(key,value){
        let listeners = this.evtMap.get(key);
        if(!listeners)return;
        for(let l of listeners){
            l(value);
        }
    }
    emit(key,value){
        window.localStorage.setItem(key,JSON.stringify(value));
        this.emitLocal(key,value);
    }
    on(key,cb){
        let listeners = this.evtMap.get(key);
        if(!listeners){
            listeners = new Set;
            this.evtMap.set(key,listeners);
        }
        listeners.add(cb);
    }
    off(key,cb){
        let listeners = this.evtMap.get(key);
        if(!listeners)return;
        listeners.delete(cb);
    }
}

const windowBus = new WindowBus;


const ID = crypto.randomUUID();
const getWindowShape = function(){
    return {x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight}
}

const windows = new Map;

windowBus.on("windowCreate",({
    from, to, init, anycast, shape
})=>{
    if(!anycast && to !== ID)return
    windows.set(from,shape);
    if(init){
        windowBus.emit("windowCreate",{
            from: ID,
            to: from,
            init: false,
            shape: getWindowShape(),
        });
    }
});
windowBus.on("windowDestroy",({
    from
})=>{
    windows.delete(from);
});
addEventListener("beforeunload", () => {
    windowBus.emit("windowDestroy",{from: ID});
});
windowBus.emit("windowCreate",{
    from: ID,
    init: true,
    anycast: true,
    shape: getWindowShape(),
});

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize",()=>{
    const {w,h} = getWindowShape();
    canvas.width = w;
    canvas.height = h;
});

const ctx = canvas.getContext("2d");

const renderCurrentFrame = function(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let ws = [...windows].map(([id,{x,y,w,h}])=>{
        return [id,x,y,w,h,x+w/2,y+h/2];
    });
    const {x:x0, y:y0} = getWindowShape();
    for(let i = 0; i < ws.length; i++){
        for(let j = 0; j < ws.length; j++){
            const [id1,x1,y1,w1,h1,cx1,cy1] = ws[i];
            const [id2,x2,y2,w2,h2,cx2,cy2] = ws[j];
            ctx.beginPath();
            ctx.moveTo(cx1-x0,cy1-y0);
            ctx.lineTo(cx2-x0,cy2-y0);
            ctx.stroke();
        }
    }
}


const animate = function(){
    renderCurrentFrame();

    windowBus.emit("windowCreate",{
        from: ID,
        to: "",
        init: false,
        anycast: true,
        shape: getWindowShape(),
    });
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);











