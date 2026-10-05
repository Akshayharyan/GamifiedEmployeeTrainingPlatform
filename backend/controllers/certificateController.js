const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const Certificate = require("../models/Certificate");
const Module = require("../models/module");
const User = require("../models/User");

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);

const formatShortDate = (date) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);

const formatCompactDate = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);

const buildCertificateId = () => `SQ-${uuidv4().split("-")[0].toUpperCase()}-${Date.now().toString().slice(-4)}`;

const getTotalModuleXp = (moduleDoc) =>
  moduleDoc?.topics?.reduce((sum, topic) => sum + (topic?.xp || 0), 0) || 0;

exports.generateCertificate = async (req, res) => {
  try {
    const userId = req.user._id;
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ success: false, message: "moduleId is required" });
    }

    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ success: false, message: "Module not found" });
    }

    let certificate = await Certificate.findOne({ userId, moduleId });
    if (certificate) {
      return res.json({ success: true, certificate });
    }

    const earnedXp = getTotalModuleXp(module);

    try {
      certificate = await Certificate.create({
        userId,
        moduleId,
        moduleTitle: module.title,
        certificateId: buildCertificateId(),
        earnedXp
      });
    } catch (dbErr) {
      // Handle race condition: if another request already created this certificate
      if (dbErr.code === 11000) {
        certificate = await Certificate.findOne({ userId, moduleId });
        return res.json({ success: true, certificate });
      }
      throw dbErr;
    }

    res.json({ success: true, certificate });
  } catch (err) {
    console.error("Certificate generation failed", err);
    res.status(500).json({ success: false, message: "Unable to generate certificate" });
  }
};

exports.listCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, certificates });
  } catch (err) {
    console.error("Load certificates failed", err);
    res.status(500).json({ success: false, message: "Unable to load certificates" });
  }
};

exports.getCertificateByCode = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const certificate = await Certificate.findOne({ certificateId })
      .populate("userId", "name email")
      .populate("moduleId", "title")
      .lean();

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({ success: true, certificate });
  } catch (err) {
    console.error("Verify certificate failed", err);
    res.status(500).json({ success: false, message: "Unable to verify certificate" });
  }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    let certificate = await Certificate.findOne({ certificateId })
      .populate("userId", "name email")
      .populate("moduleId", "title")
      .lean();

    // Fallback: allow download via Mongo _id (used by some game flows).
    if (!certificate) {
      certificate = await Certificate.findById(certificateId)
        .populate("userId", "name email")
        .populate("moduleId", "title")
        .lean();
    }

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    const certificateUserId = String(certificate.userId?._id || certificate.userId);
    if (certificateUserId !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await streamCertificatePdf({
      certificate,
      user: certificate.userId,
      module: certificate.moduleId || { title: certificate.moduleTitle }
    }, res);
  } catch (err) {
    console.error("Download certificate failed", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Unable to download certificate" });
    }
  }
};

async function streamCertificatePdf({ certificate, user, module }, res) {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const borderInset = 28;
  const padding = 12;
  const contentX = borderInset + padding;
  const contentWidth = pageWidth - borderInset * 2 - padding * 2;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${certificate.certificateId}.pdf`
  );

  doc.pipe(res);

  // ===== PREMIUM BACKGROUND =====
  doc.rect(0, 0, pageWidth, pageHeight).fill("#ffffff");
  
  // Subtle top gradient overlay
  const topGradient = doc.linearGradient(0, 0, 0, 150);
  topGradient.stop(0, "#f0f9ff").stop(1, "#ffffff");
  doc.rect(0, 0, pageWidth, 150).fill(topGradient);

  // ===== LUXURY BORDER FRAME =====
  // Outer frame
  doc.rect(borderInset, borderInset, pageWidth - borderInset * 2, pageHeight - borderInset * 2)
    .lineWidth(3.5)
    .stroke("#1e3a8a");

  // Inner decorative line
  const innerInset = borderInset + 8;
  doc.rect(innerInset, innerInset, pageWidth - innerInset * 2, pageHeight - innerInset * 2)
    .lineWidth(1)
    .stroke("#60a5fa");

  // Premium left accent ribbon with gradient
  const ribbonGradient = doc.linearGradient(borderInset - 12, borderInset, borderInset - 12, pageHeight - borderInset);
  ribbonGradient.stop(0, "#fbbf24").stop(0.3, "#f59e0b").stop(0.7, "#f97316").stop(1, "#dc2626");
  doc.rect(borderInset - 20, borderInset, 12, pageHeight - borderInset * 2).fill(ribbonGradient);

  // ===== DECORATIVE TOP CORNER FLOURISHES =====
  const cornerSize = 25;
  // Top left corner accent
  doc.moveTo(borderInset + 30, borderInset + 20)
    .lineTo(borderInset + 55, borderInset + 20)
    .lineWidth(2)
    .stroke("#1e3a8a");
  doc.moveTo(borderInset + 30, borderInset + 20)
    .lineTo(borderInset + 30, borderInset + 45)
    .lineWidth(2)
    .stroke("#1e3a8a");

  // Top right corner accent
  doc.moveTo(pageWidth - borderInset - 30, borderInset + 20)
    .lineTo(pageWidth - borderInset - 55, borderInset + 20)
    .lineWidth(2)
    .stroke("#1e3a8a");
  doc.moveTo(pageWidth - borderInset - 30, borderInset + 20)
    .lineTo(pageWidth - borderInset - 30, borderInset + 45)
    .lineWidth(2)
    .stroke("#1e3a8a");

  // ===== SUBTLE WATERMARK =====
  doc.save();
  doc.rotate(-25, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.opacity(0.02);
  doc.font("Helvetica-Bold").fontSize(160).fillColor("#1e3a8a");
  doc.text("SKILLQUEST", pageWidth / 2 - 350, pageHeight / 2 - 80, { width: 700, align: "center" });
  doc.restore();
  doc.opacity(1);

  // ===== PREMIUM HEADER =====
  doc.font("Helvetica")
    .fontSize(9)
    .fillColor("#0f766e")
    .text("EXCELLENCE IN LEARNING", contentX, 65, {
      align: "center",
      width: contentWidth,
      characterSpacing: 2
    });

  doc.font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#1e3a8a")
    .text("SKILLQUEST ACADEMY", contentX, 78, {
      align: "center",
      width: contentWidth,
      characterSpacing: 1.5
    });

  // Decorative line under header
  doc.moveTo(contentX + 80, 100)
    .lineTo(pageWidth - contentX - 80, 100)
    .lineWidth(1.5)
    .stroke("#60a5fa");
  
  doc.moveTo(contentX + 120, 100)
    .lineTo(contentX + 150, 100)
    .lineWidth(1)
    .stroke("#fbbf24");

  doc.moveTo(pageWidth - contentX - 120, 100)
    .lineTo(pageWidth - contentX - 150, 100)
    .lineWidth(1)
    .stroke("#fbbf24");

  // ===== MAIN TITLE =====
  doc.font("Times-Bold")
    .fontSize(60)
    .fillColor("#1e3a8a")
    .text("CERTIFICATE", contentX, 115, {
      align: "center",
      width: contentWidth
    });

  doc.font("Helvetica")
    .fontSize(20)
    .fillColor("#0f766e")
    .text("OF COMPLETION", contentX, 175, {
      align: "center",
      width: contentWidth,
      characterSpacing: 1
    });

  // ===== RECIPIENT SECTION =====
  doc.font("Helvetica")
    .fontSize(11)
    .fillColor("#64748b")
    .text("This Certificate is Presented to", contentX, 225, {
      align: "center",
      width: contentWidth
    });

  doc.font("Times-Bold")
    .fontSize(38)
    .fillColor("#0f172a")
    .text(user.name || "Valiant Employee", contentX, 250, {
      align: "center",
      width: contentWidth
    });

  // ===== ACHIEVEMENT TEXT WITH STYLING =====
  const achievementY = 305;
  const achievementText = `for successfully completing the official training module "${module.title}"
and demonstrating exceptional mastery by defeating the SkillQuest boss challenge.`;

  doc.font("Helvetica")
    .fontSize(11)
    .fillColor("#475569")
    .text(achievementText, contentX + 35, achievementY, {
      align: "center",
      width: contentWidth - 70,
      lineGap: 5
    });

  // ===== PREMIUM MODULE HIGHLIGHT BOX =====
  const moduleBoxY = 370;
  const moduleBoxHeight = 60;
  const moduleBoxGradient = doc.linearGradient(contentX, moduleBoxY, contentX, moduleBoxY + moduleBoxHeight);
  moduleBoxGradient.stop(0, "#eff6ff").stop(1, "#dbeafe");
  doc.roundedRect(contentX, moduleBoxY, contentWidth, moduleBoxHeight, 15)
    .fill(moduleBoxGradient);
  doc.roundedRect(contentX, moduleBoxY, contentWidth, moduleBoxHeight, 15)
    .lineWidth(2).stroke("#0369a1");

  doc.font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#0c4a6e")
    .text("TRAINING MODULE", contentX + 25, moduleBoxY + 10, {
      width: contentWidth - 50,
      align: "center",
      characterSpacing: 1
    });

  doc.font("Times-Bold")
    .fontSize(22)
    .fillColor("#1e3a8a")
    .text(module.title || "Module", contentX + 25, moduleBoxY + 28, {
      width: contentWidth - 50,
      align: "center"
    });

  // ===== PREMIUM CREDENTIALS SECTION =====
  const credY = 455;
  const credBoxWidth = 120;
  const credBoxGap = 18;
  const credBoxHeight = 95;
  const totalCredWidth = credBoxWidth * 3 + credBoxGap * 2;
  const credStartX = contentX + (contentWidth - totalCredWidth) / 2;

  const credBoxes = [
    { label: "Achievement", value: "Completed", color: "#10b981" },
    { label: "Skill Points", value: `${certificate.earnedXp} XP`, color: "#f59e0b" },
    { label: "Awarded", value: formatCompactDate(certificate.issuedAt), color: "#8b5cf6" }
  ];

  credBoxes.forEach((box, idx) => {
    const boxX = credStartX + idx * (credBoxWidth + credBoxGap);
    const credGradient = doc.linearGradient(boxX, credY, boxX, credY + credBoxHeight);
    credGradient.stop(0, "#ffffff").stop(1, "#f8f9fa");
    
    doc.roundedRect(boxX, credY, credBoxWidth, credBoxHeight, 12)
      .fill(credGradient);
    doc.roundedRect(boxX, credY, credBoxWidth, credBoxHeight, 12)
      .lineWidth(2).stroke(box.color);

    // Color dot
    doc.circle(boxX + credBoxWidth / 2, credY + 12, 4).fill(box.color);

    doc.font("Helvetica")
      .fontSize(8.5)
      .fillColor("#64748b")
      .text(box.label.toUpperCase(), boxX + 8, credY + 22, {
        width: credBoxWidth - 16,
        align: "center",
        characterSpacing: 0.5
      });

    doc.font("Helvetica-Bold")
      .fontSize(17)
      .fillColor("#1e3a8a")
      .text(box.value, boxX + 8, credY + 45, {
        width: credBoxWidth - 16,
        align: "center"
      });
  });

  // ===== PREMIUM BOTTOM SECTION: QR + CERT ID =====
  const bottomY = 575;
  const qrSize = 85;
  const qrBoxWidth = 130;
  const certIdBoxWidth = contentWidth - qrBoxWidth - 40;

  // QR Code Premium Box
  const qrBoxX = contentX + 20;
  const qrBoxGradient = doc.linearGradient(qrBoxX, bottomY, qrBoxX, bottomY + qrBoxWidth);
  qrBoxGradient.stop(0, "#fafafa").stop(1, "#f3f4f6");
  doc.roundedRect(qrBoxX, bottomY, qrBoxWidth, qrBoxWidth, 12)
    .fill(qrBoxGradient);
  doc.roundedRect(qrBoxX, bottomY, qrBoxWidth, qrBoxWidth, 12)
    .lineWidth(2.5).stroke("#1e3a8a");

  doc.font("Helvetica-Bold")
    .fontSize(8)
    .fillColor("#0c4a6e")
    .text("SCAN TO VERIFY", qrBoxX, bottomY + 4, {
      width: qrBoxWidth,
      align: "center",
      characterSpacing: 1
    });

  try {
    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const qrPayload = `${baseUrl}/verify/${certificate.certificateId}`;
    const qrDataUrl = await QRCode.toDataURL(qrPayload);
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
    const qrX = qrBoxX + (qrBoxWidth - qrSize) / 2;
    const qrY = bottomY + 22;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  } catch (qrErr) {
    console.error("QR generation failed", qrErr);
  }

  // Certificate ID Premium Box
  const certIdBoxX = qrBoxX + qrBoxWidth + 20;
  const certIdBoxGradient = doc.linearGradient(certIdBoxX, bottomY, certIdBoxX, bottomY + qrBoxWidth);
  certIdBoxGradient.stop(0, "#fef3c7").stop(1, "#fde68a");
  doc.roundedRect(certIdBoxX, bottomY, certIdBoxWidth, qrBoxWidth, 12)
    .fill(certIdBoxGradient);
  doc.roundedRect(certIdBoxX, bottomY, certIdBoxWidth, qrBoxWidth, 12)
    .lineWidth(2.5).stroke("#d97706");

  doc.font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor("#92400e")
    .text("CERTIFICATE #", certIdBoxX + 15, bottomY + 15, {
      characterSpacing: 1
    });

  doc.font("Helvetica-Bold")
    .fontSize(11)
    .fillColor("#1e3a8a")
    .text(certificate.certificateId, certIdBoxX + 15, bottomY + 33, {
      width: certIdBoxWidth - 30,
      lineGap: 1
    });

  doc.font("Helvetica")
    .fontSize(8)
    .fillColor("#78350f")
    .text(`Verified ${formatCompactDate(certificate.issuedAt)}`, certIdBoxX + 15, bottomY + 85, {
      width: certIdBoxWidth - 30
    });

  // ===== DECORATIVE BOTTOM CORNER FLOURISHES =====
  // Bottom left corner accent
  doc.moveTo(borderInset + 30, pageHeight - borderInset - 20)
    .lineTo(borderInset + 55, pageHeight - borderInset - 20)
    .lineWidth(2)
    .stroke("#1e3a8a");
  doc.moveTo(borderInset + 30, pageHeight - borderInset - 20)
    .lineTo(borderInset + 30, pageHeight - borderInset - 45)
    .lineWidth(2)
    .stroke("#1e3a8a");

  // Bottom right corner accent
  doc.moveTo(pageWidth - borderInset - 30, pageHeight - borderInset - 20)
    .lineTo(pageWidth - borderInset - 55, pageHeight - borderInset - 20)
    .lineWidth(2)
    .stroke("#1e3a8a");
  doc.moveTo(pageWidth - borderInset - 30, pageHeight - borderInset - 20)
    .lineTo(pageWidth - borderInset - 30, pageHeight - borderInset - 45)
    .lineWidth(2)
    .stroke("#1e3a8a");

  // ===== PREMIUM FOOTER =====
  const footerY = pageHeight - 65;
  
  // Premium footer accent line
  doc.moveTo(contentX + 80, footerY)
    .lineTo(pageWidth - contentX - 80, footerY)
    .lineWidth(2)
    .stroke("#60a5fa");

  doc.font("Times-Bold")
    .fontSize(16)
    .fillColor("#1e3a8a")
    .text("SkillQuest Academy", contentX, footerY + 12, {
      width: contentWidth,
      align: "center"
    });

  doc.font("Helvetica")
    .fontSize(9)
    .fillColor("#0f766e")
    .text(`Issued ${formatCompactDate(certificate.issuedAt)} • ID ${certificate.certificateId}`, contentX, footerY + 30, {
      width: contentWidth,
      align: "center",
      characterSpacing: 0.5
    });

  doc.end();
}
