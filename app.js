
// Firebase config
const firebaseConfig = {
  "apiKey": "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI",
  "authDomain": "love-message-boar.firebaseapp.com",
  "projectId": "love-message-boar",
  "storageBucket": "love-message-boar.firebasestorage.app",
  "messagingSenderId": "1057611515600",
  "appId": "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const USERNAME = "qilin";
const PASSWORD = "chenyuan";

let envCol, msgCol;
const pageSize = 6;
let envCursorStack=[], envForwardCursor=null, envTotal=0;
let msgCursorStack=[], msgForwardCursor=null, msgTotal=0;

function login(){
  const u=document.getElementById('user').value.trim();
  const p=document.getElementById('pwd').value.trim();
  if(u!==USERNAME||p!==PASSWORD){alert('暗号不对哦');return;}
  auth.signInAnonymously().then(initApp).catch(e=>alert('登录失败:'+e.message));
}

auth.onAuthStateChanged(user=>{if(user) initApp();});

function initApp(){document.getElementById('loginBox').style.display='none';
document.getElementById('app').style.display='block';
envCol=db.collection('envelopes');msgCol=db.collection('messages');
refreshData(true,true);}

function bjDate(){return new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'});}
function bjTime(ts){return ts?ts.toDate().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}):'';}
function bjDateOnly(ts){return ts?ts.toDate().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}):'';}

async function sendEnvelope(){const today=bjDate();
const s=await envCol.where('date','==',today).get();
if(!s.empty){alert('今天已经领过啦');return;}
const amt=(Math.random()*15+15).toFixed(2);
const note=['亲亲基金','抱抱专款','偏爱红包'][Math.floor(Math.random()*3)];
await envCol.add({amount:amt,note,date:today,time:firebase.firestore.FieldValue.serverTimestamp()});
refreshData(true,false);}

async function addMessage(){const v=document.getElementById('newMsg').value.trim();
if(!v)return alert('写点内容~');
await msgCol.add({text:v,time:firebase.firestore.FieldValue.serverTimestamp()});
document.getElementById('newMsg').value='';toggleForm(false);refreshData(false,true);}
function toggleForm(force){const b=document.getElementById('addBox');
b.style.display=typeof force==='boolean'?(force?'block':'none'):(b.style.display==='block'?'none':'block');}

async function countCol(col){const snap=await col.count().get();return snap.data().count;}

async function fetch(col, cursor, stack){let q=col.orderBy('time','desc').limit(pageSize);
if(cursor)q=q.startAfter(cursor);const snap=await q.get();if(!snap.empty){if(cursor)stack.push(cursor);
return {docs:snap.docs,fwd:snap.docs[snap.docs.length-1]};}return{docs:[],fwd:null};}

function render(id,docs,fmt){const el=document.getElementById(id);el.innerHTML='';
if(docs.length===0){el.textContent='（暂无）';return;}docs.forEach(d=>{const div=document.createElement('div');
div.textContent=fmt(d.data());el.appendChild(div);});}

function pageInfo(span,stackLen,total){const current=stackLen+1;
const pages=Math.max(1,Math.ceil(total/pageSize));
document.getElementById(span).textContent=`第 ${current}/${pages} 页`; }

async function loadEnv(reset){if(reset){envCursorStack=[];envForwardCursor=null;envTotal=await countCol(envCol);}
const res=await fetch(envCol,envForwardCursor,envCursorStack);envForwardCursor=res.fwd;
render('envPanel',res.docs,d=>`🧧 ¥${d.amount} - ${d.note} (${bjTime(d.time)})`);
pageInfo('envPageInfo',envCursorStack.length,envTotal);}

async function loadMsg(reset){if(reset){msgCursorStack=[];msgForwardCursor=null;msgTotal=await countCol(msgCol);}
const res=await fetch(msgCol,msgForwardCursor,msgCursorStack);msgForwardCursor=res.fwd;
render('msgPanel',res.docs,d=>`📝 ${bjDateOnly(d.time)}：${d.text}`);
pageInfo('msgPageInfo',msgCursorStack.length,msgTotal);}

async function refreshData(rE,rM){if(rE)await loadEnv(true);if(rM)await loadMsg(true);}

function nextPage(t){t==='env'?loadEnv(false):loadMsg(false);}
function prevPage(t){if(t==='env'){if(envCursorStack.length<2)return;
envCursorStack.pop();envForwardCursor=envCursorStack.pop();loadEnv(false);}
else{if(msgCursorStack.length<2)return;
msgCursorStack.pop();msgForwardCursor=msgCursorStack.pop();loadMsg(false);}}
