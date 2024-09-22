import * as fs from "node:fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { cpus } from "os";
import { Worker } from "worker_threads";
import { PageResult, TaskPayload } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workerFilename = join(__dirname, "convert-worker.mjs");

const showProgress = true;

// ANSI color codes and styles
const green = "\x1b[32m";
const reset = "\x1b[0m";
const hideCursor = "\x1b[?25l";
const showCursor = "\x1b[?25h";

export async function convert({
	convertionId,
	format,
	quality,
	dpi
}: TaskPayload): Promise<PageResult[]> {
	console.log("converting...", convertionId, format, quality, dpi);

	const mupdf = await import("mupdf");

	const pdfFilePath = `/tmp/${convertionId}/file.pdf`;
	const outputDir = `/tmp/${convertionId}/pages`;
	const pagesResults: PageResult[] = [];

	const maxThreads = cpus().length;

	try {
		if (showProgress) process.stdout.write(hideCursor);

		const fileData = await fs.readFile(pdfFilePath);

		const document = mupdf.Document.openDocument(fileData, "application/pdf");
		const count = document.countPages();

		let currentPage = 1;
		let activeWorkers = 0;
		let completedPages = 0;
		const promises = [];

		const updateProgressBar = () => {
			if (!showProgress) return;
			const percentage = (completedPages / count) * 100;
			const filledWidth = Math.round(percentage / 2);
			const emptyWidth = 50 - filledWidth;
			const progressBar = `[${"=".repeat(filledWidth)}${" ".repeat(
				emptyWidth
			)}] ${percentage.toFixed(2)}%`;
			const pageCount = `(${completedPages} of ${count} pages)`;
			process.stdout.write(`\r${green}${progressBar} ${pageCount}${reset}`);
		};

		updateProgressBar();

		const startWorker = (pageIndex: number) => {
			return new Promise((resolve, reject) => {
				const outputPath = `${outputDir}/${pageIndex}.${format}`;

				const worker = new Worker(workerFilename, {
					workerData: {
						index: pageIndex,
						dpi,
						format,
						outputPath,
						fileData,
						quality
					}
				});

				worker.on(
					"message",
					({ width, height }: { width: number; height: number }) => {
						completedPages++;
						pagesResults.push({
							page: pageIndex,
							url: outputPath,
							width,
							height
						});
						updateProgressBar();
						if (completedPages === count) {
							if (showProgress) {
								console.log("\n"); // Move to next line after progress bar
							}
							console.timeEnd("Processing Time");
							if (showProgress) process.stdout.write(showCursor);
						}
						resolve(true);
					}
				);

				worker.on("error", (err) => {
					console.error(`Main thread: Worker error: ${err.message}`);
					reject(err);
				});

				worker.on("exit", (code) => {
					activeWorkers--;
					if (code !== 0) {
						reject(
							new Error(`Main thread: Worker stopped with exit code ${code}`)
						);
					} else {
						if (currentPage <= count) {
							activeWorkers++;
							startWorker(currentPage++).catch(reject);
						}
					}
				});
			});
		};

		while (currentPage <= count && activeWorkers < maxThreads) {
			activeWorkers++;
			promises.push(startWorker(currentPage++));
		}

		await Promise.all(promises).catch((err) =>
			console.error(`Main thread: ${err.message}`)
		);

		return pagesResults.sort((a, b) => a.page - b.page);
	} catch (error) {
		console.error(
			`Main thread: Error processing document: ${
				error instanceof Error ? error.message : error
			}`
		);
		throw error;
	} finally {
		if (showProgress) process.stdout.write(showCursor);
	}
}
