(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const INVITE_DEFAULT = 'https://discord.gg/Ycy85nDpWX';
  const STORAGE_KEY = 'kotiki_cosmic_public_settings_v4';
  const DEFAULTS = { title: 'Котики', invite: INVITE_DEFAULT, description: 'Здесь можно знакомиться, делиться творчеством, участвовать в конкурсах и находить своих.', music: '' };
  let adminAuthenticated = false;
  function authMessage(node, text, error=false) { if(!node)return; node.textContent=text; node.classList.toggle('error',!!error); }
  async function api(path, options={}) {
    const response = await fetch(path, { credentials:'same-origin', cache:'no-store', ...options, headers:{'Content-Type':'application/json', ...(options.headers||{})} });
    let data={}; try{data=await response.json();}catch{}
    if(!response.ok){const error=new Error(data.error||`Ошибка сервера (${response.status})`);error.status=response.status;throw error;}
    return data;
  }
  function showAdminAuth(recovery=false){
    $('#adminAuthPanel').hidden=false; $('#adminTools').hidden=true;
    $('#adminLoginForm').hidden=recovery; $('#adminRecoveryForm').hidden=!recovery;
    authMessage($('#adminAuthMessage'),''); authMessage($('#recoveryMessage'),'');
  }
  function showAdminTools(){adminAuthenticated=true;$('#adminAuthPanel').hidden=true;$('#adminTools').hidden=false;}
  async function openAdminSecure(){
    try{await api('/api/auth/me',{method:'GET',headers:{}});showAdminTools();}
    catch{adminAuthenticated=false;showAdminAuth(false);}
    showModal('adminBackdrop');
  }
  $('#adminLoginForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const button=$('#adminLoginForm button[type="submit"]');button.disabled=true;
    try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:$('#adminPassword').value})});$('#adminPassword').value='';showAdminTools();authMessage($('#adminAuthMessage'),'');toast('Вход выполнен.');}
    catch(err){authMessage($('#adminAuthMessage'),err.message||'Не удалось войти.',true);}
    finally{button.disabled=false;}
  });
  $('#adminRecoveryForm')?.addEventListener('submit',async e=>{
    e.preventDefault();const button=$('#adminRecoveryForm button[type="submit"]');button.disabled=true;
    try{await api('/api/auth/recover',{method:'POST',body:JSON.stringify({key:$('#adminRecoveryKey').value})});$('#adminRecoveryKey').value='';showAdminTools();authMessage($('#recoveryMessage'),'');toast('Доступ восстановлен.');}
    catch(err){authMessage($('#recoveryMessage'),err.message||'Не удалось восстановить доступ.',true);}
    finally{button.disabled=false;}
  });
  $('#showRecovery')?.addEventListener('click',()=>showAdminAuth(true));
  $('#backToLogin')?.addEventListener('click',()=>showAdminAuth(false));
  async function logoutAdmin(showToast=true){try{await api('/api/auth/logout',{method:'POST',body:'{}'});}catch{}adminAuthenticated=false;showAdminAuth(false);closeModal('adminBackdrop');if(showToast)toast('Сеанс владельца завершён.');}
  $('#adminLogout')?.addEventListener('click',()=>logoutAdmin());
  $('#lockSite')?.addEventListener('click',()=>logoutAdmin());
  let toastTimer = 0, serverAgeTimer = 0;
  function toast(text) { const node = $('#toast'); if (!node) return; node.textContent = text; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3200); }
  function showModal(id) { const node = document.getElementById(id); if (!node) return; node.classList.add('open'); node.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open'); $('input,button,a,textarea', node)?.focus(); }
  function closeModal(id) { const node = document.getElementById(id); if (!node) return; node.classList.remove('open'); node.setAttribute('aria-hidden','true'); if (!$('.modal-backdrop.open') && !$('.drawer-backdrop.open')) document.body.classList.remove('modal-open'); }
  function message(node, text, error=false) { if (!node) return; node.textContent=text; node.classList.toggle('error',!!error); }
  function safeUrl(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
  function discordCreatedAt(id) { try { const n=BigInt(String(id)); const t=Number(n >> 22n)+1420070400000; return Number.isFinite(t)&&t>0 ? new Date(t) : null; } catch { return null; } }
  function ageParts(date, now=new Date()) { if (!(date instanceof Date)||Number.isNaN(date.getTime())) return null; let cur=new Date(date), years=0, months=0; while(years<100 && new Date(cur.getFullYear()+1,cur.getMonth(),cur.getDate())<=now){cur.setFullYear(cur.getFullYear()+1);years++;} while(months<11){const next=new Date(cur.getFullYear(),cur.getMonth()+1,cur.getDate());if(next>now)break;cur=next;months++;} return {years,months,days:Math.max(0,Math.floor((now-cur)/86400000))}; }
  function plural(n, f) { const x=Math.abs(n)%100, l=x%10; if(x>10&&x<20)return f[2]; if(l>1&&l<5)return f[1]; if(l===1)return f[0]; return f[2]; }
  function renderAge(date) { const d=$('#serverCreated'), a=$('#serverAge'); if(!d||!a||!date)return; d.textContent=`Сервер создан ${date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}`; const p=ageParts(date); if(!p)return; const parts=[]; if(p.years)parts.push(`${p.years} ${plural(p.years,['год','года','лет'])}`); if(p.months)parts.push(`${p.months} ${plural(p.months,['месяц','месяца','месяцев'])}`); if((!p.years&&!p.months)||p.days)parts.push(`${p.days} ${plural(p.days,['день','дня','дней'])}`); a.textContent=`Возраст сервера: ${parts.join(' ')}`; }
  function applySettings(s) { const settings={...DEFAULTS,...s}; $('#brandName').textContent=settings.title||DEFAULTS.title; $('#heroTitle').textContent=settings.title||DEFAULTS.title; $('#heroDescription').textContent=settings.description||DEFAULTS.description; for(const id of ['topJoin','heroJoin','bottomJoin']) { const n=$(`#${id}`); if(n)n.href=safeUrl(settings.invite)||INVITE_DEFAULT; } const audio=$('#siteAudio'), music=safeUrl(settings.music); if(music&&audio.src!==music)audio.src=music; if(!music){audio.pause();audio.removeAttribute('src');$('#musicToggle').classList.remove('playing');} $('#cfgTitle').value=settings.title; $('#cfgInvite').value=settings.invite; $('#cfgDescription').value=settings.description; $('#cfgMusic').value=settings.music; }
  function openDrawer(){ $('#drawerBackdrop').classList.add('open'); $('#drawerBackdrop').setAttribute('aria-hidden','false'); $('#openDrawer').setAttribute('aria-expanded','true'); document.body.classList.add('modal-open'); }
  function closeDrawer(){ $('#drawerBackdrop').classList.remove('open'); $('#drawerBackdrop').setAttribute('aria-hidden','true'); $('#openDrawer').setAttribute('aria-expanded','false'); if(!$('.modal-backdrop.open'))document.body.classList.remove('modal-open'); }
  $('#year').textContent=new Date().getFullYear();
  const reveal=$$('.reveal'); if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target);}}),{threshold:.12,rootMargin:'0px 0px -35px 0px'}); reveal.forEach((n,i)=>{n.style.setProperty('--reveal-delay',`${Math.min(i%4,3)*90}ms`);n.classList.add('reveal-pending');obs.observe(n);});}else reveal.forEach(n=>n.classList.add('is-visible'));
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; if(!reduce&&window.matchMedia?.('(pointer: fine)').matches){let frame=0;document.addEventListener('pointermove',e=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;document.documentElement.style.setProperty('--pointer-x',`${((e.clientX/Math.max(innerWidth,1)-.5)*2).toFixed(3)}`);document.documentElement.style.setProperty('--pointer-y',`${((e.clientY/Math.max(innerHeight,1)-.5)*2).toFixed(3)}`);});},{passive:true});}
  let saved={}; try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch{} applySettings(saved);
  $('#openDrawer').addEventListener('click',openDrawer); $('#closeDrawer').addEventListener('click',closeDrawer); $('#drawerBackdrop').addEventListener('click',e=>{if(e.target===$('#drawerBackdrop'))closeDrawer();}); $('#openGuide').addEventListener('click',()=>showModal('guideBackdrop')); $('#drawerGuide').addEventListener('click',()=>{closeDrawer();showModal('guideBackdrop');}); $('#openAdmin').addEventListener('click',()=>openAdminSecure()); $('#drawerAdmin').addEventListener('click',()=>{closeDrawer();openAdminSecure();}); $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close))); $$('.modal-backdrop').forEach(b=>b.addEventListener('click',e=>{if(e.target===b)closeModal(b.id);})); document.addEventListener('keydown',e=>{if(e.key==='Escape'){$$('.modal-backdrop.open').forEach(n=>closeModal(n.id));closeDrawer();}});
  $('#saveSite').addEventListener('click',()=>{const settings={title:$('#cfgTitle').value.trim().slice(0,80)||DEFAULTS.title,invite:safeUrl($('#cfgInvite').value.trim())||INVITE_DEFAULT,description:$('#cfgDescription').value.trim().slice(0,700)||DEFAULTS.description,music:safeUrl($('#cfgMusic').value.trim())};applySettings(settings);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));}catch{} message($('#siteMessage'),'Сохранено только в этом браузере. Для публикации изменений нужно обновить файлы сайта.');});
  $('#sendDiscordMessage')?.addEventListener('click',async()=>{const button=$('#sendDiscordMessage'),url=$('#cfgWebhook').value.trim(),text=$('#cfgWebhookMessage').value.trim();message($('#discordMessageStatus'),'');if(!url){message($('#discordMessageStatus'),'Вставь ссылку вебхука Discord.',true);return;}if(!text){message($('#discordMessageStatus'),'Напиши текст сообщения.',true);return;}button.disabled=true;button.textContent='Отправляю…';try{await api('/api/admin/discord-webhook',{method:'POST',body:JSON.stringify({webhookUrl:url,message:text})});message($('#discordMessageStatus'),'Сообщение отправлено в Discord.');toast('Сообщение отправлено в Discord 🐾');$('#cfgWebhookMessage').value='';}catch(err){message($('#discordMessageStatus'),err.message||'Не удалось отправить сообщение.',true);}finally{button.disabled=false;button.textContent='Отправить в Discord ↗';}});
  $('#resetSite').addEventListener('click',()=>{try{localStorage.removeItem(STORAGE_KEY);}catch{}applySettings(DEFAULTS);message($('#siteMessage'),'Локальные настройки сброшены.');});
  $('#checkShield').addEventListener('click',async()=>{const status=$('#shieldStatus');status.textContent='Проверяю сервер…';try{const data=await api('/api/health',{method:'GET',headers:{}});status.textContent=data.rateLimit==='distributed'?'Серверная защита активна · распределённый лимит запросов':'Серверный вход активен · лимит запросов базовый';toast('Проверка завершена.');}catch{status.textContent='Серверная функция недоступна — проверь публикацию проекта.';toast('Не удалось связаться с серверной защитой.');}});
  (async()=>{try{const data=await api('/api/health',{method:'GET',headers:{}});$('#shieldStatus').textContent=data.rateLimit==='distributed'?'Серверная защита активна · распределённый лимит запросов':'Серверный вход активен · лимит запросов базовый';}catch{$('#shieldStatus').textContent='Серверная функция не отвечает — проверь публикацию.';}})();
  $('#musicToggle').addEventListener('click',async()=>{const audio=$('#siteAudio');if(!audio.src){toast('Добавь MP3-ссылку в настройках сайта.');return;}if(audio.paused){try{await audio.play();$('#musicToggle').classList.add('playing');toast('Музыка включена 🎵');}catch{toast('Браузер не разрешил воспроизведение. Нажми ещё раз.');}}else{audio.pause();$('#musicToggle').classList.remove('playing');toast('Музыка выключена');}});
  async function loadDiscordInviteMeta(){const fallbackDate=discordCreatedAt('1431670233474662601');if(fallbackDate)renderAge(fallbackDate);const invite=($('#cfgInvite')?.value||INVITE_DEFAULT);const match=invite.match(/discord\.gg\/([\w-]+)/i)||invite.match(/discord\.com\/invite\/([\w-]+)/i);if(!match)return;try{const res=await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(match[1])}?with_counts=true`,{cache:'no-store'});if(!res.ok)return;const data=await res.json();if(data.guild?.icon){const img=$('#serverAvatar');img.src=`https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=128`;img.classList.add('visible');$('#brandIcon').style.display='none';}if(Number.isFinite(data.approximate_presence_count))$('#onlineCount').textContent=`${data.approximate_presence_count} онлайн`;if(data.guild?.id){const date=discordCreatedAt(data.guild.id);if(date){renderAge(date);clearInterval(serverAgeTimer);serverAgeTimer=setInterval(()=>renderAge(date),3600000);}}}catch{const id='1431670233474662601';const date=discordCreatedAt(id);if(date)renderAge(date);}}

  // Lightweight global navigation polish: reading progress and a keyboard-friendly return button.
  const progress=document.createElement('div');
  progress.className='scroll-progress';
  progress.setAttribute('aria-hidden','true');
  const progressFill=document.createElement('span');
  progress.append(progressFill);
  document.body.append(progress);
  const backTop=document.createElement('button');
  backTop.className='back-to-top';
  backTop.type='button';
  backTop.setAttribute('aria-label','Вернуться в начало страницы');
  backTop.title='Наверх';
  backTop.textContent='↑';
  document.body.append(backTop);
  let scrollFrame=0;
  const updateScrollUI=()=>{
    scrollFrame=0;
    const root=document.documentElement;
    const max=Math.max(1,root.scrollHeight-window.innerHeight);
    root.style.setProperty('--scroll-progress',String(Math.min(1,Math.max(0,window.scrollY/max))));
    backTop.classList.toggle('visible',window.scrollY>520);
  };
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollUI);},{passive:true});
  window.addEventListener('resize',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScrollUI);},{passive:true});
  backTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
  updateScrollUI();

  // Subtle card tilt is limited to mouse-like pointers and respects reduced-motion preferences.
  if(!reduce&&window.matchMedia?.('(pointer: fine)').matches){
    $('.glass').forEach(card=>{
      card.addEventListener('pointermove',event=>{
        const rect=card.getBoundingClientRect();
        const x=(event.clientX-rect.left)/Math.max(1,rect.width);
        const y=(event.clientY-rect.top)/Math.max(1,rect.height);
        card.style.transform=`perspective(900px) rotateX(${((.5-y)*2.2).toFixed(2)}deg) rotateY(${((x-.5)*2.8).toFixed(2)}deg) translateY(-2px)`;
      },{passive:true});
      card.addEventListener('pointerleave',()=>{card.style.transform='';},{passive:true});
      card.addEventListener('blur',()=>{card.style.transform='';},true);
    });
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateScrollUI();});

  loadDiscordInviteMeta();
})();
