
function adicionarCarrinho(produto, preco) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  carrinho.push({ produto, preco });
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  alert(`${produto} adicionado ao carrinho!`);
}

function carregarCarrinho() {
  const lista = document.getElementById("lista-carrinho");
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  if (lista) {
    if (carrinho.length === 0) {
      lista.innerHTML = "<p>Seu carrinho está vazio.</p>";
      return;
    }

    let html = "<ul>";
    let total = 0;

    carrinho.forEach(item => {
      html += `<li>${item.produto} - R$ ${item.preco.toFixed(2)}</li>`;
      total += item.preco;
    });

    html += `</ul><p><strong>Total: R$ ${total.toFixed(2)}</strong></p>`;
    lista.innerHTML = html;
  }
}

function finalizarCompra() {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  if (carrinho.length === 0) {
    alert("Carrinho vazio!");
    return;
  }

  let mensagem = "Olá! Quero comprar:\n";
  let total = 0;

  carrinho.forEach(item => {
    mensagem += `- ${item.produto} - R$ ${item.preco.toFixed(2)}\n`;
    total += item.preco;
  });

  mensagem += `\nTotal: R$ ${total.toFixed(2)}`;
  const numero = "5511945414499";
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  window.location.href = url;
  localStorage.removeItem("carrinho");
}

if (document.getElementById("lista-carrinho")) {
  carregarCarrinho();
}
