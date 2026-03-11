const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} = require("docx");

const mdPath = path.join(__dirname, "..", "Sophia中文识字进阶表_2000字.md");
const docxPath = path.join(__dirname, "..", "3 Sophia中文识字进阶表_2000字.docx");

const md = fs.readFileSync(mdPath, "utf-8");
const lines = md.split("\n");

const children = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Skip empty lines
  if (line.trim() === "") continue;

  // Horizontal rule
  if (line.trim() === "---") {
    children.push(
      new Paragraph({
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999" },
        },
        spacing: { before: 200, after: 200 },
      })
    );
    continue;
  }

  // H1
  if (line.startsWith("# ") && !line.startsWith("##")) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/^# /, ""),
            bold: true,
            size: 36, // 18pt
            font: "Microsoft YaHei",
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
    continue;
  }

  // H2
  if (line.startsWith("## ") && !line.startsWith("###")) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/^## /, ""),
            bold: true,
            size: 32, // 16pt
            font: "Microsoft YaHei",
            color: "2E74B5",
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 360, after: 120 },
      })
    );
    continue;
  }

  // H3
  if (line.startsWith("### ") && !line.startsWith("####")) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/^### /, ""),
            bold: true,
            size: 26, // 13pt
            font: "Microsoft YaHei",
            color: "404040",
          }),
        ],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 80 },
      })
    );
    continue;
  }

  // H4
  if (line.startsWith("#### ")) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/^#### /, ""),
            bold: true,
            size: 22, // 11pt
            font: "Microsoft YaHei",
            color: "595959",
          }),
        ],
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 160, after: 60 },
      })
    );
    continue;
  }

  // Blockquote
  if (line.startsWith("> ")) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/^> /, ""),
            italics: true,
            size: 20, // 10pt
            font: "Microsoft YaHei",
            color: "666666",
          }),
        ],
        indent: { left: 720 },
        spacing: { before: 40, after: 40 },
      })
    );
    continue;
  }

  // Regular text (Chinese characters with full-width spaces)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 24, // 12pt
          font: "Microsoft YaHei",
          characterSpacing: 80,
        }),
      ],
      spacing: { before: 40, after: 40 },
      indent: { left: 360 },
    })
  );
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(docxPath, buffer);
  console.log("Done:", docxPath);
});
