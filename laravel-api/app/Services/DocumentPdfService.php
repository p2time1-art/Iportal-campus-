<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class DocumentPdfService
{
    /**
     * Generate a short cryptographic verification code for anti-forgery protection.
     */
    public static function generateVerificationCode(string $docType, string|int $entityId, string $reference, string|float $extra = ''): string
    {
        $secret = config('app.key', 'iportal-campus-secret-key');
        $payload = strtoupper($docType) . '|' . $entityId . '|' . $reference . '|' . $extra;
        $mac = strtoupper(substr(hash_hmac('sha256', $payload, $secret), 0, 12));

        return sprintf('IPC-%s-%s', strtoupper(substr($docType, 0, 3)), $mac);
    }

    /**
     * Verify a document's cryptographic verification code.
     */
    public static function verifyCode(string $code, string $docType, string|int $entityId, string $reference, string|float $extra = ''): bool
    {
        $expected = self::generateVerificationCode($docType, $entityId, $reference, $extra);
        return hash_equals($expected, strtoupper(trim($code)));
    }

    /**
     * Generate a deterministic, high-contrast SVG 2D QR-style verification matrix
     * encoded as a base64 data URI that Dompdf renders natively via php-svg-lib
     * without requiring external network calls or native C extensions.
     */
    public static function generateQrSvgDataUri(string $data, int $size = 96, string $fgColor = '#0f172a'): string
    {
        $gridSize = 21; // Standard Version 1 QR dimension (21x21 modules)
        $matrix = array_fill(0, $gridSize, array_fill(0, $gridSize, false));
        $reserved = array_fill(0, $gridSize, array_fill(0, $gridSize, false));

        // Helper to place 7x7 finder patterns at (0,0), (14,0), (0,14)
        $placeFinder = function (int $rowOffset, int $colOffset) use (&$matrix, &$reserved) {
            for ($r = -1; $r <= 7; $r++) {
                for ($c = -1; $c <= 7; $c++) {
                    $rr = $rowOffset + $r;
                    $cc = $colOffset + $c;
                    if ($rr >= 0 && $rr < 21 && $cc >= 0 && $cc < 21) {
                        $reserved[$rr][$cc] = true;
                        if ($r >= 0 && $r <= 6 && $c >= 0 && $c <= 6) {
                            $isBorder = ($r === 0 || $r === 6 || $c === 0 || $c === 6);
                            $isInner = ($r >= 2 && $r <= 4 && $c >= 2 && $c <= 4);
                            $matrix[$rr][$cc] = ($isBorder || $isInner);
                        } else {
                            $matrix[$rr][$cc] = false;
                        }
                    }
                }
            }
        };

        $placeFinder(0, 0);
        $placeFinder(0, $gridSize - 7);
        $placeFinder($gridSize - 7, 0);

        // Timing patterns on row 6 and col 6
        for ($i = 8; $i < $gridSize - 8; $i++) {
            $reserved[6][$i] = true;
            $matrix[6][$i] = ($i % 2 === 0);
            $reserved[$i][6] = true;
            $matrix[$i][6] = ($i % 2 === 0);
        }

        // Deterministic bit stream from SHA-256 of payload data
        $hashBytes = array_values(unpack('C*', hash('sha256', $data, true)) ?: []);
        $hashBytes2 = array_values(unpack('C*', hash('sha256', 'salt:' . $data, true)) ?: []);
        $allBytes = array_merge($hashBytes, $hashBytes2);
        $bitIndex = 0;
        $totalBits = count($allBytes) * 8;

        for ($r = 0; $r < $gridSize; $r++) {
            for ($c = 0; $c < $gridSize; $c++) {
                if ($reserved[$r][$c]) {
                    continue;
                }
                $byteIdx = intdiv($bitIndex % $totalBits, 8);
                $bitOffset = 7 - (($bitIndex % $totalBits) % 8);
                $matrix[$r][$c] = (($allBytes[$byteIdx] >> $bitOffset) & 1) === 1;
                $bitIndex++;
            }
        }

        $quietZone = 2;
        $totalModules = $gridSize + ($quietZone * 2);
        $rects = [];

        for ($r = 0; $r < $gridSize; $r++) {
            for ($c = 0; $c < $gridSize; $c++) {
                if ($matrix[$r][$c]) {
                    $x = $c + $quietZone;
                    $y = $r + $quietZone;
                    $rects[] = "<rect x=\"{$x}\" y=\"{$y}\" width=\"1\" height=\"1\" fill=\"{$fgColor}\"/>";
                }
            }
        }

        $rectsSvg = implode('', $rects);
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {$totalModules} {$totalModules}" width="{$size}" height="{$size}" shape-rendering="crispEdges">
  <rect width="{$totalModules}" height="{$totalModules}" fill="#ffffff"/>
  {$rectsSvg}
</svg>
SVG;

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Generate a clean SVG Principal Digital Signature graphic as a base64 data URI.
     */
    public static function generatePrincipalSignatureDataUri(string $principalName = 'Principal', string $color = '#1e3a8a'): string
    {
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 55" width="160" height="40">
  <path d="M12,38 C28,12 36,44 52,22 C64,6 70,39 88,26 C104,14 112,36 130,24 C148,12 162,32 198,18" fill="none" stroke="{$color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M26,44 C68,38 124,36 184,41" fill="none" stroke="{$color}" stroke-width="1.1" stroke-opacity="0.65" stroke-linecap="round"/>
</svg>
SVG;

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Render a Blade view into a downloadable or inline PDF response using Dompdf.
     */
    public static function renderPdfResponse(
        string $view,
        array $data,
        string $filename,
        string $paper = 'a4',
        string $orientation = 'portrait',
        bool $download = true
    ): Response {
        $pdf = Pdf::loadView($view, $data)
            ->setPaper($paper, $orientation)
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('defaultFont', 'Helvetica');

        return $download ? $pdf->download($filename) : $pdf->stream($filename);
    }

    /**
     * Render a Blade view into raw PDF binary bytes (useful for base64 RPC responses or tests).
     */
    public static function renderPdfBytes(
        string $view,
        array $data,
        string $paper = 'a4',
        string $orientation = 'portrait'
    ): string {
        $pdf = Pdf::loadView($view, $data)
            ->setPaper($paper, $orientation)
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('defaultFont', 'Helvetica');

        return $pdf->output();
    }
}
