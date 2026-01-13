// src/lib/services/channelTranscriptService/aiChannelSummary.js
import { summarizeTranscript } from "../summarizeTranscript.js";

export async function analyzeChannelByTranscripts(videoResults) {
  // Gelen verinin dizi olduğundan emin ol (Filtre hatasını önler)
  if (!Array.isArray(videoResults) || videoResults.length === 0) {
    return "Analiz edilecek video verisi bulunamadı.";
  }

  // Transkripti olanları birleştir
  const validTranscripts = videoResults
    .filter(v => v && v.transcript && !v.transcript.includes('TRANSCRIPT_NOT_AVAILABLE'))
    .map(v => `Başlık: ${v.title}\nİçerik: ${(v.transcript || "").substring(0, 2000)}`)
    .join("\n\n---\n\n");

  if (!validTranscripts) {
    return "Bu kanalın son videoları için transkript verisine ulaşılamadı, bu yüzden detaylı analiz yapılamıyor.";
  }

  const customInstruction = `
    Aşağıda bir kanalın son videolarına ait transkript parçaları var. 
    Bu içeriklere dayanarak kanalın uzmanlık alanını, yayın dilini ve izleyiciye sunduğu temel değeri 3 paragrafta özetle.
  `;

  return await summarizeTranscript(validTranscripts, "channel_summary", customInstruction);
}