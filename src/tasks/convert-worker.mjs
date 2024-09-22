import * as fs from "node:fs/promises";
import { parentPort, workerData } from "node:worker_threads";

async function pageToImgWorker({
	index,
	dpi,
	format,
	outputPath,
	fileData,
	quality = 100
}) {
	const mupdf = await import("mupdf");

	const document = mupdf.Document.openDocument(fileData, "application/pdf");

	const page = document.loadPage(index - 1);
	const scale = dpi / 72;
	const matrix = mupdf.Matrix.scale(scale, scale);
	const alpha = false;
	const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, alpha);
	const width = pixmap.getWidth();
	const height = pixmap.getHeight();
	const image =
		format === "png" ? pixmap.asPNG() : pixmap.asJPEG(quality, false);

	await fs.writeFile(outputPath, image);

	return {
		width,
		height
	};
}

pageToImgWorker(workerData)
	.then(({ width, height }) => {
		parentPort?.postMessage({ width, height });
	})
	.catch((error) => {
		parentPort?.postMessage(`Error: ${error.message}`);
	});
