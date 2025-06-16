let pdfDoc; // variável global para armazenar o PDF

// Formata data ISO para dd/mm/aaaa
function formatarData(dataISO) {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Formata valor em reais
function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(valor);
}

// Obtém os dados do formulário
function obterDadosMudanca() {
  const nome = document.getElementById("nomeCliente").value.trim();
  const data = document.getElementById("dataMudanca").value;
  const origem = document.getElementById("bairroOrigem").value.trim();
  const destino = document.getElementById("bairroDestino").value.trim();
  const orcamento = document.getElementById("orcamento").value;

  const checkboxes = document.querySelectorAll('input[name="item"]:checked');
  let itensSelecionados = [];
  let volumeTotal = 0;

  checkboxes.forEach(item => {
    itensSelecionados.push(item.value);
    volumeTotal += parseFloat(item.getAttribute("data-volume"));
  });

  return { nome, data, origem, destino, orcamento, itensSelecionados, volumeTotal };
}

// Valida se todos os campos estão preenchidos corretamente
function validarDados(dados) {
  const { nome, data, origem, destino, orcamento, itensSelecionados } = dados;
  if (!nome) {
    alert("Por favor, preencha o nome.");
    document.getElementById("nomeCliente").focus();
    return false;
  }
  if (!data) {
    alert("Por favor, selecione a data da mudança.");
    document.getElementById("dataMudanca").focus();
    return false;
  }
  if (!origem) {
    alert("Por favor, preencha o bairro de origem.");
    document.getElementById("bairroOrigem").focus();
    return false;
  }
  if (!destino) {
    alert("Por favor, preencha o bairro de destino.");
    document.getElementById("bairroDestino").focus();
    return false;
  }
  if (!orcamento || orcamento <= 0) {
    alert("Por favor, preencha um orçamento válido.");
    document.getElementById("orcamento").focus();
    return false;
  }
  if (itensSelecionados.length === 0) {
    alert("Por favor, selecione ao menos um item.");
    return false;
  }
  return true;
}

// Exibe no HTML os itens selecionados e o volume total
function calcularMudanca() {
  const dados = obterDadosMudanca();
  if (!validarDados(dados)) return;

  const resultado = document.getElementById("resultado");
  resultado.innerHTML = `
    <h3>Itens Selecionados:</h3>
    <ul>${dados.itensSelecionados.map(item => `<li>${item}</li>`).join('')}</ul>
    <p><strong>Volume estimado:</strong> ${dados.volumeTotal.toFixed(2)} m³</p>
  `;
}

// Gera a mensagem que será enviada pelo WhatsApp
function gerarMensagem(dados) {
  const dataFormatada = formatarData(dados.data);
  return `Olá, meu nome é ${dados.nome} e gostaria de solicitar uma mudança:\n\n` +
    `📦 *Itens selecionados:*\n${dados.itensSelecionados.map(i => "- " + i).join('\n')}\n\n` +
    `📐 *Volume estimado:* ${dados.volumeTotal.toFixed(2)} m³\n` +
    `📅 *Data da mudança:* ${dataFormatada}\n` +
    `🏠 *Origem:* ${dados.origem}\n` +
    `🏡 *Destino:* ${dados.destino}\n` +
    `💰 *Orçamento estimado:* ${formatarMoeda(dados.orcamento)}`;
}
const chaveORS = '5b3ce3597851110001cf62485357c4231393475d93e3b0340857ead4'; // Pegue sua chave gratuita em: https://openrouteservice.org/

function calcularDistanciaEntreBairros(origem, destino) {
  const enderecoOrigem = `${origem}, São Paulo, Brasil`;
  const enderecoDestino = `${destino}, São Paulo, Brasil`;
  if (window.mapaInstance) {
  window.mapaInstance.remove();
}


  Promise.all([
    axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoOrigem)}`),
    axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDestino)}`)
  ]).then(([resOrigem, resDestino]) => {
    if (resOrigem.data.length === 0 || resDestino.data.length === 0) {
      alert("Não foi possível localizar os bairros no mapa.");
      return;
    }

    const coordOrigem = [
      parseFloat(resOrigem.data[0].lat),
      parseFloat(resOrigem.data[0].lon)
    ];
    const coordDestino = [
      parseFloat(resDestino.data[0].lat),
      parseFloat(resDestino.data[0].lon)
    ];

    const mapa = L.map('mapa').setView(coordOrigem, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
    L.marker(coordOrigem).addTo(mapa).bindPopup("Origem").openPopup();
    L.marker(coordDestino).addTo(mapa).bindPopup("Destino");

    axios.post('https://api.openrouteservice.org/v2/directions/driving-car', {
      coordinates: [coordOrigem.reverse(), coordDestino.reverse()]
    }, {
      headers: {
        'Authorization': chaveORS,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      const distanciaKm = response.data.features[0].properties.summary.distance / 1000;
      document.getElementById("distancia").textContent = `Distância estimada: ${distanciaKm.toFixed(2)} km`;

      const coordenadas = response.data.features[0].geometry.coordinates.map(p => [p[1], p[0]]);
      L.polyline(coordenadas, { color: 'blue' }).addTo(mapa);
    });
  }).catch(err => {
    console.error(err);
    alert("Erro ao calcular a distância.");
  });
}


// Gera o PDF com os dados da mudança e retorna o documento jsPDF
function gerarPDF(dados) {
  const { jsPDF } = window.jspdf;
  const dataFormatada = formatarData(dados.data);

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Orçamento de Mudança", 20, 20);

  doc.setFontSize(12);
  doc.text(`Cliente: ${dados.nome}`, 20, 35);
  doc.text(`Data da mudança: ${dataFormatada}`, 20, 45);
  doc.text(`Origem: ${dados.origem}`, 20, 55);
  doc.text(`Destino: ${dados.destino}`, 20, 65);
  doc.text(`Orçamento Estimado: ${formatarMoeda(dados.orcamento)}`, 20, 75);
  doc.text(`Volume Estimado: ${dados.volumeTotal.toFixed(2)} m³`, 20, 85);

  doc.text("Itens Selecionados:", 20, 100);
  let y = 110;
  dados.itensSelecionados.forEach(item => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`- ${item}`, 25, y);
    y += 10;
  });

  return doc;
}

// Função principal que envia a mensagem no WhatsApp e prepara o PDF para salvar
function enviarWhatsAppEPrepararPDF() {
  const dados = obterDadosMudanca();
  if (!validarDados(dados)) return;

  const whatsCliente = "11987012691";
  const mensagem = gerarMensagem(dados);
  calcularDistanciaEntreBairros(dados.origem, dados.destino);
  const link = `https://wa.me/55${whatsCliente}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, '_blank');

  pdfDoc = gerarPDF(dados);
  document.getElementById("btnSalvarPDF").style.display = "inline-block";
}

// Salva o PDF gerado
function salvarPDF() {
  if (pdfDoc) {
    const nome = document.getElementById("nomeCliente").value.trim();
    pdfDoc.save(`Orcamento-${nome.replace(/\s/g, "_")}.pdf`);
  }
}
