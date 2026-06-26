// Contato do cliente com a WaveOps: somente WhatsApp (o lead/cliente nao abre
// chamado no portal). Numero unico, igual ao da landing (wa.me/5534991775784).
export const WHATSAPP_NUMBER = "5534991775784";

// Monta o link wa.me com mensagem pre-preenchida (codifica acentos corretamente).
export function whatsappUrl(text: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
