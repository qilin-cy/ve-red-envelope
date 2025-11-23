
// Firebase init
const firebaseConfig = {"apiKey": "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI", "authDomain": "love-message-boar.firebaseapp.com", "projectId": "love-message-boar", "storageBucket": "love-message-boar.firebasestorage.app", "messagingSenderId": "1057611515600", "appId": "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Passphrase control
const PASS = "l0ve";
const EXPIRE_MS = 3*24*60*60*1000; // 3 days

function tokenOK() {
  const ts = localStorage.getItem('love_token');
  return ts && (Date.now() - Number(ts) < EXPIRE_MS);
}
function verifyPass() {
  if (tokenOK()) return true;
  const input = prompt('输入暗号');
  if (input === PASS) { localStorage.setItem('love_token', Date.now()); return true; }
  alert('暗号错误'); return false;
}

// Collections
const envCol = db.collection('envelopes');
const msgCol = db.collection('messages');

// Time helpers
function bjDate() { return new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}); }
function bjDateTime(t){ return t ? t.toDate().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}) : ''; }
function bjDateOnly(t){ return t ? t.toDate().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}) : ''; }

// Envelope (daily)
async function sendEnvelope(){
  if(!verifyPass()) return;
  const today = bjDate();
  const snap = await envCol.where('date','==',today).get();
  if(!snap.empty){ alert('今天已经领过啦'); return; }
  const amt = (Math.random()*15+15).toFixed(2);
  await envCol.add({
    amount: amt,
    note: '偏爱红包',
    date: today,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  refreshData(true,false);
}

// Message
function toggleForm(){
  const box = document.getElementById('addBox');
  box.style.display = box.style.display==='block'?'none':'block';
}
async function addMessage(){
  if(!verifyPass()) return;
  const txt = document.getElementById('newMsg').value.trim();
  if(!txt) return alert('写点什么~');
  await msgCol.add({
    text: txt,
    time: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById('newMsg').value='';
  toggleForm();
  refreshData(false,true);
}

// Pagination
const pageSize = 6;
let envStack=[], envFwd=null, envTotal=0;
let msgStack=[], msgFwd=null, msgTotal=0;

async function count(col){ const s=await col.count().get(); return s.data().count; }
async function fetch(col,fwd,stack){
  let q=col.orderBy('time','desc').limit(pageSize);
  if(fwd) q=q.startAfter(fwd);
  const snap=await q.get();
  if(!snap.empty){
    if(fwd) stack.push(fwd);
    return {docs:snap.docs, fwd:snap.docs[snap.docs.length-1]};
  }
  return {docs:[], fwd:null};
}
function render(id,docs,fmt){
  const el=document.getElementById(id);
  el.innerHTML='';
  if(!docs.length){ el.textContent='（暂无）'; return; }
  docs.forEach(d=>{ const div=document.createElement('div'); div.textContent = fmt(d.data()); el.appendChild(div); });
}
function info(span,stackLen,total){
  const cur=stackLen+1;
  const pages=Math.max(1,Math.ceil(total/pageSize));
  document.getElementById(span).textContent=`第 ${cur}/${pages} 页`;
}

async function loadEnv(reset){
  if(reset){ envStack=[]; envFwd=null; envTotal=await count(envCol); }
  const res=await fetch(envCol,envFwd,envStack); envFwd=res.fwd;
  render('envPanel',res.docs,d=>`🧧 ¥${d.amount} (${bjDateTime(d.time)})`);
  info('envPageInfo',envStack.length,envTotal);
}
async function loadMsg(reset){
  if(reset){ msgStack=[]; msgFwd=null; msgTotal=await count(msgCol); }
  const res=await fetch(msgCol,msgFwd,msgStack); msgFwd=res.fwd;
  render('msgPanel',res.docs,d=>`📝 ${bjDateOnly(d.time)}：${d.text}`);
  info('msgPageInfo',msgStack.length,msgTotal);
}

async function refreshData(rE,rM){
  if(rE) await loadEnv(true);
  if(rM) await loadMsg(true);
}
function nextPage(t){ t==='env'?loadEnv(false):loadMsg(false); }
function prevPage(t){
  if(t==='env'){
    if(envStack.length<2)return;
    envStack.pop(); envFwd=envStack.pop(); loadEnv(false);
  }else{
    if(msgStack.length<2)return;
    msgStack.pop(); msgFwd=msgStack.pop(); loadMsg(false);
  }
}

refreshData(true,true);
