function showLove() {
  document.getElementById('messages').innerText = '💌 小临今天获得：亲亲 + 抱抱 + 独家偏爱！';
}
function playVoice() {
  document.getElementById('messages').innerText = '🎧 哥哥说：“小临是今天最可爱的崽。”';
}
function showMessage() {
  document.getElementById('log').style.display = 'block';
}
function toggleForm() {
  const box = document.getElementById('message-box');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
}
function addMessage() {
  const msg = document.getElementById('new-message').value.trim();
  if (msg) {
    const messages = document.getElementById('messages');
    const now = new Date().toLocaleDateString('zh-CN');
    messages.innerText = `📝 ${now}：${msg}\n` + messages.innerText;
    document.getElementById('new-message').value = '';
  }
}
