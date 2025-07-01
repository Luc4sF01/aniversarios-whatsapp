// index.js
require("dotenv").config();
const { google } = require("googleapis");
const dayjs = require("dayjs");
const twilio = require("twilio");
const path = require("path");

// IDs e Credenciais
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const credentials = require(path.resolve(process.env.GOOGLE_CREDENTIALS_PATH));

// Twilio
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const CLIENTE_NUMBER = "whatsapp:+553499220591"; // Número da sua cliente

async function autorizarGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return await auth.getClient();
}

async function buscarAniversariantesHoje(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Página1!A2:C", // Nome | Número | Data
  });

  const hoje = dayjs().format("YYYY-MM-DD");
  const dados = response.data.values || [];

  return dados.filter((linha) => {
    const data = dayjs(linha[2]).format("YYYY-MM-DD");
    return data === hoje;
  });
}

async function enviarResumoParaCliente(aniversariantes) {
  let mensagem = `🎉 *Aniversariantes de hoje:*\n\n`;

  aniversariantes.forEach(([nome, numero, data]) => {
    mensagem += `• ${nome} – ${numero}\n`;
  });

  mensagem += `\n🗓️ ${dayjs().format("DD/MM/YYYY")}`;

  try {
    await client.messages.create({
      from: TWILIO_NUMBER,
      to: CLIENTE_NUMBER,
      body: mensagem,
    });
    console.log("✅ Mensagem enviada para a cliente.");
  } catch (erro) {
    console.error("❌ Erro ao enviar para a cliente:", erro.message);
  }
}

async function iniciar() {
  try {
    const auth = await autorizarGoogleSheets();
    const aniversariantes = await buscarAniversariantesHoje(auth);

    if (aniversariantes.length === 0) {
      console.log("📭 Nenhum aniversariante hoje.");
      return;
    }

    await enviarResumoParaCliente(aniversariantes);
  } catch (erro) {
    console.error("❌ Erro geral:", erro.message);
  }
}

iniciar();
