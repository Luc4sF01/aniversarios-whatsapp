require("dotenv").config();
const { google } = require("googleapis");
const dayjs = require("dayjs");
const nodemailer = require("nodemailer");

// === CONFIGURAÇÕES ===
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
let credentials;

// === LÊ AS CREDENCIAIS DIRETO DO ENV (como string JSON)
try {
  credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
} catch (err) {
  console.error("❌ Erro ao ler GOOGLE_CREDENTIALS. Verifique se está como JSON válido.");
  process.exit(1);
}

const DESTINATARIO = process.env.DESTINATARIO;

// === CONFIGURAR TRANSPORTE DE E-MAIL ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// === AUTORIZAR GOOGLE SHEETS ===
async function autorizarGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return await auth.getClient();
}

// === BUSCAR ANIVERSARIANTES DE HOJE ===
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

// === ENVIAR E-MAIL COM ANIVERSARIANTES ===
async function enviarEmail(aniversariantes) {
  const lista = aniversariantes
    .map(([nome, numero, data]) => {
      return `🎉 ${nome} — ${dayjs(data).format("DD/MM/YYYY")}`;
    })
    .join("\n");

  const mailOptions = {
    from: `"Lembretes Aniversário" <${process.env.EMAIL_USER}>`,
    to: DESTINATARIO,
    subject: "🎂 Aniversariantes do dia!",
    text: `Olá! Seguem os aniversariantes de hoje:\n\n${lista}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("📧 E-mail enviado com sucesso!");
  } catch (erro) {
    console.error("❌ Erro ao enviar e-mail:", erro.message);
  }
}

// === INICIAR O PROCESSO ===
async function iniciar() {
  try {
    const auth = await autorizarGoogleSheets();
    const aniversariantes = await buscarAniversariantesHoje(auth);

    if (aniversariantes.length === 0) {
      console.log("📭 Nenhum aniversariante hoje.");
      return;
    }

    await enviarEmail(aniversariantes);
  } catch (erro) {
    console.error("❌ Erro geral:", erro.message);
  }
}

iniciar();
