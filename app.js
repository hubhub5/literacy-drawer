/* 문해력 서랍 — 겉보기 프로토타입. 저장은 전부 브라우저(localStorage) 안에서만. */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => n.toLocaleString('ko-KR');

/* ---------- 상태 ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('ld_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ld_' + k, JSON.stringify(v)); } catch {} }
};
const S = {
  user: store.get('user', null),
  unlocked: store.get('unlocked', []),
  saved: store.get('saved', []),
  mine: store.get('mine', {}),
  votes: store.get('votes', []),
  reqs: store.get('reqs', []),
  cat: '전체', grade: '', q: '',
  pendingPost: null
};
const save = () => ['user', 'unlocked', 'saved', 'mine', 'votes', 'reqs'].forEach(k => store.set(k, S[k]));

/* ---------- 공통 ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600);
}
function img(src, alt = '') { return `<img src="${src}" alt="${esc(alt)}" loading="lazy" onload="this.classList.add('ok')">`; }
function lines(text, d = 0) { return text.split('\n').map((l, i) => `<span class="line-mask" style="--d:${d + i * .09}s"><span>${l}</span></span>`).join(''); }
function totalDownloads() { return POSTS.reduce((a, p) => a + p.downloads, 0) + S.unlocked.length; }
function commentCount(p) { return p.comments.length + (S.mine[p.id] ? 1 : 0) + Math.round(p.downloads * 0.21); }

/* ---------- 상단 ---------- */
function renderAuth() {
  $('#authSlot').innerHTML = S.user
    ? `<a class="tbtn solid" href="#/me" style="display:inline-flex;align-items:center">${esc(S.user.name)} 님</a>`
    : `<button class="tbtn hide-s" data-act="login">로그인</button> <button class="tbtn solid" data-act="join">가입</button>`;
}
function markNav() {
  const h = location.hash || '#/';
  $$('#nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === h || (a.getAttribute('href') === '#/' && h.startsWith('#/post'))));
}

/* ---------- 카드 ---------- */
function card(p, i = 0) {
  const open = S.unlocked.includes(p.id);
  return `<a class="card rv" style="--d:${(i % 3) * .08}s" href="#/post/${p.id}" data-shape="${p.shape}" data-cursor>
    <div class="ph">${img(p.img, p.title)}<span class="badge mono">${p.cat}</span><span class="lock mono">${open ? '받음' : '답변 후 받기'}</span></div>
    <div class="meta mono"><span>${p.no}</span><span>${p.date}</span><span>${p.grades.join('·')}</span></div>
    <h3><span>${esc(p.title)}</span></h3>
    <p>${esc(p.sub)}</p>
    <div class="foot mono"><span>PDF ${p.pages}p</span><span>받아감 ${fmt(p.downloads)}</span><span>개정 ${p.rev}</span></div>
  </a>`;
}
function filtered() {
  const q = S.q.trim();
  return POSTS.filter(p => (S.cat === '전체' || p.cat === S.cat)
    && (!S.grade || p.grades.includes(S.grade) || p.grades.includes('전 학년'))
    && (!q || (p.title + p.sub + p.cat + p.body.filter(b => typeof b === 'string').join(' ')).includes(q)));
}

/* ---------- 홈 ---------- */
let firstLoad = true;
function viewHome() {
  const B = firstLoad ? 1.5 : 0.1; firstLoad = false;
  const top = [...POSTS].sort((a, b) => b.downloads - a.downloads).slice(0, 5);
  const grades = ['초1', '초2', '초3', '초4', '초5', '초6', '중1'];
  app.innerHTML = `<div class="view">
  <section class="hero"><div class="wrap hero-grid">
    <div>
      <span class="mono mute">Archive No. 010 · 마지막 등재 ${POSTS[0].date}</span>
      <h1 style="margin-top:18px">${lines('애 공부 봐주다\n<em>막힐 때</em>\n꺼내 보는 자료.', B)}</h1>
      <p class="lede rv" style="--d:${B+.4}s">'우리 애는 왜 이럴까' 싶을 때마다 하나씩 만든 자료예요. 어려운 교육 이론 말고, 오늘 저녁 숙제 봐줄 때 바로 꺼내 쓸 수 있는 것만 모아 뒀어요.</p>
      <div class="stats rv" style="--d:${B+.55}s">
        <div><b data-count="${POSTS.length}">0</b><span class="mono">자료</span></div>
        <div><b data-count="${totalDownloads()}">0</b><span class="mono">받아간 횟수</span></div>
        <div><b data-count="${POSTS.reduce((a, p) => a + commentCount(p), 0)}">0</b><span class="mono">남겨주신 답</span></div>
      </div>
    </div>
    <div class="collage">
      <div class="ph c1 rv" style="--d:${B+.1}s" data-par=".06">${img(IMG[2])}</div>
      <div class="ph c2 rv" style="--d:${B+.3}s" data-par="-.04">${img(IMG[5])}</div>
      <p class="tag-float rv" style="--d:${B+.6}s"><span class="mono">Note</span>자료는 무료예요. 대신 우리 애 얘기 한 줄만 남겨 주세요. 다음 자료는 그 얘기들 보고 만들어요.</p>
    </div>
  </div></section>

  <div class="marquee" aria-hidden="true"><div class="marquee-in">${[...CATS.slice(1), '체크리스트', '기록지', '진단지', '대화 스크립트', ...CATS.slice(1), '체크리스트', '기록지', '진단지', '대화 스크립트'].map(c => `<span>${c}</span>`).join('')}</div></div>

  <section class="sec" id="list"><div class="wrap">
    <div class="sec-h"><span class="mono mute">01</span><h2>전체 자료</h2><small>고민 하나에 자료 하나씩. 최신순이에요.</small></div>
    <div class="filters">
      ${CATS.map(c => `<button class="chip${S.cat === c ? ' on' : ''}" data-cat="${c}">${c}</button>`).join('')}
      <select data-grade aria-label="학년"><option value="">학년 전체</option>${grades.map(g => `<option${S.grade === g ? ' selected' : ''}>${g}</option>`).join('')}</select>
      <input class="search" data-q placeholder="키워드 — 요약, 실수, 공식…" value="${esc(S.q)}">
    </div>
    <div class="masonry" id="grid"></div>
  </div></section>

  <section class="sec"><div class="wrap split">
    <div>
      <div class="sec-h"><span class="mono mute">02</span><h2>이번 달 많이 받아간 자료</h2></div>
      <ol class="rank">${top.map((p, i) => `<li class="rv" style="--d:${i * .06}s"><span class="n">${i + 1}</span><a href="#/post/${p.id}"><b>${esc(p.title)}</b><span class="mono">${p.cat} · ${p.grades.join('·')}</span></a><span class="mono mute">${fmt(p.downloads)}</span></li>`).join('')}</ol>
    </div>
    <aside class="letter rv">
      <span class="mono">운영자 한마디 · 2026.11.08</span>
      <h3>'다른 집은 어떻게 해요?' 물어보시는 분들께</h3>
      <p>자료 받아 가시면서 남겨 주신 답, 하나하나 다 읽고 있어요. 제일 많이 보이는 말이 의외로 '우리 애만 이런가요?'였어요.</p>
      <p>아니에요. 진짜 아니에요. 지난달 '실수였어' 자료에만 비슷한 얘기가 400개 넘게 달렸어요. 여기가 정답을 알려 드리는 곳이라기보다는, '우리 애만 그런 게 아니었구나' 하고 한숨 돌리고 가시는 곳이면 좋겠어요.</p>
      <p>(저도 그거 하나로 꽤 버텼거든요ㅎㅎ)</p>
      <div class="sign">촉촉한마케터</div>
    </aside>
  </div></section>

  <section class="sec" id="finder"><div class="wrap">
    <div class="sec-h"><span class="mono mute">03</span><h2>우리 애한테 맞는 자료 찾기</h2><small>두 번만 누르면 돼요.</small></div>
    <div class="finder rv">
      <div class="finder-l"><h3>뭐부터<br>봐야 할지<br>모르겠다면</h3><p>학년이랑 요즘 신경 쓰이는 장면을 골라 주세요. 제일 맞는 자료를 찾아 드릴게요.</p></div>
      <div class="finder-r">
        <div class="fstep"><span class="mono">Step 1 · 학년</span><div class="chips" data-f="g">${grades.map(g => `<button class="chip" data-v="${g}">${g}</button>`).join('')}</div></div>
        <div class="fstep"><span class="mono">Step 2 · 요즘 신경 쓰이는 장면</span><div class="chips" data-f="c">
          <button class="chip" data-v="독해">읽었는데 내용을 몰라요</button><button class="chip" data-v="어휘">단어를 건너뛰어요</button>
          <button class="chip" data-v="수학 문해">공식만 외워요</button><button class="chip" data-v="공부 습관">실수가 반복돼요</button>
          <button class="chip" data-v="선행 판단">선행이 고민돼요</button><button class="chip" data-v="엄마 마음">제가 먼저 지쳐요</button></div></div>
        <div class="fresult" id="fresult"><span class="mono mute">학년이랑 장면을 고르면 여기에 자료가 떠요.</span></div>
      </div>
    </div>
  </div></section>

  <section class="sec" id="requests"><div class="wrap split">
    <div>
      <div class="sec-h"><span class="mono mute">04</span><h2>자료 요청함</h2><small>공감 많은 것부터 만들어요.</small></div>
      <ul class="req" id="reqList"></ul>
      <form class="req-form" data-act="req"><input placeholder="이런 자료 있었으면 — 예: 일기 쓰기 싫어하는 아이" maxlength="40"><button class="btn">요청</button></form>
    </div>
    <aside class="letter rv" style="align-self:start">
      <span class="mono">다음에 올라올 자료</span>
      <h3>받아쓰기는 잘하는데, 일기는 세 줄에서 멈추는 아이</h3>
      <p>요청 1위예요. 지금 양식 만들고 있어요. 문장 늘리는 연습보다, 하루 중에 장면 하나 고르는 연습부터 해 보려구요.</p>
      <p class="mono" style="margin-top:16px">예정 2026.11.20 · 초1~초3</p>
    </aside>
  </div></section>
  </div>`;
  renderGrid(); renderReqs(); counters(); observe();
}
function renderGrid() {
  const list = filtered();
  $('#grid').innerHTML = list.length ? list.map(card).join('') : `<p class="empty">아직 이 조건에 맞는 자료가 없어요. 요청함에 남겨 주시면 만들어 볼게요.</p>`;
  observe();
}
function renderReqs() {
  const all = [...S.reqs, ...REQUESTS];
  $('#reqList').innerHTML = all.map((r, i) => {
    const on = S.votes.includes(r.t);
    return `<li class="rv" style="--d:${i * .05}s"><div><b>${esc(r.t)}</b><span class="mono">${esc(r.by)}</span></div><button class="vote${on ? ' on' : ''}" data-vote="${esc(r.t)}">공감 ${r.v + (on ? 1 : 0)}</button></li>`;
  }).join('');
  observe();
}

/* ---------- 자료 양식 ---------- */
function sheetHTML(s, p, i) {
  const head = `<div class="sh-top"><span>${s.label}</span><span>문해력 서랍</span></div>
    <div class="sh-title">${s.title} <em>${s.em}</em></div><div class="sh-sub">${s.sub}</div><div class="sh-rule"></div>`;
  let b = '';
  if (s.tpl === 'checklist') {
    b = `<div class="sh-cols">${s.groups.map((g, gi) => `<div class="sh-group"><h4>${g.h}</h4><h5>${g.d}</h5>${g.items.map((it, ii) => `<div class="sh-item"><i class="${(gi + ii) % 3 === 0 ? 'x' : ''}"></i>${it}</div>`).join('')}</div>`).join('')}</div>
      <div class="sh-lines"><div class="mono2">NOTES + 관찰</div><div></div><div></div></div>`;
  } else if (s.tpl === 'form') {
    b = `<table class="sh-tbl${s.hand === false ? '' : ' hand'}"><thead><tr>${s.cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${s.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="sh-lines"><div class="mono2">이번 주 발견한 것</div><div></div><div></div></div>`;
  } else if (s.tpl === 'matrix') {
    const [tl, tr, bl, br] = s.q;
    const q = x => `<div class="sh-q"><b>${x[0]}</b><small>${x[1]}</small><div class="it">${x[2].map(t => `<div><i></i>${t}</div>`).join('')}<div><i></i></div></div></div>`;
    b = `<div class="sh-matrix"><div class="yax">${s.y} →</div>${q(tl)}${q(tr)}${q(bl)}${q(br)}<div></div><div class="xax">${s.x} →</div></div>`;
  } else if (s.tpl === 'tracker') {
    const days = Array.from({ length: s.days }, (_, k) => k + 1);
    b = `<table class="sh-tr"><thead><tr><th>유형</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>
      ${s.rowsLabel.map((r, ri) => `<tr><td>${r}</td>${days.map(d => `<td>${(s.marks[ri] || []).includes(d) ? '✓' : ''}</td>`).join('')}</tr>`).join('')}
      ${Array.from({ length: Math.max(0, 7 - s.rowsLabel.length) }, () => `<tr><td></td>${days.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table>
      <div class="sh-lines"><div class="mono2">한 달 뒤, 표를 보고</div><div></div></div>`;
  } else if (s.tpl === 'scale') {
    b = `<div class="sh-scale">${s.items.map((it, k) => `<div class="r"><span><b>${String(k + 1).padStart(2, '0')}</b>${it}</span><span class="dots">${[1, 2, 3, 4, 5].map(n => `<i class="${s.marks[k] === n ? 'x' : ''}">${n}</i>`).join('')}</span></div>`).join('')}</div>
      <div class="sh-lines"><div class="mono2">합계 · 메모</div><div></div></div>`;
  } else if (s.tpl === 'note') {
    b = `<div class="sh-note"><div class="k"><div class="box"><small>KEYWORD</small>${s.key}</div><div class="qq">${s.q}</div></div>
      <div class="v"><div class="formula">${s.formula}</div>${s.lines.map(l => `<div class="ln">${l}</div>`).join('')}<div class="ln"></div><div class="ln"></div><div class="ln"></div><div class="ln"></div></div></div>`;
  }
  return `<div class="sheet">${head}<div class="sh-body">${b}</div><div class="sh-foot"><span>© 문해력 서랍 · ${p.no}</span><span>p.${String(i + 1).padStart(2, '0')}</span></div></div>`;
}

/* ---------- 게시물 ---------- */
function prefill(p) { return p.questions.map((q, i) => `Q${i + 1}. ${q}\n→ `).join('\n'); }
function viewPost(id) {
  const p = POSTS.find(x => x.id === id);
  if (!p) return viewHome();
  const idx = POSTS.indexOf(p);
  const prev = POSTS[idx + 1], next = POSTS[idx - 1];
  const open = S.unlocked.includes(p.id);
  const saved = S.saved.includes(p.id);
  const title = p.title.replace(/^(.*?)([,，]\s?)(.*)$/, '$1$2<span class="q">$3</span>');
  app.innerHTML = `<article class="view">
  <header class="post-head wrap">
    <div class="crumb mono rv in"><a href="#/">자료</a><span>/</span><a href="#/" data-cat-go="${p.cat}">${p.cat}</a><span>/</span><span>${p.no}</span></div>
    <h1>${lines(title, .1)}</h1>
    <p class="sub rv" style="--d:.4s">${esc(p.sub)}</p>
    <div class="tags rv" style="--d:.5s">${p.grades.map(g => `<span class="tag">${g}</span>`).join('')}<span class="tag">PDF ${p.pages}p</span><span class="tag">개정 ${p.rev}</span></div>
  </header>
  <div class="wrap"><div class="ph cover rv" style="--d:.3s" data-par=".08">${img(p.img, p.title)}</div></div>

  <div class="wrap post-grid">
    <div>
      <div class="body">${p.body.map(b => typeof b === 'string'
        ? (b === '-' ? `<div class="sep rv">· · ·</div>` : `<p class="rv">${esc(b)}</p>`)
        : `<div class="says rv">${b.say.map(([w, t]) => `<div class="say"><span>${w}</span><q>${esc(t)}</q></div>`).join('')}</div>`).join('')}</div>

      <div class="block-h"><span class="mono">A</span><h2>이런 분들께</h2></div>
      <ul class="who">${p.forWhom.map(w => `<li class="rv">${w}</li>`).join('')}</ul>

      <div class="block-h"><span class="mono">B</span><h2>자료 구성</h2><span class="mono" style="margin-left:auto">${p.pages} pages · A4</span></div>
      <table class="toc-tbl">${p.contents.map((c, i) => `<tr class="rv"><td>${String(i + 1).padStart(2, '0')}</td><td>${c[0]}</td><td>${c[1]}</td></tr>`).join('')}</table>
    </div>
    <aside class="side"><div class="side-in">
      <div class="info">
        <div class="row"><span>자료 번호</span><span class="mono" style="font-size:12px">${p.no}</span></div>
        <div class="row"><span>분류</span><span>${p.cat}</span></div>
        <div class="row"><span>대상</span><span>${p.grades.join(' · ')}</span></div>
        <div class="row"><span>형식</span><span>PDF · A4 · ${p.pages}쪽</span></div>
        <div class="row"><span>등재 / 개정</span><span>${p.date} · ${p.rev}차</span></div>
        <div class="row"><span>받아간 분</span><span>${fmt(p.downloads + (open ? 1 : 0))}명</span></div>
        <a class="cta" href="#gate" data-act="to-gate">${open ? '자료 받기' : '답변 남기고 자료 받기'}</a>
      </div>
      <div class="side-actions"><button data-act="save" class="${saved ? 'on' : ''}">${saved ? '서랍에 담김' : '내 서랍에 담기'}</button><button data-act="print">인쇄 미리보기</button></div>
      <div class="share"><span class="mono">공유하기</span><div class="share-grid">
        <button data-share="링크">링크 복사</button><button data-share="카카오톡">카카오톡</button>
        <button data-share="밴드">밴드</button><button data-share="인스타그램">인스타그램</button>
        <button data-share="스레드">스레드</button><button data-share="네이버 카페">네이버 카페</button>
      </div></div>
    </div></aside>
  </div>

  <section class="desk"><div class="wrap">
    <div class="desk-h"><div><span class="mono">Preview · ${p.sheets.length} of ${p.pages} pages</span><h2 style="margin-top:6px">자료 미리보기</h2></div><span class="mono">${open ? '전체 페이지 열림' : '첫 장만 공개 · 답변 후 전체 열림'}</span></div>
    <div class="sheets">${p.sheets.map((s, i) => `<div class="sheet-wrap rv${!open && i > 0 ? ' locked' : ''}" style="--d:${i * .12}s" data-sheet="${i}">${sheetHTML(s, p, i)}
      <div class="lockmask"><div><span class="mono">Locked</span>아래 질문에 답하면 열려요</div></div>
      <div class="cap mono"><span>${s.title} ${s.em}</span><span>p.${String(i + 1).padStart(2, '0')}</span></div></div>`).join('')}</div>
  </div></section>

  <div class="wrap" style="max-width:860px">
    <div class="block-h" id="gate" style="margin-top:80px"><span class="mono">C</span><h2>답하고 받아가기</h2><span class="mono" style="margin-left:auto">${fmt(commentCount(p))} answers</span></div>
    <div id="gateSlot"></div>

    <div class="block-h"><span class="mono">D</span><h2>먼저 답해주신 분들</h2><span class="mono" style="margin-left:auto">닉네임이랑 학년만 보여요</span></div>
    <ul class="comments" id="cList"></ul>

    <nav class="pn">
      ${prev ? `<a href="#/post/${prev.id}"><span class="mono">← 이전 자료</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a href="#/post/${next.id}"><span class="mono">다음 자료 →</span><b>${esc(next.title)}</b></a>` : '<span></span>'}
    </nav>
    <div class="block-h"><span class="mono">E</span><h2>같이 받아간 자료</h2></div>
  </div>
  <div class="wrap"><div class="masonry">${POSTS.filter(x => x.id !== p.id && (x.cat === p.cat || x.grades.some(g => p.grades.includes(g)))).slice(0, 3).map(card).join('')}</div></div>
  </article>`;
  renderGate(p); renderComments(p); observe();
}
function renderGate(p) {
  const slot = $('#gateSlot'); if (!slot) return;
  if (S.unlocked.includes(p.id)) {
    slot.innerHTML = `<div class="unlocked"><div><span class="mono" style="opacity:.6">Unlocked · ${p.no}</span><h3 style="margin-top:6px">답 남겨 주셔서 감사해요. 자료 열렸어요!</h3><p>남겨 주신 얘기는 다음 자료 만들 때 꼭 참고할게요.</p></div>
      <div class="row2"><button class="btn" data-act="download">PDF 받기 · ${p.pages}p</button><button class="btn ghost" data-act="print">인쇄용 보기</button></div></div>`;
    return;
  }
  const logged = !!S.user;
  slot.innerHTML = `<div class="gate">
    <div class="gate-h"><div><h3>질문 ${p.questions.length}개에 짧게 답해 주세요</h3><p>한 줄이면 돼요. 정답 같은 거 없어요. 지금 우리 애 모습 그대로 적어 주세요.</p></div>
      <div class="steps"><span class="${logged ? 'done' : 'on'}">1 가입</span><span class="${logged ? 'on' : ''}">2 답변</span><span>3 받기</span></div></div>
    <textarea id="answer" spellcheck="false" ${logged ? '' : 'readonly tabindex="-1"'}>${prefill(p)}</textarea>
    <div class="gate-f"><label><input type="checkbox" id="anon"> 닉네임 대신 '익명'으로 남기기</label><span class="mono" id="ansCount">0 / ${p.questions.length} 답변</span><button class="btn" id="submitAns" ${logged ? '' : 'disabled'}>답변 남기고 자료 받기</button></div>
    ${logged ? '' : `<div class="veil"><div><p>가입하면 바로 답 남길 수 있어요.<br>이메일만 있으면 30초면 끝나요.</p><button class="btn" data-act="join" data-post="${p.id}">가입하고 답변하기</button><div style="margin-top:10px"><button class="ul-link" style="font-size:13px" data-act="login" data-post="${p.id}">이미 가입했어요</button></div></div></div>`}
  </div>`;
  if (logged) {
    const ta = $('#answer');
    const count = () => {
      const parts = ta.value.split(/Q\d+\./).slice(1);
      const n = parts.filter(x => (x.split('→')[1] || '').trim().length >= 2).length;
      $('#ansCount').textContent = `${n} / ${p.questions.length} 답변`;
      return { n, parts };
    };
    ta.addEventListener('input', count); count();
    ta.addEventListener('focus', () => { const i = ta.value.indexOf('→ ') + 2; if (ta.value.slice(i, i + 1) === '\n' || i === ta.value.length) ta.setSelectionRange(i, i); }, { once: true });
    $('#submitAns').addEventListener('click', () => {
      const { n, parts } = count();
      if (n < p.questions.length) { toast('아직 안 쓴 답이 있어요. 한 줄이면 돼요.'); return; }
      S.mine[p.id] = { n: $('#anon').checked ? '익명' : S.user.name, g: S.user.grade || '-', d: '방금', a: parts.map(x => x.split('→')[1].trim()), me: true };
      S.unlocked.push(p.id); save();
      $$('.sheet-wrap.locked').forEach((el, i) => setTimeout(() => el.classList.remove('locked'), 250 + i * 220));
      renderGate(p); renderComments(p, true);
      const cta = $('.info .cta'); if (cta) cta.textContent = '자료 받기';
      toast('자료 열렸어요! 미리보기 잠긴 페이지도 같이 열렸어요.');
    });
  }
}
function renderComments(p, fresh) {
  const list = [...(S.mine[p.id] ? [S.mine[p.id]] : []), ...p.comments];
  $('#cList').innerHTML = list.map((c, i) => `<li class="${fresh && i === 0 ? 'new' : 'rv'}">
    <div class="c-h"><b>${esc(c.n)}</b><span class="mono">${esc(c.g)} · ${c.d}</span>${c.me ? '<span class="mono">· 내 답변</span>' : ''}</div>
    <div class="c-qa">${p.questions.map((q, k) => `<div><span>${q}</span><p>${esc(c.a[k] || '')}</p></div>`).join('')}</div>
    ${(c.re || []).map(r => `<div class="c-re"><b>${esc(r.n)}</b><p>${esc(r.t)}</p></div>`).join('')}
    <div class="c-act"><button data-act="metoo">저도 그래요 ${c.me ? 0 : 3 + i * 7 % 19}</button><button data-act="noop">답글${c.re ? ' ' + c.re.length : ''}</button></div></li>`).join('')
    + `<li class="mono mute" style="border:0">나머지 ${fmt(commentCount(p) - list.length)}개 답은 작성자 보호를 위해 접어 뒀어요.</li>`;
  observe();
}

/* ---------- 아카이브 ---------- */
function viewArchive() {
  const byMonth = {};
  POSTS.forEach(p => { const m = p.date.slice(0, 7); (byMonth[m] = byMonth[m] || []).push(p); });
  app.innerHTML = `<div class="view wrap">
    <header class="arch-h"><span class="mono mute">Index · ${POSTS.length} entries</span><h1 style="margin-top:12px">${lines('아카이브')}</h1><p class="rv in">올린 순서대로 정리했어요. 내용 고친 자료는 개정 번호가 올라가요. 예전 버전 받으신 분들께는 새 버전 다시 보내 드려요.</p></header>
    ${Object.entries(byMonth).map(([m, ps]) => `
      <div class="sec-h" style="margin:48px 0 0;border-bottom:1px solid var(--line)"><h2 style="font-size:18px">${m.replace('.', '년 ')}월</h2><small>${ps.length}건</small></div>
      <div class="scroll-x"><table class="arch-tbl"><thead><tr><th>번호</th><th class="hide-s"></th><th>제목</th><th class="hide-s">분류</th><th class="hide-s">대상</th><th>개정</th><th>받아감</th></tr></thead><tbody>
      ${ps.map(p => `<tr class="rv" data-go="${p.id}"><td class="m">${p.no}</td><td class="hide-s"><div class="ph thumb">${img(p.img)}</div></td><td class="t"><b>${esc(p.title)}</b><div class="mono mute" style="margin-top:4px">${p.date}${S.unlocked.includes(p.id) ? ' · 받음' : ''}</div></td><td class="hide-s">${p.cat}</td><td class="hide-s m">${p.grades.join('·')}</td><td class="m">r${p.rev}</td><td class="m">${fmt(p.downloads)}</td></tr>`).join('')}
      </tbody></table></div>`).join('')}
    <div style="height:40px"></div></div>`;
  observe();
}

/* ---------- 소개 ---------- */
function viewAbout() {
  app.innerHTML = `<div class="view wrap"><section class="about">
    <div class="ph rv" data-par=".05">${img(IMG[6])}</div>
    <div>
      <span class="mono mute">About · 운영자</span>
      <h1 style="margin-top:14px">${lines('거창한 거 말고,\n오늘 저녁 숙제 시간.', .1)}</h1>
      <p class="rv">처음엔 별생각 없이 시작했어요. 어떤 어머님이 보내 주신 DM 한 줄이 시작이었어요. '애가 공식은 다 외우는데 문제를 못 풀어요. 이거 뭘 봐야 하는 거예요?'</p>
      <p class="rv">거기 답하려고 체크리스트를 하나 만들었는데, 그거 받아 가신 분들이 '우리 애는 이래요' 하고 또 다른 얘기를 보내 주셨어요. 그렇게 하나씩 쌓인 게 지금 자료들이에요. 그래서 여기 있는 건 전부 누군가의 '우리 애가 요즘 이래요'에서 시작했어요.</p>
      <p class="rv">자료 받으실 때 질문에 답해 달라고 하는 것도 그래서예요. 그 답 보고 다음 자료를 만들거든요.</p>
      <ul class="rules" style="margin-top:36px">
        <li class="rv"><span>01</span>자료 하나엔 고민 하나만 다뤄요. 이것저것 다 넣지 않아요.</li>
        <li class="rv"><span>02</span>10분이면 바로 시작할 수 있는 것만 만들어요.</li>
        <li class="rv"><span>03</span>애를 고치려는 자료가 아니라, 애를 좀 더 잘 보려는 자료예요.</li>
        <li class="rv"><span>04</span>제휴 링크 안 넣어요. 혹시 넣게 되면 꼭 말씀드릴게요.</li>
        <li class="rv"><span>05</span>남겨 주신 답은 다음 자료 만드는 데만 써요.</li>
      </ul>
      <div class="letter" style="margin-top:36px;background:transparent"><div class="sign" style="margin:0">촉촉한마케터 드림</div><span class="mono">Moist Notes · 2026</span></div>
    </div></section></div>`;
  observe();
}

/* ---------- 내 서랍 ---------- */
function viewMe() {
  if (!S.user) { openAuth('login'); location.hash = '#/'; return; }
  const got = POSTS.filter(p => S.unlocked.includes(p.id));
  const sv = POSTS.filter(p => S.saved.includes(p.id));
  app.innerHTML = `<div class="view wrap">
    <div class="profile"><div class="avatar">${esc(S.user.name.slice(0, 1))}</div><div><span class="mono">Member since ${S.user.since}</span><h1>${esc(S.user.name)} 님의 서랍</h1><span class="mono">${esc(S.user.email)} · ${esc(S.user.grade || '학년 미선택')}</span></div>
      <div class="stat"><div><b>${got.length}</b><span class="mono mute">받은 자료</span></div><div><b>${sv.length}</b><span class="mono mute">담은 자료</span></div><div><b>${Object.keys(S.mine).length}</b><span class="mono mute">남긴 답</span></div></div></div>
    <div class="sec-h" style="margin-top:48px"><h2>받은 자료</h2><small>언제든 다시 받을 수 있어요.</small></div>
    ${got.length ? `<div class="lib-grid">${got.map(card).join('')}</div>` : `<p class="empty">아직 받은 자료가 없어요. <a class="ul-link" href="#/">자료 둘러보기</a></p>`}
    <div class="sec-h" style="margin-top:64px"><h2>담아둔 자료</h2><small>나중에 볼 자료.</small></div>
    ${sv.length ? `<div class="lib-grid">${sv.map(card).join('')}</div>` : `<p class="empty">마음에 드는 자료에서 '내 서랍에 담기'를 눌러 보세요.</p>`}
    <div style="margin:56px 0 0;display:flex;gap:8px"><button class="btn ghost" data-act="logout">로그아웃</button></div>
  </div>`;
  observe();
}

/* ---------- 가입/로그인 ---------- */
function openAuth(tab = 'join', postId) {
  S.pendingPost = postId || S.pendingPost;
  const m = $('#authModal');
  $$('.tabs button', m).forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  const grades = ['예비 초등', '초1', '초2', '초3', '초4', '초5', '초6', '중1', '중2', '중3'];
  $('#authBody').innerHTML = tab === 'join' ? `
    <h3>가입하고<br>자료 받아 가세요</h3><p>가입하면 자료 전부 받을 수 있고, 새 자료 올라오면 제일 먼저 알려 드려요.</p>
    <div class="social"><button type="button" data-act="social">카카오로 시작</button><button type="button" data-act="social">네이버로 시작</button></div>
    <div class="or">또는 이메일로</div>
    <form data-act="do-join">
      <label class="field"><span>닉네임 — 댓글에 보여요</span><input name="name" required maxlength="10" placeholder="예: 하윤맘"></label>
      <label class="field"><span>이메일</span><input name="email" type="email" required placeholder="you@example.com"></label>
      <label class="field"><span>비밀번호</span><input name="pw" type="password" required minlength="4" placeholder="4자 이상"></label>
      <div class="field"><span>아이 학년 — 학년에 맞는 자료부터 보여 드려요</span><div class="grade-pick">${grades.map((g, i) => `<button type="button" class="chip${i === 4 ? ' on' : ''}" data-pick="${g}">${g}</button>`).join('')}</div></div>
      <label class="agree"><input type="checkbox" required> 이용약관과 개인정보 수집에 동의합니다. 남긴 답은 닉네임·학년이랑 같이 공개돼요.</label>
      <label class="agree"><input type="checkbox" checked> 새 자료 소식(주 1회) 받기</label>
      <button class="btn">가입하고 계속하기</button>
    </form>` : `
    <h3>반가워요!</h3><p>받아 두신 자료 그대로 있어요.</p>
    <div class="social"><button type="button" data-act="social">카카오 로그인</button><button type="button" data-act="social">네이버 로그인</button></div>
    <div class="or">또는 이메일로</div>
    <form data-act="do-login">
      <label class="field"><span>이메일</span><input name="email" type="email" required placeholder="you@example.com"></label>
      <label class="field"><span>비밀번호</span><input name="pw" type="password" required></label>
      <button class="btn">로그인</button>
      <p class="mono mute" style="margin-top:14px;text-align:center">프로토타입 — 아무 이메일이나 입력하면 됩니다</p>
    </form>`;
  m.classList.add('open');
  setTimeout(() => { const f = $('#authBody input'); f && f.focus(); }, 400);
}
function closeModals() { $$('.modal.open').forEach(m => m.classList.remove('open')); }
function signedIn(user) {
  S.user = user; save(); closeModals(); renderAuth();
  toast(`${user.name} 님, 반가워요!`);
  if (S.pendingPost) { const id = S.pendingPost; S.pendingPost = null; if (location.hash !== '#/post/' + id) location.hash = '#/post/' + id; else route(); setTimeout(() => $('#gate')?.scrollIntoView({ behavior: 'smooth' }), 500); }
  else route();
}

/* ---------- 검색 ---------- */
function openSearch() {
  $('#searchModal').classList.add('open');
  const inp = $('#searchInput'); inp.value = ''; drawSearch(''); setTimeout(() => inp.focus(), 200);
}
function drawSearch(q) {
  const r = POSTS.filter(p => !q || (p.title + p.sub + p.cat).includes(q));
  $('#searchList').innerHTML = r.length ? r.map(p => `<li><a href="#/post/${p.id}"><span class="mono">${p.no}</span><span><b>${esc(p.title)}</b><br><span class="mute" style="font-size:13px">${p.cat} · ${p.grades.join('·')}</span></span></a></li>`).join('')
    : `<li style="padding:22px" class="mute">찾는 자료가 없어요. <a class="ul-link" href="#/requests">요청함에 남기기</a></li>`;
}

/* ---------- 라우터 ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [r, id] = h.split('/');
  closeModals(); $('#nav').classList.remove('open');
  if (r === 'post') viewPost(id);
  else if (r === 'archive') viewArchive();
  else if (r === 'about') viewAbout();
  else if (r === 'me') viewMe();
  else viewHome();
  markNav();
  const anchor = (r === 'finder' || r === 'requests') ? $('#' + r) : null;
  if (anchor) setTimeout(() => anchor.scrollIntoView({ behavior: 'smooth' }), 60);
  else window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------- 애니메이션 ---------- */
let io;
function observe() {
  io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px' });
  $$('.rv:not(.in), h1:not(.in)').forEach(el => io.observe(el));
}
function counters() {
  $$('[data-count]').forEach(el => {
    const to = +el.dataset.count, t0 = performance.now(), dur = 1600;
    const tick = t => { const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 4)))); if (k < 1) requestAnimationFrame(tick); };
    setTimeout(() => requestAnimationFrame(tick), 1800);
  });
}
let lastY = 0;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  $('#progress').style.width = (location.hash.startsWith('#/post') ? (y / h) * 100 : 0) + '%';
  $('#top').classList.toggle('hide', y > 300 && y > lastY && !$('#nav').classList.contains('open'));
  $('#toTop').classList.toggle('on', y > 900);
  lastY = y;
  $$('[data-par]').forEach(el => {
    const r = el.getBoundingClientRect(); const im = $('img', el); if (!im) return;
    const off = (r.top + r.height / 2 - innerHeight / 2) * +el.dataset.par;
    im.style.transform = `translateY(${off}px) scale(1.12)`;
  });
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act],[data-cat],[data-share],[data-vote],[data-tab],[data-pick],[data-close],[data-go],[data-cat-go],[data-sheet],.fstep .chip');
  if (!t) return;
  if (t.matches('[data-close]')) return closeModals();
  if (t.dataset.tab) return openAuth(t.dataset.tab);
  if (t.dataset.pick) { $$('.grade-pick .chip').forEach(c => c.classList.toggle('on', c === t)); return; }
  if (t.dataset.go) { location.hash = '#/post/' + t.dataset.go; return; }
  if (t.dataset.catGo) { e.preventDefault(); S.cat = t.dataset.catGo; location.hash = '#/'; setTimeout(() => $('#list')?.scrollIntoView({ behavior: 'smooth' }), 120); return; }
  if (t.dataset.cat) { S.cat = t.dataset.cat; $$('.filters .chip').forEach(c => c.classList.toggle('on', c === t)); renderGrid(); return; }
  if (t.dataset.vote) {
    const v = t.dataset.vote; const on = S.votes.includes(v);
    S.votes = on ? S.votes.filter(x => x !== v) : [...S.votes, v]; save(); renderReqs();
    if (!on) toast('공감 눌렀어요. 공감 많은 것부터 만들게요.'); return;
  }
  if (t.dataset.share) {
    if (t.dataset.share === '링크') { navigator.clipboard?.writeText(location.href).catch(() => {}); toast('링크를 복사했어요.'); }
    else toast(`${t.dataset.share}로 공유하기 — 프로토타입에서는 버튼만 동작해요.`);
    return;
  }
  if (t.dataset.sheet !== undefined && !t.classList.contains('locked')) {
    const p = POSTS.find(x => location.hash.endsWith(x.id));
    $('#sheetBig').innerHTML = sheetHTML(p.sheets[+t.dataset.sheet], p, +t.dataset.sheet);
    $('#sheetModal').classList.add('open'); return;
  }
  if (t.closest('.fstep')) {
    const box = t.closest('.chips'); $$('.chip', box).forEach(c => c.classList.toggle('on', c === t));
    const g = $('[data-f="g"] .on')?.dataset.v, c = $('[data-f="c"] .on')?.dataset.v;
    if (!g && !c) return;
    let r = POSTS.filter(p => (!c || p.cat === c) && (!g || p.grades.includes(g) || p.grades.includes('전 학년')));
    if (!r.length) r = POSTS.filter(p => !c || p.cat === c);
    $('#fresult').innerHTML = `<span class="mono mute">${r.length}개의 자료를 찾았어요</span>` + r.map((p, i) => `<a href="#/post/${p.id}" style="animation-delay:${i * .07}s"><b>${esc(p.title)}</b><span class="mono mute">${p.grades.join('·')} →</span></a>`).join('');
    return;
  }
  const a = t.dataset.act;
  if (a === 'noop') { e.preventDefault(); toast('준비 중인 페이지예요.'); }
  if (a === 'menu') $('#nav').classList.toggle('open');
  if (a === 'search') openSearch();
  if (a === 'theme') {
    const r = document.documentElement; const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    r.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', r.dataset.theme); $('#themeBtn').textContent = dark ? 'D' : 'L';
  }
  if (a === 'join' || a === 'login') openAuth(a, t.dataset.post);
  if (a === 'social') signedIn({ name: '서랍손님', email: 'kakao-user', grade: '초3', since: '2026.11' });
  if (a === 'logout') { S.user = null; save(); renderAuth(); toast('로그아웃했어요.'); location.hash = '#/'; }
  if (a === 'to-gate') { e.preventDefault(); $('#gate').scrollIntoView({ behavior: 'smooth' }); }
  if (a === 'save') {
    const id = location.hash.split('/')[2]; if (!S.user) return openAuth('join', id);
    const on = S.saved.includes(id); S.saved = on ? S.saved.filter(x => x !== id) : [...S.saved, id]; save();
    t.classList.toggle('on', !on); t.textContent = on ? '내 서랍에 담기' : '서랍에 담김'; toast(on ? '서랍에서 뺐어요.' : '내 서랍에 담았어요.');
  }
  if (a === 'download') toast('PDF 다운로드가 시작됩니다 — 프로토타입이라 실제 파일은 없어요.');
  if (a === 'print') { const p = POSTS.find(x => location.hash.endsWith(x.id)); $('#sheetBig').innerHTML = sheetHTML(p.sheets[0], p, 0); $('#sheetModal').classList.add('open'); }
  if (a === 'metoo') { const m = t.textContent.match(/\d+/); t.textContent = '저도 그래요 ' + (+m[0] + 1); t.style.color = 'var(--ink)'; t.removeAttribute('data-act'); }
});
document.addEventListener('submit', e => {
  const f = e.target; const a = f.dataset.act; if (!a) return; e.preventDefault();
  const d = Object.fromEntries(new FormData(f));
  if (a === 'do-join') signedIn({ name: d.name, email: d.email, grade: $('.grade-pick .on')?.dataset.pick, since: '2026.11' });
  if (a === 'do-login') signedIn({ name: d.email.split('@')[0], email: d.email, grade: '', since: '2026.10' });
  if (a === 'newsletter') { f.reset(); toast('구독했어요. 다음 목요일에 만나요.'); }
  if (a === 'req') {
    const v = $('input', f).value.trim(); if (v.length < 4) return toast('조금만 더 자세히 적어 주세요.');
    if (!S.user) return openAuth('join');
    S.reqs.unshift({ t: v, v: 0, by: `${S.user.grade || ''} · ${S.user.name}` }); save(); f.reset(); renderReqs(); toast('요청함에 넣었어요.');
  }
});
document.addEventListener('input', e => {
  if (e.target.matches('[data-q]')) { S.q = e.target.value; renderGrid(); }
  if (e.target.id === 'searchInput') drawSearch(e.target.value.trim());
});
document.addEventListener('change', e => { if (e.target.matches('[data-grade]')) { S.grade = e.target.value; renderGrid(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModals();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
});
const tag = $('#cursorTag');
document.addEventListener('mousemove', e => {
  tag.style.left = e.clientX + 'px'; tag.style.top = e.clientY + 'px';
  const c = e.target.closest('[data-cursor] .ph, .sheet-wrap');
  tag.classList.toggle('on', !!c);
  if (c) tag.textContent = c.classList.contains('sheet-wrap') ? (c.classList.contains('locked') ? '잠김' : '크게 보기') : '자료 보기';
});
$('#toTop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
addEventListener('scroll', onScroll, { passive: true });
addEventListener('hashchange', route);

/* ---------- 시작 ---------- */
const th = store.get('theme', null);
if (th) { document.documentElement.dataset.theme = th; $('#themeBtn').textContent = th === 'dark' ? 'L' : 'D'; }
renderAuth(); route();
setTimeout(() => $('#intro').classList.add('done'), 1500);
setTimeout(() => $('#intro').remove(), 2700);
})();
