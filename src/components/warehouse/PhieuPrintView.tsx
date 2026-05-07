import type { PhieuKiemKe } from "@/lib/warehouse/types";

interface Props {
  phieu: PhieuKiemKe;
}

export function PhieuPrintView({ phieu }: Props) {
  function handlePrint() {
    const popup = window.open("", "_blank");
    if (!popup) return;
    popup.document.write(generatePrintHTML(phieu));
    popup.document.close();
    popup.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={phieu.status !== "DA_CHOT"}
      className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      In phiếu (2 liên)
    </button>
  );
}

function escapeHTML(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderDigitBoxes(value: number | null | undefined, count: number): string {
  const digits = value === null || value === undefined ? "" : String(value);
  const padded = digits.padStart(count, " ");
  return padded
    .split("")
    .map(
      (digit) => `
        <span class="digit-box">
          <span>${digit.trim()}</span>
        </span>
      `,
    )
    .join("");
}

function renderBarcode(value: string): string {
  return value
    .split("")
    .map((char, index) => {
      const width = (char.charCodeAt(0) % 4) + 1;
      return `<span class="bar w-${width}" data-index="${index}"></span>`;
    })
    .join("");
}

function noteContent(phieu: PhieuKiemKe): string {
  const parts = [
    `Phân bổ: ${phieu.locationCounts.map((loc) => `${loc.location}: ${loc.qty} xe`).join("; ")}`,
  ];

  if (phieu.adjustmentAppendix) {
    parts.push(
      `Phụ lục: ${phieu.adjustmentAppendix.loaiChenhLech} ${phieu.adjustmentAppendix.soLuong} xe - ${phieu.adjustmentAppendix.lyDo}`,
    );
  }

  if (phieu.note.trim()) {
    parts.push(`Ghi chú: ${phieu.note.trim()}`);
  }

  return parts.join("\n");
}

function generatePrintHTML(phieu: PhieuKiemKe): string {
  const systemQty = phieu.systemQty;
  const adjustedQty = phieu.adjustmentAppendix?.soLuongSauDieuChinh ?? null;
  const inspectionQty = phieu.inspectionList.length || null;
  const note = noteContent(phieu);
  const barcode = renderBarcode(phieu.phieuNo);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Phiếu kiểm kê ${escapeHTML(phieu.phieuNo)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Times New Roman", serif;
      color: #111;
      font-size: 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .copy {
      border: 2px solid #6b7280;
      padding: 16px 18px 12px;
      min-height: calc((100vh - 16px) / 2);
      display: flex;
      flex-direction: column;
    }
    .copy-b {
      border-color: #65a30d;
      box-shadow: inset 0 0 0 3px #84cc16;
    }
    .cut-line {
      border-top: 1px dashed #94a3b8;
      text-align: center;
      color: #64748b;
      font-size: 10px;
      padding-top: 4px;
    }
    .header {
      display: grid;
      grid-template-columns: 1.2fr 2fr;
      gap: 14px;
      align-items: start;
    }
    .title h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    .title .sub {
      margin-top: 4px;
      font-size: 16px;
      line-height: 1.4;
    }
    .top-grid {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 1fr;
      border: 1px solid #111;
    }
    .top-cell {
      border-left: 1px solid #111;
      min-height: 74px;
      padding: 4px 6px;
    }
    .top-cell:first-child {
      border-left: 0;
    }
    .field-label {
      font-size: 11px;
      text-transform: uppercase;
    }
    .field-value {
      margin-top: 6px;
      font-size: 18px;
      font-weight: 700;
      min-height: 28px;
    }
    .row-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr) 180px;
      gap: 0;
      margin-top: 12px;
      border: 1px solid #111;
    }
    .row-grid .cell {
      border-left: 1px solid #111;
      min-height: 56px;
      padding: 4px 6px;
    }
    .row-grid .cell:first-child {
      border-left: 0;
    }
    .barcode-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      height: 42px;
      margin-top: 4px;
      border: 1px solid #111;
      overflow: hidden;
    }
    .bar {
      display: inline-block;
      height: 100%;
      background: #111;
    }
    .w-1 { width: 1px; }
    .w-2 { width: 2px; }
    .w-3 { width: 3px; }
    .w-4 { width: 4px; }
    .mtoc-grid {
      display: grid;
      grid-template-columns: 1.8fr 1fr;
      margin-top: 12px;
      border: 1px solid #111;
    }
    .mtoc-cell {
      border-left: 1px solid #111;
      min-height: 82px;
      padding: 4px 6px;
    }
    .mtoc-cell:first-child {
      border-left: 0;
    }
    .mtoc-code {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 4px;
    }
    .mtoc-char {
      min-width: 18px;
      border-left: 1px dotted #111;
      padding-left: 2px;
      font-size: 14px;
      line-height: 24px;
    }
    .mtoc-char:first-child {
      border-left: 0;
      padding-left: 0;
    }
    .mtoc-name {
      margin-top: 8px;
      border-top: 1px solid #111;
      padding-top: 6px;
      font-size: 16px;
      font-weight: 700;
    }
    .qty-layout {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 14px;
      margin-top: 12px;
      align-items: start;
    }
    .ticket-box {
      border: 1px solid #111;
      min-height: 84px;
      padding: 4px 6px;
    }
    .ticket-box .big-number {
      margin-top: 14px;
      text-align: center;
      font-size: 36px;
      font-weight: 700;
    }
    .qty-table {
      width: 100%;
      border-collapse: collapse;
    }
    .qty-table th, .qty-table td {
      border: 1px solid #111;
      padding: 3px 4px;
      text-align: center;
    }
    .qty-table th {
      font-size: 11px;
      font-weight: 400;
    }
    .digit-row {
      display: flex;
      justify-content: center;
      gap: 0;
      min-height: 28px;
    }
    .digit-box {
      width: 22px;
      height: 24px;
      border-left: 1px solid #111;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
    }
    .digit-box:first-child {
      border-left: 0;
    }
    .note-layout {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 18px;
      margin-top: 12px;
      align-items: start;
    }
    .instructions {
      font-size: 12px;
      line-height: 1.45;
      padding-left: 18px;
      margin: 0;
    }
    .note-box {
      border: 1px solid #111;
      min-height: 96px;
      padding: 4px 6px;
      white-space: pre-line;
      line-height: 1.45;
    }
    .copy-tag {
      margin-top: auto;
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="page">
    ${renderCopy("LIÊN A - Kho lưu", phieu, systemQty, adjustedQty, inspectionQty, note, barcode, false)}
    <div class="cut-line">Cắt tại đây</div>
    ${renderCopy("LIÊN B - Nộp UBKK", phieu, systemQty, adjustedQty, inspectionQty, note, barcode, true)}
  </div>
</body>
</html>`;
}

function renderCopy(
  tag: string,
  phieu: PhieuKiemKe,
  systemQty: number,
  adjustedQty: number | null,
  inspectionQty: number | null,
  note: string,
  barcode: string,
  isGreen: boolean,
): string {
  const reviseMark = phieu.adjustmentAppendix ? "X" : "";

  return `
    <section class="copy ${isGreen ? "copy-b" : ""}">
      <div class="header">
        <div class="title">
          <h1>PHIẾU KIỂM KÊ</h1>
          <div class="sub">
            Kỳ: ${escapeHTML(phieu.snapshotId)}<br/>
            CÔNG TY HONDA VIỆT NAM
          </div>
        </div>
        <div class="top-grid">
          <div class="top-cell">
            <div class="field-label">Mã Block</div>
            <div class="field-value">${escapeHTML(phieu.maBlock)}</div>
          </div>
          <div class="top-cell">
            <div class="field-label">Người đếm</div>
            <div class="field-value">${escapeHTML(phieu.nguoiDem)}</div>
          </div>
          <div class="top-cell">
            <div class="field-label">Xác nhận</div>
            <div class="field-value">${escapeHTML(phieu.nguoiXacNhan)}</div>
          </div>
          <div class="top-cell">
            <div class="field-label">Auditor</div>
            <div class="field-value">${escapeHTML(phieu.auditorName)}</div>
          </div>
        </div>
      </div>

      <div class="row-grid">
        <div class="cell"><div class="field-label">Mã P/L</div><div class="field-value">${escapeHTML(phieu.modelCode)}</div></div>
        <div class="cell"><div class="field-label">Mã S/L</div><div class="field-value">${escapeHTML(phieu.phieuNo)}</div></div>
        <div class="cell"><div class="field-label">Mã quản lý</div><div class="field-value">${escapeHTML(phieu.mtocKey)}</div></div>
        <div class="cell"><div class="field-label">Đ/VT, phẩm</div><div class="field-value">Chiếc</div></div>
        <div class="cell"><div class="field-label">Cấp độ quản lý</div><div class="field-value">MTOC</div></div>
        <div class="cell">
          <div class="barcode-box">${barcode}</div>
        </div>
      </div>

      <div class="mtoc-grid">
        <div class="mtoc-cell">
          <div class="field-label">Mã phụ tùng</div>
          <div class="mtoc-code">
            ${escapeHTML(phieu.mtocKey)
              .split("")
              .map((char) => `<span class="mtoc-char">${char === " " ? "&nbsp;" : char}</span>`)
              .join("")}
          </div>
          <div class="mtoc-name">${escapeHTML(phieu.modelName)}</div>
        </div>
        <div class="mtoc-cell">
          <div class="field-label">Màu sắc</div>
          <div class="field-value">${escapeHTML(phieu.colorCode)} - ${escapeHTML(phieu.colorName)}</div>
        </div>
      </div>

      <div class="qty-layout">
        <div class="ticket-box">
          <div class="field-label">Số phiếu kiểm kê</div>
          <div class="big-number">${systemQty}</div>
        </div>

        <table class="qty-table">
          <thead>
            <tr>
              <th>Số lượng thực tế</th>
              <th>Sửa lại</th>
              <th>Số lượng sửa lại</th>
              <th>Auditing Q'ty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><div class="digit-row">${renderDigitBoxes(systemQty, 8)}</div></td>
              <td><div class="digit-row">${renderDigitBoxes(reviseMark ? 1 : null, 1).replace(">1<", `>${reviseMark}<`)}</div></td>
              <td><div class="digit-row">${renderDigitBoxes(adjustedQty, 8)}</div></td>
              <td><div class="digit-row">${renderDigitBoxes(inspectionQty, 8)}</div></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="note-layout">
        <ol class="instructions">
          <li>Sử dụng bút bi, không viết ra ngoài các ô.</li>
          <li>Ghi số lượng chính xác, rõ ràng.</li>
          <li>Trong trường hợp viết sai, đánh dấu "X" và viết sang ô bên cạnh.</li>
          <li>Bảo quản phiếu kiểm kê cẩn thận, không gấp phiếu.</li>
          <li>Không sử dụng loại phiếu khác, hoặc phiếu kiểm kê của block khác.</li>
        </ol>

        <div class="note-box">
          <div class="field-label">Ghi chú</div>
          ${escapeHTML(note)}
        </div>
      </div>

      <div class="copy-tag">${tag}</div>
    </section>
  `;
}
