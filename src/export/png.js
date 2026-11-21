import { visualPaths } from '../cooking-visuals.js';
import { localizeRecipeCard } from '../i18n/recipe-card.js';
// The renderer consumes a complete snapshot; it never reads catalogue data or application state.
export async function renderRecipePng(input) {
  const card = input.labels ? input : localizeRecipeCard(input);
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('500 30px "Golos Text"'),
      document.fonts.load('400 54px "Literata"'),
    ]);
    await document.fonts.ready;
  }
  const width = 1080,
    pad = 64,
    contentWidth = width - 2 * pad;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен');
  // The light values of the site's colour tokens (src/tokens.css): a card is always printed light.
  const colors = {
    paper: '#f7f5ef',
    ink: '#10232b',
    muted: '#4d5a61',
    copper: '#a3633b',
    line: '#e3ddd0',
    leader: '#b9b1a0',
  };
  const commands = [];
  let y = 64;
  const wrap = (value, font, maxWidth = contentWidth) => {
    ctx.font = font;
    const lines = [];
    for (const paragraph of String(value).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (ctx.measureText((line ? line + ' ' : '') + word).width <= maxWidth) {
          line += (line ? ' ' : '') + word;
          continue;
        }
        if (line) {
          lines.push(line);
          line = '';
        }
        if (ctx.measureText(word).width <= maxWidth) {
          line = word;
          continue;
        }
        for (const char of word) {
          if (ctx.measureText(line + char).width > maxWidth) {
            lines.push(line);
            line = char;
          } else line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const text = (
    value,
    {
      font = '400 29px "Golos Text", sans-serif',
      color = colors.ink,
      line = 43,
      x = pad,
      maxWidth = contentWidth,
      gap = 0,
    } = {},
  ) => {
    for (const row of wrap(value, font, maxWidth)) {
      commands.push({ type: 'text', value: row, x, y, font, color });
      y += line;
    }
    y += gap;
  };
  const rule = () => {
    commands.push({ type: 'line', y: y + 8 });
    y += 36;
  };
  const heading = (value) => {
    y += 16;
    text(value, {
      font: '500 27px "Golos Text", sans-serif',
      color: colors.copper,
      line: 40,
      gap: 12,
    });
  };
  text(card.labels.brand, {
    font: '500 22px "Golos Text", sans-serif',
    color: colors.copper,
    line: 34,
    gap: 22,
  });
  text(card.title, { font: '400 54px "Literata", serif', line: 72, gap: 20 });
  text(card.labels.summary, { font: '500 25px "Golos Text", sans-serif', line: 38 });
  if (card.labels.burner)
    text(card.labels.burner, {
      font: '400 24px "Golos Text", sans-serif',
      color: colors.muted,
      line: 36,
    });
  text(card.labels.sea, {
    font: '400 24px "Golos Text", sans-serif',
    color: colors.muted,
    line: 36,
  });
  if (card.labels.crew)
    text(card.labels.crew, {
      font: '500 25px "Golos Text", sans-serif',
      color: colors.copper,
      line: 38,
    });
  if (card.variants.length)
    text(card.labels.selected, {
      font: '400 24px "Golos Text", sans-serif',
      color: colors.muted,
      line: 36,
      gap: 5,
    });
  rule();
  heading(card.labels.utensils);
  text(card.utensils.join(' · '), { color: colors.muted, line: 42 });
  heading(card.labels.ingredients);
  // An ingredient reads like the recipe page: the name, a dotted leader and the amount flush
  // right on the name's last line. An amount too wide for that keeps the «name — amount» line.
  const entry = (name, amount) => {
    const font = '500 29px "Golos Text", sans-serif',
      line = 43;
    ctx.font = font;
    const amountWidth = ctx.measureText(amount).width;
    if (amountWidth > contentWidth * 0.45) return text(name + ' — ' + amount, { font, line });
    const amountX = width - pad - amountWidth;
    const rows = wrap(name, font, amountX - pad - 40);
    rows.forEach((row, index) => {
      commands.push({ type: 'text', value: row, x: pad, y, font, color: colors.ink });
      if (index === rows.length - 1) {
        const from = pad + ctx.measureText(row).width + 14;
        commands.push({ type: 'leader', from, to: amountX - 14, y: y + 24 });
        commands.push({ type: 'text', value: amount, x: amountX, y, font, color: colors.ink });
      }
      y += line;
    });
  };
  for (const item of card.ingredients) {
    entry(item.name, item.amount);
    if (item.measure)
      text(item.measure, {
        font: '400 24px "Golos Text", sans-serif',
        color: colors.muted,
        line: 36,
      });
    if (item.package)
      text(item.package, {
        font: '400 24px "Golos Text", sans-serif',
        color: colors.copper,
        line: 36,
      });
    if (item.note)
      text(item.note, { font: '400 23px "Golos Text", sans-serif', color: colors.muted, line: 34 });
    y += 12;
  }
  if (card.measureNote)
    text(card.measureNote, {
      font: '400 22px "Golos Text", sans-serif',
      color: colors.muted,
      line: 33,
      gap: 10,
    });
  if (card.water) text(card.labels.water, { font: '500 29px "Golos Text", sans-serif', line: 44 });
  if (card.prepWater)
    text(card.labels.prepWater, {
      font: '500 29px "Golos Text", sans-serif',
      color: colors.copper,
      line: 44,
    });
  rule();
  if (card.basics.length) {
    heading(card.labels.basics);
    for (const tip of card.basics) text(tip, { color: colors.muted, gap: 18 });
  }
  heading(card.labels.steps);
  card.steps.forEach((step, index) => {
    const action = card.actions[index];
    commands.push({ type: 'icon', path: visualPaths[action.icon], x: pad, y, size: 32 });
    text(String(index + 1).padStart(2, '0') + ' / ' + action.label, {
      x: pad + 48,
      maxWidth: contentWidth - 48,
      font: '500 26px "Golos Text", sans-serif',
      color: colors.copper,
      line: 38,
    });
    text(step, { gap: 24 });
  });
  if (card.notes.length) {
    rule();
    heading(card.labels.notes);
    for (const note of card.notes)
      text(note, {
        font: '400 24px "Golos Text", sans-serif',
        color: colors.muted,
        line: 36,
        gap: 16,
      });
  }
  rule();
  text(card.footer, { font: '400 22px "Golos Text", sans-serif', color: colors.muted, line: 33 });
  canvas.width = width;
  canvas.height = Math.ceil(y + pad);
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.ink;
  ctx.fillRect(0, 0, 12, canvas.height);
  for (const command of commands) {
    if (command.type === 'text') {
      ctx.font = command.font;
      ctx.fillStyle = command.color;
      ctx.fillText(command.value, command.x, command.y);
    } else if (command.type === 'icon') {
      ctx.save();
      ctx.translate(command.x, command.y);
      ctx.scale(command.size / 24, command.size / 24);
      ctx.strokeStyle = colors.copper;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(new Path2D(command.path));
      ctx.restore();
    } else if (command.type === 'leader') {
      if (command.to <= command.from) continue;
      ctx.save();
      ctx.strokeStyle = colors.leader;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([0, 9]);
      ctx.beginPath();
      ctx.moveTo(command.from, command.y);
      ctx.lineTo(command.to, command.y);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pad, command.y);
      ctx.lineTo(width - pad, command.y);
      ctx.stroke();
    }
  }
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('Не удалось создать PNG'))),
      'image/png',
    ),
  );
  return {
    blob,
    width,
    height: canvas.height,
    filename:
      'deelkombuese-' +
      card.title
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .slice(0, 90) +
      '.png',
  };
}

export async function downloadRecipePng(card) {
  const result = await renderRecipePng(card);
  const url = URL.createObjectURL(result.blob),
    link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return result;
}
