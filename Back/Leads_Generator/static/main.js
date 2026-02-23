/* ═══════════════════════════════════════════════════
   PROSPECTION AGENT — Frontend Logic
   ═══════════════════════════════════════════════════ */

let currentJobId  = null;
let allLeads      = [];
let currentFilter = 'ALL';
let pollInterval  = null;


// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  checkApiKey();
  document.getElementById('runBtn').addEventListener('click', startJob);
  document.getElementById('searchFilter').addEventListener('input', () => filterLeads(currentFilter, null));
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => filterLeads(btn.dataset.filter, btn));
  });
});


// ── API Key check ──────────────────────────────────────────────────────────

function checkApiKey() {
  fetch('/api/check_key')
    .then(r => r.json())
    .then(d => {
      const badge = document.getElementById('apiBadge');
      if (d.has_key) {
        badge.textContent  = '✓ API KEY ACTIVE';
        badge.className    = 'api-badge ok';
      }
    });
}


// ── Start job ──────────────────────────────────────────────────────────────

function startJob() {
  const city       = document.getElementById('city').value.trim();
  const category   = document.getElementById('category').value.trim();
  const maxResults = document.getElementById('maxResults').value;

  if (!city || !category) {
    showError('Please enter both a city and a business category.');
    return;
  }

  // Reset UI
  hideEl('errorBox');
  showEl('progressSection');
  document.getElementById('downloadBar').className = 'download-bar';
  document.getElementById('logBox').innerHTML      = '';
  document.getElementById('progressFill').style.width = '0%';
  hideEl('emptyState');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('runBtn').disabled = true;

  fetch('/api/start', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ city, category, max_results: maxResults }),
  })
    .then(r => r.json())
    .then(d => {
      if (d.error) { showError(d.error); return; }
      currentJobId = d.job_id;
      pollInterval = setInterval(pollStatus, 1500);
    })
    .catch(e => showError(e.message));
}


// ── Polling ────────────────────────────────────────────────────────────────

function pollStatus() {
  if (!currentJobId) return;

  fetch(`/api/status/${currentJobId}`)
    .then(r => r.json())
    .then(d => {
      updateProgress(d.progress);
      updateLog(d.log);

      if (d.status === 'done') {
        clearInterval(pollInterval);
        allLeads = d.leads;
        renderStats(allLeads);
        renderLeads(allLeads);
        document.getElementById('resultsSection').classList.remove('hidden');
        document.getElementById('runBtn').disabled = false;
        if (d.csv_name) showDownload(d.csv_name);
      }

      if (d.status === 'error') {
        clearInterval(pollInterval);
        showError(d.error);
        document.getElementById('runBtn').disabled = false;
      }
    });
}


// ── Render helpers ─────────────────────────────────────────────────────────

function updateProgress(pct) {
  document.getElementById('progressFill').style.width = pct + '%';
}

function updateLog(lines) {
  const box = document.getElementById('logBox');
  box.innerHTML = lines.map(l => {
    const cls = l.toLowerCase().includes('done') || l.toLowerCase().includes('found') ? 'ok'
              : l.toLowerCase().includes('error') ? 'error' : '';
    return `<div class="log-line ${cls}">${escapeHtml(l)}</div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
}

function renderStats(leads) {
  document.getElementById('statTotal').textContent = leads.length;
  document.getElementById('statHot').textContent   = leads.filter(l => l.temperature === 'HOT').length;
  document.getElementById('statWarm').textContent  = leads.filter(l => l.temperature === 'WARM').length;
  document.getElementById('statCold').textContent  = leads.filter(l => l.temperature === 'COLD').length;
}

function filterLeads(filter, btn) {
  currentFilter = filter;
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const search   = document.getElementById('searchFilter').value.toLowerCase();
  let filtered   = allLeads;
  if (filter !== 'ALL') filtered = filtered.filter(l => l.temperature === filter);
  if (search)           filtered = filtered.filter(l => l.name.toLowerCase().includes(search));
  renderLeads(filtered);
}

function renderLeads(leads) {
  const tbody = document.getElementById('leadsTable');

  if (!leads.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:40px;">No leads match this filter.</td></tr>`;
    return;
  }

  const scoreColor = t => t === 'HOT' ? 'var(--hot)' : t === 'WARM' ? 'var(--warm)' : 'var(--cold)';

  tbody.innerHTML = leads.map(l => {
    const website = l.website
      ? `<a href="${escapeHtml(l.website)}" target="_blank" rel="noopener">${escapeHtml(l.website.replace(/^https?:\/\/(www\.)?/, '').slice(0, 26))}</a>`
      : `<span class="no-website">—</span>`;

    return `<tr>
      <td class="col-rank">${l.rank}</td>
      <td class="col-name">
        <a href="${escapeHtml(l.google_maps_url)}" target="_blank" rel="noopener">${escapeHtml(l.name)}</a>
        <div class="address">${escapeHtml(l.address || '')}</div>
      </td>
      <td class="col-score" style="color:${scoreColor(l.temperature)}">${l.score}</td>
      <td><span class="badge ${l.temperature}">${l.temperature}</span></td>
      <td class="col-rating">${l.rating ? '★ ' + l.rating : '—'}</td>
      <td class="col-reviews">${l.reviews || '—'}</td>
      <td class="col-phone">${escapeHtml(l.phone || '—')}</td>
      <td class="col-website">${website}</td>
    </tr>`;
  }).join('');
}

function showDownload(csvName) {
  document.getElementById('csvName').textContent  = csvName;
  document.getElementById('downloadBtn').href     = `/api/download/${currentJobId}`;
  document.getElementById('downloadBar').className = 'download-bar show';
}


// ── Error ──────────────────────────────────────────────────────────────────

function showError(msg) {
  const box = document.getElementById('errorBox');
  box.innerHTML  = `❌ ${escapeHtml(msg)}<br><br>Make sure your <code>.env</code> file contains:<br><code>GOOGLE_API_KEY=your_key_here</code>`;
  box.style.display = 'block';
  hideEl('progressSection');
  document.getElementById('runBtn').disabled = false;
}


// ── Utilities ──────────────────────────────────────────────────────────────

function showEl(id) { document.getElementById(id).style.display = 'block'; }
function hideEl(id) { document.getElementById(id).style.display = 'none';  }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}
