const form = document.querySelector("#pdfForm");
const fileInput = document.querySelector("#photos");
const photoList = document.querySelector("#photoList");
const statusBox = document.querySelector("#status");
const pdfButton = document.querySelector("#pdfButton");
const shootingDate = document.querySelector("#shootingDate");
const reportType = document.querySelector("#reportType");

shootingDate.valueAsDate = new Date();

fileInput.addEventListener("change", renderPhotoInputs);
form.addEventListener("submit", generatePdf);

function renderPhotoInputs() {
  photoList.replaceChildren();

  Array.from(fileInput.files).forEach((file, index) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    card.dataset.index = String(index);

    const title = document.createElement("div");
    title.className = "photo-title";
    title.textContent = `写真 ${index + 1}: ${file.name}`;

    const preview = document.createElement("img");
    preview.alt = `写真 ${index + 1}`;
    preview.src = URL.createObjectURL(file);
    preview.addEventListener("load", () => URL.revokeObjectURL(preview.src), { once: true });

    card.append(
      title,
      preview,
      createField("工事箇所", `workLocation-${index}`),
      createField("工事内容", `constructionDetails-${index}`),
      createField("寸法", `dimensions-${index}`),
    );
    photoList.append(card);
  });
}

function createField(labelText, id) {
  const label = document.createElement("label");
  label.textContent = labelText;
  const input = document.createElement("input");
  input.id = id;
  label.append(input);
  return label;
}

async function generatePdf(event) {
  event.preventDefault();
  clearStatus();

  if (!fileInput.files.length) {
    setStatus("写真を1枚以上アップロードしてください。", true);
    return;
  }

  try {
    pdfButton.disabled = true;
    setStatus("PDFを作成しています...");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const photos = readPhotoInputs();
    const shootingDateText = formatDateText(shootingDate.value);
    const reportTitle = getReportTitle();
    const pageCount = Math.max(1, Math.ceil(photos.length / 2));

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      if (pageIndex > 0) pdf.addPage();
      const pageCanvas = await drawPdfCanvasPage(photos, pageIndex, shootingDateText, reportTitle);
      pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    }

    pdf.save(`${reportTitle}.pdf`);
    setStatus("PDFを作成しました。");
  } catch (error) {
    setStatus(`PDF作成中にエラーが発生しました。${error.message}`, true);
  } finally {
    pdfButton.disabled = false;
  }
}

function readPhotoInputs() {
  return Array.from(fileInput.files).map((file, index) => ({
    file,
    workLocation: document.querySelector(`#workLocation-${index}`)?.value || "",
    constructionDetails: document.querySelector(`#constructionDetails-${index}`)?.value || "",
    dimensions: document.querySelector(`#dimensions-${index}`)?.value || "",
  }));
}

function getReportTitle() {
  return reportType.value === "after" ? "工事後写真一覧" : "工事前写真一覧";
}

async function drawPdfCanvasPage(photos, pageIndex, shootingDateText, reportTitle) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const context = canvas.getContext("2d");

  context.fillStyle = "#fbfaf6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#5d6f5a";
  context.fillRect(58, 48, 1124, 74);
  context.fillStyle = "#ffffff";
  context.font = '700 34px "Yu Gothic", Meiryo, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(reportTitle, 620, 86);

  drawCanvasInfoRow(context, 70, 160, "利用者名", document.querySelector("#userName").value);
  drawCanvasInfoRow(context, 70, 215, "住所", document.querySelector("#address").value);

  for (let slotIndex = 0; slotIndex < 2; slotIndex += 1) {
    const photoIndex = pageIndex * 2 + slotIndex;
    const slot = canvasSlot(slotIndex);
    drawCanvasPhotoFrame(context, slot);

    if (photoIndex >= photos.length) continue;
    const photoCanvas = await prepareImageForPdfCanvas(photos[photoIndex].file, slot.image.w - 16, slot.image.h - 16, shootingDateText);
    context.drawImage(
      photoCanvas,
      slot.image.x + (slot.image.w - photoCanvas.width) / 2,
      slot.image.y + (slot.image.h - photoCanvas.height) / 2,
    );
    drawCanvasPhotoText(context, slot, photos[photoIndex]);
  }

  return canvas;
}

function drawCanvasInfoRow(context, x, y, label, value) {
  context.font = '700 22px "Yu Gothic", Meiryo, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  drawCanvasCell(context, x, y, 170, 44, "#efe7d8", label, true);
  drawCanvasCell(context, x + 170, y, 920, 44, "#ffffff", value);
}

function drawCanvasCell(context, x, y, width, height, fill, text, isCentered = false) {
  context.fillStyle = fill;
  context.strokeStyle = "#7a7a7a";
  context.lineWidth = 1.5;
  context.fillRect(x, y, width, height);
  context.strokeRect(x, y, width, height);
  context.fillStyle = "#243026";
  context.textAlign = isCentered ? "center" : "left";
  context.fillText(String(text || ""), isCentered ? x + width / 2 : x + 16, y + height / 2);
}

function canvasSlot(index) {
  const baseY = index === 0 ? 320 : 980;
  return {
    image: { x: 140, y: baseY, w: 960, h: 420 },
    tableY: baseY + 450,
  };
}

function drawCanvasPhotoFrame(context, slot) {
  context.fillStyle = "#fafaf7";
  context.strokeStyle = "#333333";
  context.lineWidth = 3;
  context.fillRect(slot.image.x, slot.image.y, slot.image.w, slot.image.h);
  context.strokeRect(slot.image.x, slot.image.y, slot.image.w, slot.image.h);
}

function drawCanvasPhotoText(context, slot, photo) {
  context.font = '700 22px "Yu Gothic", Meiryo, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  const rows = [
    ["工事箇所", photo.workLocation],
    ["工事内容", photo.constructionDetails],
    ["寸法", photo.dimensions],
  ];

  rows.forEach((row, index) => {
    const y = slot.tableY + index * 46;
    drawCanvasCell(context, 140, y, 210, 46, "#efe7d8", row[0], true);
    drawCanvasCell(context, 350, y, 750, 46, "#ffffff", row[1]);
  });
}

async function prepareImageForPdfCanvas(file, maxWidth, maxHeight, shootingDateText) {
  const image = await loadImage(file);
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  if (shootingDateText) {
    drawShootingDate(context, canvas.width, canvas.height, shootingDateText);
  }

  return canvas;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`${file.name} を読み込めませんでした。`));
    };
    image.src = url;
  });
}

function drawShootingDate(context, width, height, text) {
  const fontSize = Math.max(16, Math.min(34, Math.floor(width / 16)));
  const margin = Math.max(8, Math.floor(Math.min(width, height) / 28));
  context.font = `700 ${fontSize}px "Yu Gothic", Meiryo, sans-serif`;
  context.textBaseline = "bottom";
  const metrics = context.measureText(text);
  const x = Math.max(margin, width - metrics.width - margin);
  const y = height - margin;

  context.lineWidth = 4;
  context.strokeStyle = "#ffffff";
  context.strokeText(text, x, y);
  context.fillStyle = "#ff7800";
  context.fillText(text, x, y);
}

function formatDateText(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("error", isError);
}

function clearStatus() {
  setStatus("");
}
