
// Firebase init
const firebaseConfig = {"apiKey": "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI", "authDomain": "love-message-boar.firebaseapp.com", "projectId": "love-message-boar", "storageBucket": "love-message-boar.firebasestorage.app", "messagingSenderId": "1057611515600", "appId": "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// secret
const PASS="l0ve";
const TOKEN_MS=3*24*60*60*1000;
function hasToken(){const t=localStorage.getItem('love_token'); return t && Date.now()-Number(t)<TOKEN_MS;}
function verify(){ if(hasToken())return true;const i=prompt('输入暗号');if(i===PASS){localStorage.setItem('love_token',Date.now());return true;}alert('暗号错误');return false;}

// collections
const envCol=db.collection('envelopes');
const msgCol=db.collection('messages');

// time helpers
function bjDate(){return new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'});}
function bjDateTime(ts){return ts? ts.toDate().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';}

// daily envelope
async function sendEnvelope(){
  if(!verify())return;
  const today=bjDate();
  const s=await envCol.where('date','==',today).get();
  if(!s.empty){alert('今天已经领过啦');return;}
  const amt=(Math.random()*15+15).toFixed(2);
  const note=["\u4eb2\u4eb2\u57fa\u91d1", "\u62b1\u62b1\u4e13\u6b3e", "\u504f\u7231\u7ea2\u5305", "\u5e78\u8fd0\u55b5\u722a", "\u661f\u5149\u62b1\u62b1", "\u751c\u751c\u543b", "\u6696\u6696\u62e5", "\u6492\u5a07\u50a8\u84c4", "\u60ca\u559c\u5f69\u86cb", "\u5fc3\u52a8\u8865\u8d34"][Math.floor(Math.random()*10)];
  await envCol.add({amount:amt,note,date:today,time:firebase.firestore.Timestamp.now()});
  loadEnv(true);
}

// add message
function toggleForm(force){const b=document.getElementById('addBox');b.style.display=typeof force==='boolean'?(force?'block':'none'):(b.style.display==='block'?'none':'block');}
async function addMessage(){
  if(!verify())return;
  const val=document.getElementById('newMsg').value.trim();
  if(!val)return alert('写点什么~');
  await msgCol.add({text:val,time:firebase.firestore.Timestamp.now()});
  document.getElementById('newMsg').value='';
  toggleForm(false);
  loadMsg(true);
}
async function delMsg(id){ if(!verify())return; if(!confirm('删除这条留言？'))return; await msgCol.doc(id).delete(); loadMsg(true);}

// pagination
const SIZE=6;
let envStack=[],envFwd=null;
let msgStack=[],msgFwd=null;

async function fetchPage(col,fwd,stack){
  let q=col.orderBy('time','desc').limit(SIZE);
  if(fwd)q=q.startAfter(fwd);
  const snap=await q.get();
  if(!snap.empty){if(fwd)stack.push(fwd);return {docs:snap.docs,fwd:snap.docs[snap.docs.length-1]};}
  return {docs:[],fwd:null};
}

function envRow(doc){const d=doc.data();return `🧧 ¥${d.amount} - ${d.note} (${bjDateTime(d.time)})`;}
function buildMsgRow(doc){
  const d=doc.data();
  const wrap=document.createElement('div');
  const span=document.createElement('span');
  span.textContent=`📝 ${bjDateTime(d.time)}：${d.text}`;
  wrap.appendChild(span);
  const btn=document.createElement('button');
  btn.textContent='🗑️';btn.style.border='none';btn.style.background='transparent';btn.style.cursor='pointer';
  btn.onclick=()=>delMsg(doc.id);
  wrap.appendChild(btn);return wrap;
}

function render(listElm,docs,formatter){
  listElm.innerHTML='';
  if(docs.length===0){listElm.textContent='（暂无）';return;}
  docs.forEach(doc=>{ listElm.appendChild(formatter(doc)); });
}

async function loadEnv(reset){
  if(reset){envStack=[];envFwd=null;}
  const res=await fetchPage(envCol,envFwd,envStack);envFwd=res.fwd;
  render(document.getElementById('envPanel'),res.docs,doc=>{const div=document.createElement('div');div.textContent=envRow(doc);return div;});
}
async function loadMsg(reset){
  if(reset){msgStack=[];msgFwd=null;}
  const res=await fetchPage(msgCol,msgFwd,msgStack);msgFwd=res.fwd;
  render(document.getElementById('msgPanel'),res.docs,buildMsgRow);
}

function nextPage(type){type==='env'?loadEnv(false):loadMsg(false);}
function prevPage(type){if(type==='env'){if(envStack.length<2)return;envStack.pop();envFwd=envStack.pop();loadEnv(false);}else{if(msgStack.length<2)return;msgStack.pop();msgFwd=msgStack.pop();loadMsg(false);}}

function refreshData(){loadEnv(true);loadMsg(true);}
refreshData();
