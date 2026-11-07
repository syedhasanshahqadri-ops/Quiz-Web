const $=s=>document.querySelector(s);
const TOTAL_SECONDS=30*60;
const page=document.body.dataset.page;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const mmss=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
let tt;const toast=m=>{const t=$("#toast");if(!t)return;t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2400)};

/* theme */
$("#themeBtn").onclick=()=>{const n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;store.set("qz_theme",n)};

/* ===== START PAGE ===== */
if(page==="index"){
  $("#studentName").value=store.get("studentName")||"";$("#rollNumber").value=store.get("rollNumber")||"";
  $("#studentForm").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#studentName").value.trim(),roll=$("#rollNumber").value.trim();
    if(!name||!roll)return;
    store.set("studentName",name);store.set("rollNumber",roll);
    store.set("quizStart",String(Date.now()));store.set("quizEnd",String(Date.now()+TOTAL_SECONDS*1000));store.del("quizAns");store.del("quizResult");
    location.href="quiz.html";
  });
}

/* ===== QUIZ PAGE ===== */
if(page==="quiz"){
  const name=store.get("studentName"),roll=store.get("rollNumber"),end=+store.get("quizEnd"),start=+store.get("quizStart");
  if(!name||!roll||!end){location.replace("index.html")}
  else{
    let db=null;
    if(window.FIREBASE_CONFIG&&window.firebase){firebase.initializeApp(FIREBASE_CONFIG);db=firebase.firestore()}
    $("#displayName").textContent=name;$("#displayRoll").textContent=roll;
    let ans;try{ans=JSON.parse(store.get("quizAns")||"[]")}catch(e){ans=[]}
    if(ans.length!==QS.length)ans=QS.map(()=>-1);
    let cur=0,finished=false;const L="ABCD";
    const pal=$("#pal");pal.innerHTML=QS.map((_,i)=>`<button type="button" data-i="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join("");
    function paint(){
      const q=QS[cur];
      $("#qSub").textContent=q.s;$("#qNum").textContent="Question "+(cur+1)+" of "+QS.length;$("#qText").textContent=q.q;
      $("#opts").innerHTML=q.o.map((o,k)=>`<button type="button" class="opt${ans[cur]===k?" sel":""}" data-k="${k}"><i>${L[k]}</i><span>${o}</span></button>`).join("");
      $("#prev").disabled=cur===0;$("#next").textContent=cur===QS.length-1?"Review & submit":"Next →";
      const n=ans.filter(a=>a>=0).length;
      $("#answeredCount").textContent=n;$("#bar").style.width=(n/QS.length*100)+"%";
      [...pal.children].forEach((b,i)=>{b.classList.toggle("on",ans[i]>=0);b.classList.toggle("cur",i===cur)});
    }
    const go=i=>{cur=Math.max(0,Math.min(QS.length-1,i));paint()};
    const pick=k=>{ans[cur]=k;store.set("quizAns",JSON.stringify(ans));paint()};
    $("#opts").onclick=e=>{const b=e.target.closest(".opt");if(b)pick(+b.dataset.k)};
    pal.onclick=e=>{const b=e.target.closest("button");if(b)go(+b.dataset.i)};
    $("#prev").onclick=()=>go(cur-1);
    $("#next").onclick=()=>{if(cur===QS.length-1)ask();else go(cur+1)};
    $("#clear").onclick=()=>{ans[cur]=-1;store.set("quizAns",JSON.stringify(ans));paint()};
    document.addEventListener("keydown",e=>{if(!$("#modal").hidden)return;if(e.key==="ArrowRight")go(cur+1);else if(e.key==="ArrowLeft")go(cur-1);else if("1234".includes(e.key)&&e.key)pick(+e.key-1)});
    /* submit */
    const modal=$("#modal");
    function ask(){const un=ans.filter(a=>a<0).length;$("#mText").textContent=un?"You have "+un+" unanswered question"+(un>1?"s":"")+". You cannot change your answers after submitting.":"You have answered every question. You cannot change your answers after submitting.";modal.hidden=false}
    $("#submitBtn").onclick=ask;modal.addEventListener("click",e=>{if(e.target.hasAttribute("data-x"))modal.hidden=true});
    $("#confirmBtn").onclick=()=>finish();
    async function finish(){
      if(finished)return;finished=true;modal.hidden=true;clearInterval(timer);$("#confirmBtn").disabled=true;
      let c=0,w=0;const sub={};
      QS.forEach((q,i)=>{const s=sub[q.s]=sub[q.s]||{c:0,t:0};s.t++;if(ans[i]===q.a){c++;s.c++}else if(ans[i]>=0)w++});
      const used=Math.max(0,Math.min(TOTAL_SECONDS,Math.round((Date.now()-start)/1000)));
      const r={id:"Q"+Date.now().toString(36).toUpperCase(),name,roll,score:c,wrong:w,unanswered:QS.length-c-w,total:QS.length,percent:Math.round(c/QS.length*100),timeSec:used,time:mmss(used),subjects:sub,date:new Date().toISOString(),saved:false};
      toast("Submitting your test...");
      try{
        if(db){await Promise.race([db.collection("quizResults").doc(r.id).set({...r,createdAt:firebase.firestore.FieldValue.serverTimestamp()}),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),8000))]);r.saved=true}
      }catch(x){console.error(x)}
      store.set("quizResult",JSON.stringify(r));["quizEnd","quizStart","quizAns"].forEach(store.del);
      location.href="result.html";
    }
    /* timer */
    const tb=$("#timerBox");
    function tick(){const left=Math.max(0,Math.round((end-Date.now())/1000));$("#timer").textContent=mmss(left);tb.classList.toggle("low",left<=300);if(left<=0&&!finished){toast("Time is over. Submitting your test.");finish()}}
    const timer=setInterval(tick,500);tick();
    addEventListener("beforeunload",e=>{if(!finished){e.preventDefault();e.returnValue=""}});
    paint();
  }
}

/* ===== RESULT PAGE ===== */
if(page==="result"){
  let r=null;try{r=JSON.parse(store.get("quizResult")||"null")}catch(e){}
  if(!r){location.replace("index.html")}
  else{
    const grade=r.percent>=80?"Excellent work!":r.percent>=60?"Well done!":r.percent>=40?"Good effort":"Keep practising";
    $("#grade").textContent=grade;
    $("#msg").textContent=r.percent>=60?"You did great. Here is your final result.":"Here is your final result. Every attempt makes you better.";
    $("#resultName").textContent=r.name;$("#resultRoll").textContent=r.roll;
    $("#correctAnswers").textContent=r.score;$("#wrongAnswers").textContent=r.wrong;$("#unanswered").textContent=r.unanswered;$("#timeUsed").textContent=r.time;
    $("#finalScore").textContent=r.score+" / "+r.total;
    const names=Object.keys(r.subjects);
    $("#subjects").innerHTML=names.map(n=>`<div class="sr"><span style="text-align:left;color:var(--ink)">${n}</span><div class="tr"><i data-w="${r.subjects[n].c/r.subjects[n].t*100}"></i></div><span>${r.subjects[n].c}/${r.subjects[n].t}</span></div>`).join("");
    const sn=$("#saveNote");
    if(r.saved){sn.textContent="Your result has been sent to your teacher."}else{sn.textContent="Your result could not be sent to your teacher. Please download the result image and show it to them.";sn.classList.add("err")}
    /* animate */
    const rf=$("#rf");let n=0;const to=r.percent;
    requestAnimationFrame(()=>{rf.style.strokeDashoffset=326.7*(1-r.percent/100);document.querySelectorAll("#subjects i").forEach(i=>i.style.width=i.dataset.w+"%")});
    const step=()=>{n=Math.min(to,n+Math.max(1,Math.ceil(to/60)));$("#percentage").textContent=n+"%";if(n<to)requestAnimationFrame(step)};step();
    /* result image */
    $("#dl").onclick=async()=>{
      try{await document.fonts.ready}catch(e){}
      const W=1080,H=1500,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
      const F=w=>w+' "Outfit","DM Sans","Segoe UI",Arial,sans-serif';
      const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,"#2A1B8F");g.addColorStop(.6,"#5B3CF0");g.addColorStop(1,"#1A1150");x.fillStyle=g;x.fillRect(0,0,W,H);
      x.globalAlpha=.25;x.fillStyle="#16B890";x.beginPath();x.arc(980,120,230,0,7);x.fill();x.fillStyle="#F5A524";x.beginPath();x.arc(60,1380,170,0,7);x.fill();x.globalAlpha=1;
      const rr=(a,b,w,h,rad)=>{x.beginPath();x.moveTo(a+rad,b);x.arcTo(a+w,b,a+w,b+h,rad);x.arcTo(a+w,b+h,a,b+h,rad);x.arcTo(a,b+h,a,b,rad);x.arcTo(a,b,a+w,b,rad);x.closePath()};
      x.fillStyle="#9CF5DC";x.font=F("700 30px");x.textAlign="center";x.fillText("CLASS 9 · 10 KNOWLEDGE TEST",W/2,110);
      x.fillStyle="#fff";x.font=F("800 78px");x.fillText("Result Card",W/2,200);
      rr(70,250,940,1130,44);x.fillStyle="#fff";x.fill();
      x.fillStyle="#6B6890";x.font=F("700 26px");x.textAlign="left";x.fillText("STUDENT",120,330);x.fillText("ROLL NUMBER",620,330);
      x.fillStyle="#17153B";x.font=F("700 44px");const nm=r.name.length>22?r.name.slice(0,21)+"…":r.name;x.fillText(nm,120,390);x.fillText(r.roll.slice(0,14),620,390);
      const cx=W/2,cy=640,R=150;x.lineWidth=28;x.lineCap="round";x.strokeStyle="#EDEAFF";x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();
      x.strokeStyle="#16B890";x.beginPath();x.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*r.percent/100);x.stroke();
      x.textAlign="center";x.fillStyle="#17153B";x.font=F("800 100px");x.fillText(r.percent+"%",cx,cy+22);x.fillStyle="#6B6890";x.font=F("700 34px");x.fillText(r.score+" / "+r.total,cx,cy+72);
      x.fillStyle="#5B3CF0";x.font=F("800 48px");x.fillText(grade,cx,880);
      const st=[["Correct",r.score],["Wrong",r.wrong],["Unanswered",r.unanswered],["Time",r.time]];
      st.forEach(([l,v],i)=>{const a=120+i*220;rr(a,920,200,120,24);x.fillStyle="#EDEAFF";x.fill();x.fillStyle="#17153B";x.font=F("800 46px");x.fillText(String(v),a+100,985);x.fillStyle="#6B6890";x.font=F("700 22px");x.fillText(l,a+100,1020)});
      x.textAlign="left";x.fillStyle="#17153B";x.font=F("800 34px");x.fillText("Subject-wise",120,1100);
      names.forEach((s,i)=>{const y=1150+i*38,v=r.subjects[s];x.font=F("700 24px");x.fillStyle="#17153B";x.fillText(s,120,y+8);rr(380,y-8,480,16,8);x.fillStyle="#EDEAFF";x.fill();if(v.c){rr(380,y-8,Math.max(16,480*v.c/v.t),16,8);x.fillStyle="#5B3CF0";x.fill()}x.textAlign="right";x.fillStyle="#6B6890";x.fillText(v.c+"/"+v.t,960,y+8);x.textAlign="left"});
      x.textAlign="center";x.fillStyle="#E3DEFF";x.font=F("500 26px");x.fillText(new Date(r.date).toLocaleString("en-GB",{dateStyle:"long",timeStyle:"short"}),W/2,1440);
      c.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="result-"+r.roll.replace(/[^\w-]+/g,"_")+".png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)},"image/png");
    };
  }
}
