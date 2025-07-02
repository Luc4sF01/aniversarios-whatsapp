// index.js
require("dotenv").config();
const { google } = require("googleapis");
const dayjs = require("dayjs");
const twilio = require("twilio");

// IDs e Credenciais
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const credentials = require(process.env.GOOGLE_CREDENTIALS_PATH); // ✅ Correto

// Twilio
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

async function autorizarGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials, // ✅ Agora está certo
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

async function enviarWhatsApp(nome, numero, data) {
  try {
    await client.messages.create({
      from: TWILIO_NUMBER,
      to: `whatsapp:+55${numero}`,
      body: `🎉 Hoje é aniversário de ${nome}! 🎂\n📅 Data: ${dayjs(data).format("DD/MM/YYYY")}\n\nNão esqueça de mandar os parabéns!`,
    });
    console.log(`✅ Mensagem enviada para ${nome}`);
  } catch (erro) {
    console.error(`❌ Erro ao enviar para ${nome}:`, erro.message);
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

    for (const [nome, numero, data] of aniversariantes) {
      await enviarWhatsApp(nome, numero, data);
    }
  } catch (erro) {
    console.error("❌ Erro geral:", erro.message);
  }
}

iniciar();