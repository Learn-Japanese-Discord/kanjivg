const { parentPort } = require("worker_threads");
const { createConverter } = require("convert-svg-to-png");
const fs = require("fs");
const path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

parentPort.on("message", async ({ targetDirectory, fileSubset }) => {
  const converter = createConverter();

  try {
    for (const file of fileSubset) {
      const filePath = path.join(targetDirectory, file);

      function getRandomColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

      let svgContent = fs.readFileSync(filePath, "utf-8");

      svgContent = svgContent.replace(/<!DOCTYPE[\s\S]*?\]>/, "");

      const dom = new JSDOM(svgContent);
      const document = dom.window.document;

      const svgElement = document.querySelector("svg");
      if (!svgElement.hasAttribute("xmlns:kvg")) {
        svgElement.setAttribute("xmlns:kvg", "http://kanjivg.tagaini.net");
      }

      const strokePaths = document.querySelectorAll("[kvg\\:type]");
      const strokeNumbers = document.querySelectorAll(
        `#kvg\\:StrokeNumbers_${file.replace(".svg", "")} text`
      );

      strokePaths.forEach((path, index) => {
        const randomColor = getRandomColor();
        path.setAttribute("stroke", randomColor);

        if (strokeNumbers[index]) {
          strokeNumbers[index].setAttribute("fill", randomColor);
        }
      });

      fs.writeFileSync(filePath, dom.serialize());

      console.log("SVG has been modified and saved to:", filePath);

      const pngFilePath = await converter.convertFile(filePath, {
        height: 400,
        width: 400,
        outputFilePath: `./kanjiPNG/${file.replace("svg", "png")}`,
      });
      parentPort.postMessage(`Converted ${filePath} to ${pngFilePath}`);
    }
  } catch (error) {
    console.error("Error in worker:", error);
  } finally {
    await converter.destroy();
    parentPort.close();
  }
});
