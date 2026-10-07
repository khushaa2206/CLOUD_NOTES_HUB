const $ = id => document.getElementById(id);
const MAX = 10 * 1024 * 1024;
let me = null, subject = SUBJECTS[0], notes = [], unsub = null;

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
const say = (t, err) => { $('msg').className = 'msg ' + (err ? 'err' : 'ok'); $('msg').textContent = t; };

// Auth guard: only logged-in students can see the dashboard
auth.onAuthStateChanged(u => {
  if (!u) { location.href = 'index.html'; return; }
  me = u; $('who').textContent = u.displayName || u.email;
  buildSubjects(); load();
});
$('logout').onclick = () => auth.signOut();

function buildSubjects() {
  const box = $('subjects'); box.innerHTML = '';
  SUBJECTS.forEach(s => {
    const b = document.createElement('button');
    b.textContent = s; b.className = s === subject ? 'on' : '';
    b.onclick = () => { subject = s; $('q').value = ''; buildSubjects(); load(); };
    box.appendChild(b);
  });
  $('subjTitle').textContent = subject;
}

// View notes: live listener on Firestore for the selected subject
function load() {
  if (unsub) unsub();
  $('list').innerHTML = '<p class="empty">Loading notes…</p>';
  unsub = db.collection('notes').where('subject', '==', subject).onSnapshot(snap => {
    notes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    render();
  }, e => { $('list').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; });
}

// Search: filters the loaded notes in the browser
function render() {
  const q = $('q').value.trim().toLowerCase();
  const shown = notes.filter(n => !q || (n.title + ' ' + n.fileName + ' ' + n.uploader).toLowerCase().includes(q));
  if (!shown.length) {
    $('list').innerHTML = '<p class="empty">' + (q ? 'No notes match your search.' : 'No notes in ' + esc(subject) + ' yet. Upload the first one above.') + '</p>';
    return;
  }
  $('list').innerHTML = shown.map(n => `<div class="note"><div><b>${esc(n.title)}</b>
    <small>${esc(n.fileName)} · ${size(n.size)} · by ${esc(n.uploader)}</small></div>
    <div class="acts"><button class="btn" data-a="dl" data-id="${n.id}">Download</button>
    ${n.uid === me.uid ? `<button class="btn danger" data-a="del" data-id="${n.id}">Delete</button>` : ''}</div></div>`).join('');
}
$('q').oninput = render;

$('list').onclick = async e => {
  const b = e.target.closest('button'); if (!b) return;
  const n = notes.find(x => x.id === b.dataset.id); if (!n) return;
  if (b.dataset.a === 'dl') return download(n);
  if (b.dataset.a === 'del' && confirm('Delete "' + n.title + '"?')) {
    try {
      if (n.path) await storage.ref(n.path).delete().catch(() => {});
      if (n.fileId) {
        const parts = await db.collection('noteFiles').where('fileId', '==', n.fileId).get();
        await Promise.all(parts.docs.map(d => d.ref.delete()));
      }
      await db.collection('notes').doc(n.id).delete();
    } catch (err) { alert(err.message); }
  }
};

async function download(n) {
  const a = document.createElement('a');
  if (n.url) { a.href = n.url; a.target = '_blank'; a.rel = 'noopener'; }
  else {
    const snap = await db.collection('noteFiles').where('fileId', '==', n.fileId).get();
    const dataUrl = snap.docs.map(d => d.data()).sort((x, y) => x.idx - y.idx).map(p => p.data).join('');
    a.href = URL.createObjectURL(await (await fetch(dataUrl)).blob()); a.download = n.fileName;
  }
  document.body.appendChild(a); a.click(); a.remove();
}

const toDataURL = f => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f);
});

// Upload notes
$('upForm').onsubmit = async e => {
  e.preventDefault();
  const f = $('file').files[0]; if (!f) return;
  if (f.size > MAX) return say('File is larger than 10 MB.', true);
  $('up').disabled = true; say('');
  try {
    const meta = {
      title: $('title').value.trim() || f.name, subject, fileName: f.name, size: f.size,
      uid: me.uid, uploader: me.displayName || me.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (USE_STORAGE) {
      const path = `notes/${subject}/${me.uid}_${Date.now()}_${f.name}`;
      const task = storage.ref(path).put(f);
      $('bar').hidden = false;
      task.on('state_changed', s => { $('bar').value = 100 * s.bytesTransferred / s.totalBytes; });
      await task;
      meta.url = await task.snapshot.ref.getDownloadURL(); meta.path = path;
    } else {
      if (f.size > 5 * 1024 * 1024) throw new Error('Free mode supports files up to 5 MB. Enable Storage for larger files.');
      const data = await toDataURL(f), CHUNK = 700 * 1024;
      const fileId = db.collection('noteFiles').doc().id, parts = Math.ceil(data.length / CHUNK);
      $('bar').hidden = false;
      for (let i = 0; i < parts; i++) {
        await db.collection('noteFiles').add({ fileId, idx: i, data: data.slice(i * CHUNK, (i + 1) * CHUNK), uid: me.uid });
        $('bar').value = 100 * (i + 1) / parts;
      }
      meta.fileId = fileId;
    }
    await db.collection('notes').add(meta);
    $('upForm').reset(); say('Note uploaded.');
  } catch (err) { say(err.message, true); }
  $('up').disabled = false; $('bar').hidden = true; $('bar').value = 0;
};
