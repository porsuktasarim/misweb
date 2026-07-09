/**
 * word.exporter.js
 *
 * Ortak rapor contract'ini .docx dosyasina cevirir. Her bolum kendi
 * basligiyla ayri bir bolum (section) gibi art arda yazilir.
 */

const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
} = require('docx');
const lang = require('../../../../config/lang/tr');

function hucre(metin, kalin = false) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text: String(metin), bold: kalin })] })],
    width: { size: 2000, type: WidthType.DXA },
  });
}

function tabloOlustur(basliklar, satirlar) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: basliklar.map((b) => hucre(b, true)) }),
      ...satirlar.map((s) => new TableRow({ children: s.map((deger) => hucre(deger)) })),
    ],
  });
}

async function contractToWord(contract) {
  const bolumlerParagraf = [
    new Paragraph({ text: `${contract.modulAdi} Raporu`, heading: HeadingLevel.HEADING_1 }),
  ];

  for (const bolum of contract.bolumler) {
    const baslikMetni =
      `${bolum.baslik.il} / ${bolum.baslik.ilce}` +
      (bolum.baslik.mahalle ? ` / ${bolum.baslik.mahalle}` : '');

    bolumlerParagraf.push(
      new Paragraph({ text: baslikMetni, heading: HeadingLevel.HEADING_2 })
    );

    for (const isletmeci of bolum.isletmeciler) {
      bolumlerParagraf.push(
        new Paragraph({ text: isletmeci.isletmeciAdi, heading: HeadingLevel.HEADING_3 })
      );
      const satirlar = isletmeci.kayitlar.map((k) => [
        k.grup,
        k.kategori,
        k.adet,
        k.katsayi,
        k.deger,
      ]);
      bolumlerParagraf.push(
        tabloOlustur(
          [lang.ortak.grup, lang.ortak.cins, lang.ortak.adet, lang.ortak.katsayi, contract.modulAdi],
          satirlar
        )
      );
      bolumlerParagraf.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${lang.ortak.toplam}: ${isletmeci.isletmeciToplami}`,
              bold: true,
            }),
          ],
        })
      );
    }

    bolumlerParagraf.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${baslikMetni} - ${lang.ortak.toplam}: ${bolum.bolumToplami}`,
            bold: true,
          }),
        ],
      })
    );
  }

  bolumlerParagraf.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${lang.ortak.genelToplam}: ${contract.genelToplam}`, bold: true, size: 28 }),
      ],
    })
  );

  bolumlerParagraf.push(new Paragraph({ text: lang.ortak.siniflandirmaKriterleri, heading: HeadingLevel.HEADING_2 }));
  bolumlerParagraf.push(
    tabloOlustur(
      [lang.ortak.grup, lang.ortak.cins, lang.ortak.katsayi],
      contract.siniflandirmaKriterleri.map((k) => [k.grup, k.kategori, k.katsayi])
    )
  );

  const doc = new Document({ sections: [{ children: bolumlerParagraf }] });
  return Packer.toBuffer(doc);
}

module.exports = { contractToWord };
