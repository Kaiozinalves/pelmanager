package com.pelmanager.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Base64;

@Service
public class GerarQrCodeService {
    public String gerarQrCode(String chavePixGerente, BigDecimal valor) {
        try {
            String dadosPix = gerarDadosPix(chavePixGerente, valor);

            // criar qr code
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            var bitMatrix = qrCodeWriter.encode(
                    dadosPix,
                    BarcodeFormat.QR_CODE,
                    300,
                    300
            );

            // converter pra png
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();

            // Converter para Base64
            String base64QR = Base64.getEncoder().encodeToString(pngData);
            return "data:image/png;base64," + base64QR;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar QR Code: " + e.getMessage());
        }
    }

    public String gerarDadosPix(String chavePixGerente, BigDecimal valor) {
        if (chavePixGerente == null || chavePixGerente.isBlank()) {
            throw new IllegalArgumentException("Chave Pix não pode ser vazia");
        }
        if (valor == null) {
            throw new IllegalArgumentException("Valor não pode ser nulo");
        }

        String chavePix = normalizarChavePix(chavePixGerente.trim());
        String valorFormatado = valor.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
        String nomeLoja = "Pelmanager";
        String cidade = "Natal";

        String merchantAccountInfo = "00"
                + formatLength("BR.GOV.BCB.PIX")
                + "BR.GOV.BCB.PIX"
                + "01"
                + formatLength(chavePix)
                + chavePix;

        String payload = "000201"
                + "26" + formatLength(merchantAccountInfo) + merchantAccountInfo
                + "52040000"
                + "5303986"
                + "54" + formatLength(valorFormatado) + valorFormatado
                + "5802BR"
                + "59" + formatLength(nomeLoja) + nomeLoja
                + "60" + formatLength(cidade) + cidade
                + "62070503***"
                + "6304";

        String crc = calcularCrc16Ccitt(payload);
        return payload + crc;
    }

    private String normalizarChavePix(String chave) {
        // Se for CPF com pontuação, remove pontos e traço
        if (chave.matches("\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}")) {
            return chave.replaceAll("\\D", "");
        }
        // Se for CNPJ com pontuação, remove pontuação
        if (chave.matches("\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2}")) {
            return chave.replaceAll("\\D", "");
        }
        // Se for telefone formatado, normaliza para +55DDDNUMERO
        if (chave.matches("(\\+55\\s?)?(\\(?\\d{2}\\)?\\s?)\\d{4,5}-?\\d{4}")) {
            String digitos = chave.replaceAll("\\D", "");
            if (digitos.startsWith("55") && (digitos.length() == 12 || digitos.length() == 13)) {
                return "+" + digitos;
            }
            if (digitos.length() == 10 || digitos.length() == 11) {
                return "+55" + digitos;
            }
        }
        return chave;
    }

    private String formatLength(String value) {
        return String.format("%02d", value.length());
    }

    private String calcularCrc16Ccitt(String payload) {
        int crc = 0xFFFF;

        for (int i = 0; i < payload.length(); i++) {
            crc ^= (payload.charAt(i) & 0xFF) << 8;

            for (int bit = 0; bit < 8; bit++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }

        return String.format("%04X", crc);
    }
}
