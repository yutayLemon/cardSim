document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.dataset.target;
    const content = document.getElementById(targetId);
    const isVisible = content.style.display === 'block';

    content.style.display = isVisible ? 'none' : 'block';
    btn.textContent = isVisible ? '▶ ' + btn.textContent.slice(2) : '▼ ' + btn.textContent.slice(2);
  });
});

function updateInspector(obj) {
  document.getElementById('selected-name').textContent = obj.name || 'Unnamed';
  document.getElementById('selected-type').textContent = obj.type || 'Unknown';
  document.getElementById('pos').textContent = obj.position.toArray().map(n => n.toFixed(2)).join(', ');
  document.getElementById('vel').textContent = obj.velocity.toArray().map(n => n.toFixed(2)).join(', ');
  document.getElementById('rot').textContent = obj.rotation.toArray().map(n => n.toFixed(2)).join(', ');
}