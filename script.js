async function loadLevels() {
  try {
    const response = await fetch("levels.json");
    if (!response.ok) throw new Error("Could not load levels.json");
    return await response.json();
  } catch (err) {
    console.error(err);
    document.getElementById("levels-container").innerHTML =
      '<p class="error">Failed to load levels.json. Make sure the file is in the same folder.</p>';
    return [];
  }
}

function calculateStats(levels) {
  const totalLevels = levels.length;

  const enjoymentValues = levels.map(l => l.enjoyment).filter(v => typeof v === "number");
  const avgEnjoyment = enjoymentValues.length
    ? (enjoymentValues.reduce((a, b) => a + b, 0) / enjoymentValues.length).toFixed(1)
    : "—";

  const worstFailValues = levels
    .map(l => {
      if (typeof l.worstFail === "number") return l.worstFail;
      if (typeof l.worstFail === "string") {
        const num = parseFloat(l.worstFail);
        return isNaN(num) ? null : num;
      }
      return null;
    })
    .filter(v => v !== null);

  const avgWorstFail = worstFailValues.length
    ? (worstFailValues.reduce((a, b) => a + b, 0) / worstFailValues.length).toFixed(1) + "%"
    : "—";

  document.getElementById("total-levels").textContent = totalLevels;
  document.getElementById("avg-enjoyment").textContent = avgEnjoyment;
  document.getElementById("avg-worst-fail").textContent = avgWorstFail;
}

async function fetchAredlPosition(levelId) {
  if (!levelId) return null;
  try {
    const res = await fetch(`https://api.aredl.net/v2/api/aredl/levels/${levelId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.position ?? null;
  } catch {
    return null;
  }
}

function renderLevels(levels) {
  const container = document.getElementById("levels-container");
  if (levels.length === 0) {
    container.innerHTML = '<p class="error">No levels found. Add some to levels.json.</p>';
    return;
  }

  container.innerHTML = levels
    .map((level, index) => {
      const rank = index + 1;
      let rankClass = "";
      if (rank === 1) rankClass = " rank1";
      else if (rank === 2) rankClass = " rank2";
      else if (rank === 3) rankClass = " rank3";

      return `
        <a class="level-card${rankClass}" data-level-id="${level.levelId || ""}"
           ${level.videoUrl ? `href="${escapeHtml(level.videoUrl)}" target="_blank" rel="noopener"` : ""}>
          <div class="rank">#${rank}</div>
          <div class="level-info">
            <h3>${escapeHtml(level.name)}</h3>
            <div class="meta">
              by ${escapeHtml(level.creator || "Unknown")}
              ${level.attempts ? ` • ${level.attempts.toLocaleString()} attempts` : ""}
              ${typeof level.enjoyment === "number" ? ` • Enjoyment: ${level.enjoyment}/10` : ""}
              ${level.worstFail ? ` • Worst Fail: ${escapeHtml(String(level.worstFail))}` : ""}
            </div>
            ${level.notes ? `<div class="notes">${escapeHtml(level.notes)}</div>` : ""}
          </div>
          <div class="aredl-position">
            <span class="label">Current Placement (AREDL)</span>
            <span class="pos" id="aredl-${level.levelId || index}">…</span>
            ${level.dateBeaten ? `<span class="date-beaten">Beaten: ${escapeHtml(level.dateBeaten)}</span>` : ""}
          </div>
        </a>
      `;
    })
    .join("");

  levels.forEach((level) => {
    if (!level.levelId) return;
    const card = document.querySelector(`.level-card[data-level-id="${level.levelId}"]`);
    if (card) {
      const thumbUrl = `https://raw.githubusercontent.com/All-Rated-Extreme-Demon-List/Thumbnails/main/levels/full/${level.levelId}.webp`;
      card.style.backgroundImage = `url('${thumbUrl}')`;
    }
  });

  levels.forEach(async (level, index) => {
    const el = document.getElementById(`aredl-${level.levelId || index}`);
    if (!el) return;
    const pos = await fetchAredlPosition(level.levelId);
    el.textContent = pos ? `#${pos}` : "N/A";
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function init() {
  const levels = await loadLevels();
  calculateStats(levels);
  renderLevels(levels);
}

init();