
const firebaseConfig = {"apiKey": "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI", "authDomain": "love-message-boar.firebaseapp.com", "projectId": "love-message-boar", "storageBucket": "love-message-boar.firebasestorage.app", "messagingSenderId": "1057611515600", "appId": "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const PASS = "l0ve";
const EXPIRE_MS = 3*24*60*60*1000;
function tokenOK() {
  const ts = localStorage.getItem('love_token');
  return ts && Date.now()-Number(ts) < EXPIRE_MS;
}
function verifyPass() {
  if(tokenOK()) return true;
  const input = prompt('输入暗号');
  if(input===PASS){localStorage.setItem('love_token',Date.now());return true;}
  alert('暗号错误~');return false;
}

const envCol = db.collection('envelopes');
const msgCol = db.collection('messages');

function bjDate(){return new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'});}
function bjDateTime(ts){return ts?ts.toDate().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'';}

const pageSize=6;
let envStack=[],envFwd=null;
let msgStack=[],msgFwd=null;

async function sendEnvelope(){
  if(!verifyPass())return;
  const today=bjDate();
  const snap=await envCol.where('date','==',today).get();
  if(!snap.empty){alert('今天已经领过啦');return;}
  const amount=(Math.random()*15+15).toFixed(2);
  const note=NOTES[Math.floor(Math.random()*NOTES.length)];
  await envCol.add({amount,note,date:today,time:firebase.firestore.Timestamp.now()});
  refreshData(true,false);
}

function toggleForm(force){
  const box=document.getElementById('addBox');
  box.style.display=typeof force==='boolean'?(force?'block':'none'):(box.style.display==='block'?'none':'block');
}
async function addMessage(){
  if(!verifyPass())return;
  const txt=document.getElementById('newMsg').value.trim();
  if(!txt)return alert('写点什么~');
  await msgCol.add({text:txt,time:firebase.firestore.Timestamp.now()});
  document.getElementById('newMsg').value='';
  toggleForm(false);
  refreshData(false,true);
}

async function deleteMessage(id){
  if(!verifyPass())return;
  if(!confirm('删除这条留言？'))return;
  await msgCol.doc(id).delete();
  refreshData(false,true);
}

async function count(col){const s=await col.count().get();return s.data().count;}
async function fetch(col,fwd,stack){
  let q=col.orderBy('time','desc').limit(pageSize);
  if(fwd)q=q.startAfter(fwd);
  const snap=await q.get();
  if(!snap.empty){if(fwd)stack.push(fwd);return{docs:snap.docs,fwd:snap.docs[snap.docs.length-1]};}
  return{docs:[],fwd:null};
}
function renderEnv(d){const data=d.data();return `🧧 ¥${data.amount} - ${data.note}  (${bjDateTime(data.time)})`;}
function renderMsg(d){const data=d.data();return `📝 ${bjDateTime(data.time)}：${data.text}`;}
function buildDiv(text,id){
  const div=document.createElement('div');div.textContent=text;return div;
}
function buildMsgDiv(doc){
  const wrapper=document.createElement('div');
  const span=document.createElement('span');span.textContent=renderMsg(doc);
  const del=document.createElement('button');del.textContent='🗑️';del.style.marginLeft='6px';
  del.style.border='none';del.style.background='transparent';del.style.cursor='pointer';
  del.onclick=()=>deleteMessage(doc.id);
  wrapper.appendChild(span);wrapper.appendChild(del);return wrapper;
}

function renderPanel(id,docs,isMsg){
  const el=document.getElementById(id);el.innerHTML='';
  if(!docs.length){el.textContent='（暂无）';return;}
  docs.forEach(doc=>{el.appendChild(isMsg?buildMsgDiv(doc):buildDiv(renderEnv(doc)));});
}

function pageInfo(span,len,total){const cur=len+1;const pages=Math.max(1,Math.ceil(total/pageSize));
document.getElementById(span).textContent=`第 ${cur}/${pages} 页`;}
let envTotal=0,msgTotal=0;
async function loadEnv(reset){
  if(reset){envStack=[];envFwd=null;envTotal=await count(envCol);}
  const{docs,fwd}=await fetch(envCol,envFwd,envStack);envFwd=fwd;
  renderPanel('envPanel',docs,false);pageInfo('envPageInfo',envStack.length,envTotal);
}
async function loadMsg(reset){
  if(reset){msgStack=[];msgFwd=null;msgTotal=await count(msgCol);}
  const{docs,fwd}=await fetch(msgCol,msgFwd,msgStack);msgFwd=fwd;
  renderPanel('msgPanel',docs,true);pageInfo('msgPageInfo',msgStack.length,msgTotal);
}
async function refreshData(reEnv,reMsg){if(reEnv)await loadEnv(true);if(reMsg)await loadMsg(true);}
function nextPage(t){t==='env'?loadEnv(false):loadMsg(false);}
function prevPage(t){if(t==='env'){if(envStack.length<2)return;envStack.pop();envFwd=envStack.pop();loadEnv(false);}
  else{if(msgStack.length<2)return;msgStack.pop();msgFwd=msgStack.pop();loadMsg(false);}}
refreshData(true,true);
