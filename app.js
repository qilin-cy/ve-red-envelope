
// ==== firebaseConfig ====
const firebaseConfig = {"apiKey": "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI", "authDomain": "love-message-boar.firebaseapp.com", "projectId": "love-message-boar", "storageBucket": "love-message-boar.firebasestorage.app", "messagingSenderId": "1057611515600", "appId": "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==== 暗号验证 3 天免输 ====
const PASS = "l0ve";
const EXPIRE_MS = 3*24*60*60*1000;
function validToken() {
  const ts = localStorage.getItem('love_token');
  return ts && (Date.now() - Number(ts) < EXPIRE_MS);
}
function verifyPass() {
  if (validToken()) return true;
  const input = prompt("输入暗号");
  if (input === PASS) { localStorage.setItem('love_token', Date.now()); return true; }
  alert("暗号错误~");
  return false;
}

// ==== 集合引用 ====
const envCol = db.collection("envelopes");
const msgCol = db.collection("messages");

// ==== 时间助手 ====
function bjDate() { return new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}); }
function bjDateTime(ts) { return ts? ts.toDate().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):'刚刚'; }
function bjDateOnly(ts) { return ts? ts.toDate().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}):''; }

// ==== 分页参数 ====
const pageSize = 6;
let envCursorStack=[], envForwardCursor=null;
let msgCursorStack=[], msgForwardCursor=null;

// ==== 领取红包（每天一次） ====
async function sendEnvelope() {
  if (!verifyPass()) return;
  const today = bjDate();
  const snap = await envCol.where('date','==',today).get();
  if (!snap.empty) { alert('今天已经领过啦'); return; }
  const amount = (Math.random()*15+15).toFixed(2);
  const note = ["亲亲基金","抱抱专款","偏爱红包"][Math.floor(Math.random()*3)];
  await envCol.add({
    amount, note, date: today,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  refreshData();
}

// ==== 留言 ====
async function addMessage() {
  if (!verifyPass()) return;
  const val = document.getElementById("newMsg").value.trim();
  if (!val) return alert("写点什么~");
  await msgCol.add({
    text: val,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("newMsg").value="";
  toggleForm(false);
  refreshData();
}

// ==== UI 辅助 ====
function toggleForm(force) {
  const box = document.getElementById("addBox");
  box.style.display = typeof force==="boolean" ? (force?'block':'none') : (box.style.display==='block'?'none':'block');
}

async function fetchPage(col,forwardCursor,backStack){
  let q = col.orderBy("time","desc").limit(pageSize);
  if (forwardCursor) q = q.startAfter(forwardCursor);
  const snap = await q.get();
  if (!snap.empty) {
     if (forwardCursor) backStack.push(forwardCursor);
     const docs=[...snap.docs];
     forwardCursor = docs[docs.length-1];
     return {docs, forwardCursor};
  }
  return {docs:[], forwardCursor:null};
}

async function refreshData(){ await loadEnvPage(true); await loadMsgPage(true);}
async function loadEnvPage(reset){
  if(reset){envCursorStack=[];envForwardCursor=null;}
  const res=await fetchPage(envCol,envForwardCursor,envCursorStack);
  envForwardCursor=res.forwardCursor;
  renderPanel("envPanel",res.docs,d=>`🧧 ¥${d.data().amount} - ${d.data().note}  (${bjDateTime(d.data().time)})`);
}
async function loadMsgPage(reset){
  if(reset){msgCursorStack=[];msgForwardCursor=null;}
  const res=await fetchPage(msgCol,msgForwardCursor,msgCursorStack);
  msgForwardCursor=res.forwardCursor;
  renderPanel("msgPanel",res.docs,d=>`📝 ${bjDateOnly(d.data().time)}：${d.data().text}`);
}

function renderPanel(id,docs,fmt){
  const el=document.getElementById(id);
  el.textContent="";
  if(docs.length===0){el.textContent="（暂无）";return;}
  docs.forEach(doc=>{const div=document.createElement("div");div.textContent=fmt(doc);el.appendChild(div);});
}

function nextPage(type){ type==='env'? loadEnvPage() : loadMsgPage(); }
function prevPage(type){ 
  if(type==='env'){
     if(envCursorStack.length<2)return;
     envCursorStack.pop();
     envForwardCursor=envCursorStack.pop();
     loadEnvPage();
  }else{
     if(msgCursorStack.length<2)return;
     msgCursorStack.pop();
     msgForwardCursor=msgCursorStack.pop();
     loadMsgPage();
  }
}

refreshData();
