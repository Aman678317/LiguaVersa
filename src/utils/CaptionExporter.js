export const exportCaptions = (captions, format, language) => {
  if (!captions || captions.length === 0) {
    alert("No captions to export!");
    return;
  }

  let content = '';
  let mimeType = 'text/plain';
  let extension = format.toLowerCase();

  switch (format) {
    case 'JSON':
      content = JSON.stringify(captions, null, 2);
      mimeType = 'application/json';
      break;

    case 'TXT':
      content = captions.map(c => `[${c.timestamp}] ${c.sender}: ${c.text}`).join('\n');
      mimeType = 'text/plain';
      break;

    case 'SRT':
      content = captions.map((c, i) => {
        return `${i + 1}\n00:00:00,000 --> 00:00:05,000\n${c.sender}: ${c.text}\n`; // basic mock timestamps
      }).join('\n');
      mimeType = 'text/srt';
      break;

    case 'VTT':
      content = `WEBVTT\n\n` + captions.map((c, i) => {
        return `${i + 1}\n00:00:00.000 --> 00:00:05.000\n${c.sender}: ${c.text}\n`; // basic mock timestamps
      }).join('\n');
      mimeType = 'text/vtt';
      break;
      
    case 'DOCX':
    case 'PDF':
      // Basic fallback since external libraries are heavy. 
      // In production, use jspdf or docx.js
      content = captions.map(c => `[${c.timestamp}] ${c.sender}: ${c.text}`).join('\n');
      mimeType = 'text/plain';
      break;

    default:
      content = captions.map(c => `${c.sender}: ${c.text}`).join('\n');
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting_captions_${language}_${new Date().getTime()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
