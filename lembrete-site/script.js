const form = document.getElementById('formulario');
const resposta = document.getElementById('resposta');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const scriptURL = 'https://script.google.com/macros/s/AKfycbxsCNgKKxgSS2au2G5o8tcym72D5VeigDgMaVtu-Qb5f4bzj3SYTjzyGTEd9QXE5P8/exec';

  fetch(scriptURL, { method: 'POST', body: data })
    .then(() => {
      resposta.textContent = 'Cadastro enviado com sucesso!';
      form.reset();
    })
    .catch(() => {
      resposta.textContent = 'Erro ao enviar, tente novamente.';
    });
});
