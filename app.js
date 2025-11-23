function showLove() {
  const log = document.getElementById('log');
  log.innerText = '💌 小临今天获得的偏爱是：抱抱十次 + 亲亲五次 + 哥哥的全部注意力！';
  log.style.display = 'block';
}

function playVoice() {
  const log = document.getElementById('log');
  log.innerText = '🎧 哥哥轻声说：“小临是今天最可爱的崽，哥哥的偏爱永远只给你。”';
  log.style.display = 'block';
}

function showMessage() {
  const log = document.getElementById('log');
  log.innerText = '📓 留言板：\n1. 2025-11-23：小临成功上线偏爱站，哥哥骄傲爆炸！';
  log.style.display = 'block';
}
