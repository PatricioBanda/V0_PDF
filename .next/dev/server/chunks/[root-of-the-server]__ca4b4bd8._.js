module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/rh/join/base/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.3_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pdf$2d$lib$40$1$2e$17$2e$1$2f$node_modules$2f$pdf$2d$lib$2f$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pdf$2d$lib$40$1$2e$17$2e$1$2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pdf-lib@1.17.1/node_modules/pdf-lib/es/api/index.js [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        console.log('[v0] API: Join request received');
        const body = await request.json();
        const { year, months, files } = body;
        if (!year || !months || months.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Year and months are required'
            }, {
                status: 400
            });
        }
        console.log('[v0] API: Processing', files?.length || 0, 'files');
        const mergedPdf = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pdf$2d$lib$40$1$2e$17$2e$1$2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PDFDocument"].create();
        if (files && files.length > 0) {
            for(let i = 0; i < files.length; i++){
                const file = files[i];
                console.log(`[v0] API: Processing file ${i + 1}/${files.length}:`, file.name);
                try {
                    // Convert base64 back to binary
                    const binaryString = atob(file.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for(let j = 0; j < binaryString.length; j++){
                        bytes[j] = binaryString.charCodeAt(j);
                    }
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext === 'pdf') {
                        console.log('[v0] API: Loading PDF:', file.name);
                        const existingPdf = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pdf$2d$lib$40$1$2e$17$2e$1$2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PDFDocument"].load(bytes);
                        const pages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
                        // Add all pages preserving their original orientation
                        for (const page of pages){
                            mergedPdf.addPage(page);
                        }
                        console.log('[v0] API: Added', pages.length, 'pages from', file.name);
                    } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
                        console.log('[v0] API: Converting image to PDF:', file.name);
                        let image;
                        if (ext === 'jpg' || ext === 'jpeg') {
                            image = await mergedPdf.embedJpg(bytes);
                        } else {
                            image = await mergedPdf.embedPng(bytes);
                        }
                        // Get image dimensions
                        const imgWidth = image.width;
                        const imgHeight = image.height;
                        // Determine page orientation based on image dimensions
                        const isLandscape = imgWidth > imgHeight;
                        // Standard A4 dimensions in points (72 points per inch)
                        const A4_WIDTH = 595.28;
                        const A4_HEIGHT = 841.89;
                        let pageWidth, pageHeight;
                        if (isLandscape) {
                            pageWidth = A4_HEIGHT;
                            pageHeight = A4_WIDTH;
                        } else {
                            pageWidth = A4_WIDTH;
                            pageHeight = A4_HEIGHT;
                        }
                        // Create page with correct orientation
                        const page = mergedPdf.addPage([
                            pageWidth,
                            pageHeight
                        ]);
                        // Calculate scaling to fit image on page while maintaining aspect ratio
                        const scaleX = pageWidth / imgWidth;
                        const scaleY = pageHeight / imgHeight;
                        const scale = Math.min(scaleX, scaleY) * 0.95 // 95% to add small margin
                        ;
                        const scaledWidth = imgWidth * scale;
                        const scaledHeight = imgHeight * scale;
                        // Center the image on the page
                        const x = (pageWidth - scaledWidth) / 2;
                        const y = (pageHeight - scaledHeight) / 2;
                        page.drawImage(image, {
                            x,
                            y,
                            width: scaledWidth,
                            height: scaledHeight
                        });
                        console.log('[v0] API: Image converted to PDF page with', isLandscape ? 'landscape' : 'portrait', 'orientation');
                    }
                } catch (error) {
                    console.error('[v0] API: Error processing file:', file.name, error);
                    throw new Error(`Erro ao processar ${file.name}: ${error.message}`);
                }
            }
        }
        console.log('[v0] API: Finalizing merged PDF with', mergedPdf.getPageCount(), 'pages');
        // Serialize the PDF
        const pdfBytes = await mergedPdf.save();
        const filename = months.length === 1 ? `base_${months[0]}.pdf` : `base_${months[0]}_to_${months[months.length - 1]}.pdf`;
        console.log('[v0] API: Sending PDF:', filename);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error('[v0] API: Error joining PDFs:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$3_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: `Failed to join PDFs: ${error.message}`
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ca4b4bd8._.js.map