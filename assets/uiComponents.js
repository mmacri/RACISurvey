export function renderTable(target, rows, headers) {
  if (!target) return;
  target.innerHTML = '';
  const headerRow = document.createElement('div');
  headerRow.className = 'row header';
  headers.forEach(h => {
    const cell = document.createElement('div');
    cell.textContent = h;
    headerRow.appendChild(cell);
  });
  target.appendChild(headerRow);
  rows.forEach(r => target.appendChild(r));
}

export function pill(label, active) {
  const el = document.createElement('div');
  el.className = `pill ${active ? 'active' : ''}`;
  el.textContent = label;
  return el;
}

export function showModal(title, body) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<h3>${title}</h3>`;
  if (typeof body === 'string') {
    const div = document.createElement('div');
    div.innerHTML = body;
    modal.appendChild(div);
  } else {
    modal.appendChild(body);
  }
  const close = document.createElement('button');
  close.className = 'secondary';
  close.textContent = 'Close';
  close.onclick = () => backdrop.remove();
  modal.appendChild(close);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  return backdrop;
}

export function toast(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  div.className = 'badge ok';
  div.style.position = 'fixed';
  div.style.bottom = '16px';
  div.style.right = '16px';
  div.style.zIndex = '20';
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2200);
}
