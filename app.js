
// ==== 替换为你的 firebaseConfig ====
const firebaseConfig = {
  apiKey: "AIzaSyBDp6yO5Tnpooel0jyg5KkD6_FAji-WQOI",
  authDomain: "love-message-boar.firebaseapp.com",
  projectId: "love-message-boar",
  storageBucket: "love-message-boar.firebasestorage.app",
  messagingSenderId: "1057611515600",
  appId: "1:1057611515600:web:5e7c3ca57dee7a896ac0d5"
};
// ====================================

firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
const envCol=db.collection("envelopes");
const msgCol=db.collection("messages");

const pageSize=6;
let envCursorStack=[],envForwardCursor=null;
let msgCursorStack=[],msgForwardCursor=null;

async function sendEnvelope(){
  const amount=(Math.random()*15+15).toFixed(2);
  const note=["亲亲基金","抱抱专款","偏爱红包"][Math.floor(Math.random()*3)];
  await envCol.add({amount,note,time:firebase.firestore.FieldValue.serverTimestamp()});
  refreshData();
}
async function addMessage(){
  const val=document.getElementById("newMsg").value.trim();
  if(!val)return alert("写点什么~");
  await msgCol.add({text:val,time:firebase.firestore.FieldValue.serverTimestamp()});
  document.getElementById("newMsg").value="";
  toggleForm(false);
  refreshData();
}
function toggleForm(force){
  const box=document.getElementById("addBox");
  box.style.display=typeof force==="boolean"? (force?"block":"none") : (box.style.display==="block"?"none":"block");
}

async function fetchPage(col,forwardCursor,backStack){
  let q=col.orderBy("time","desc").limit(pageSize);
  if(forwardCursor) q=q.startAfter(forwardCursor);
  const snap=await q.get();
  if(!snap.empty){
     if(forwardCursor) backStack.push(forwardCursor);
     const docs=[...snap.docs];
     forwardCursor=docs[docs.length-1];
     return {docs,forwardCursor};
  }
  return {docs:[],forwardCursor:null};
}

async function refreshData(){
  await loadEnvPage(true);
  await loadMsgPage(true);
}
async function loadEnvPage(reset){
  if(reset){envCursorStack=[];envForwardCursor=null;}
  const res=await fetchPage(envCol,envForwardCursor,envCursorStack);
  envForwardCursor=res.forwardCursor;
  renderPanel("envPanel",res.docs,doc=>`🧧 ¥${doc.data().amount} - ${doc.data().note}  (${ts(doc.data().time)})`);
}
async function loadMsgPage(reset){
  if(reset){msgCursorStack=[];msgForwardCursor=null;}
  const res=await fetchPage(msgCol,msgForwardCursor,msgCursorStack);
  msgForwardCursor=res.forwardCursor;
  renderPanel("msgPanel",res.docs,doc=>`📝 ${dt(doc.data().time)}：${doc.data().text}`);
}
function ts(t){return t? t.toDate().toLocaleString("zh-CN"):"刚刚";}
function dt(t){return t? t.toDate().toLocaleDateString("zh-CN"):"";}
function renderPanel(id,docs,fmt){
  const el=document.getElementById(id);
  el.textContent="";
  if(docs.length===0){el.textContent="（暂无）";return;}
  docs.forEach(d=>{const div=document.createElement("div");div.textContent=fmt(d);el.appendChild(div);});
}
function nextPage(type){
  if(type==="env") loadEnvPage();
  else loadMsgPage();
}
function prevPage(type){
  if(type==="env"){
     if(envCursorStack.length<2)return;
     envCursorStack.pop(); // 当前页
     envForwardCursor=envCursorStack.pop(); // 上一页的起点
     loadEnvPage();
  }else{
     if(msgCursorStack.length<2)return;
     msgCursorStack.pop();
     msgForwardCursor=msgCursorStack.pop();
     loadMsgPage();
  }
}
refreshData();
