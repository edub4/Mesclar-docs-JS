const container = document.querySelector(".arquivos");



function criarInput() {
  const label = document.createElement("label");
  label.className = "file-input";

  const dropzone = document.createElement("div");
  dropzone.className = "drop-zone";

  const p = document.createElement("p");
  p.innerHTML = "<b>Selecione um arquivo</b> ou solte aqui.";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,.pdf,.doc,.docx";

  dropzone.appendChild(p);
  label.appendChild(dropzone);
  label.appendChild(input);

  // drag visual
  label.addEventListener("dragenter", () => {
    label.classList.add("active");
  });

  ["dragleave", "dragend", "drop"].forEach(event => {
    label.addEventListener(event, () => {
      label.classList.remove("active");
    });
  });

  // preview
  input.addEventListener("change", () => {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    p.style.display = "none";

    const oldPreview = dropzone.querySelector(".preview");
    if (oldPreview) oldPreview.remove();

    let preview;

    if (file.type.startsWith("image/")) {
      preview = document.createElement("img");
      preview.src = URL.createObjectURL(file);
    }

    else if (file.type === "application/pdf") {
      preview = document.createElement("div");
      preview.innerHTML = `📄 <b>${file.name}</b>`;
    }

    else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      preview = document.createElement("div");
      preview.innerHTML = `📝 <b>${file.name}</b>`;
    }

    else {
      preview = document.createElement("div");
      preview.innerHTML = `📁 <b>${file.name}</b>`;
    }

    preview.classList.add("preview");
    dropzone.appendChild(preview);

    // novo input automático
    if (!label.nextElementSibling) {
      container.appendChild(criarInput());
    }
  });

  return label;
}

container.appendChild(criarInput());
const btnResetar = document.querySelector("#resetar-arq");

btnResetar.addEventListener("click", () => {
  // remove tudo
  container.innerHTML = "";

  // cria um input novo vazio
  container.appendChild(criarInput());
});

// =======================
// MESCLAR
// =======================
const btnMesclar = document.querySelector("#mesclar-arq");

btnMesclar.addEventListener("click", async () => {
  const inputs = document.querySelectorAll("input[type='file']");

  // verifica se existe pelo menos 1 arquivo
  const temArquivo = Array.from(inputs).some(input => input.files && input.files[0]);

  if (!temArquivo) {
    alert("Adicione pelo menos um arquivo antes de mesclar.");
    return;
  }
  const { PDFDocument } = PDFLib;

  const pdfFinal = await PDFDocument.create();

  let nomeArquivo = "arquivo_mesclado";

  for (let input of inputs) {
    if (!input.files || !input.files[0]) continue;

    const file = input.files[0];

    if (nomeArquivo === "arquivo_mesclado") {
      nomeArquivo = file.name.split(".")[0];
    }

    if (file.type.startsWith("image/")) {
      const bytes = await file.arrayBuffer();

      let image;
      if (file.type === "image/png") {
        image = await pdfFinal.embedPng(bytes);
      } else {
        image = await pdfFinal.embedJpg(bytes);
      }

      const page = pdfFinal.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });
    }

    else if (file.type === "application/pdf") {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);

      const pages = await pdfFinal.copyPages(pdf, pdf.getPageIndices());
      pages.forEach(p => pdfFinal.addPage(p));
    }

    else {
      console.warn("DOC/DOCX não é suportado para mesclagem ainda:", file.name);
    }
  }


  // gerar arquivo final
  const finalBytes = await pdfFinal.save();

  const blob = new Blob([finalBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo + "_mesclado.pdf";
  a.click();
});

const btn = document.querySelector("#copiar-email");

btn.addEventListener("click", () => {
  const email = document.querySelector(".email").textContent;

  navigator.clipboard.writeText(email)
    .then(() => {
      alert("Email copiado!");
    })
    .catch(() => {
      alert("Erro ao copiar.");
    });
});