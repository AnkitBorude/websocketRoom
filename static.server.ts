import http from "http";
import fs from "fs";
import path from "path";

const STATIC_FILE_DIR_NAME = "public";

const OCTET_TYPE = "application/octet-stream";

const FILE_EXT_MIME_TYPE_MAP = new Map([
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".css", "text/css"],
  [".json", "application/json"],
  [".png", "image/png"],
  [".jpg", "image/jpg"],
]);

export const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.setHeader("Access-Control-Max-Age", 2592000); // Cache preflight requests for 30 days

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  let resourcePath: string = "";

  if (req.url === "/") {
    resourcePath = path.join(__dirname, STATIC_FILE_DIR_NAME, "index.html");
  } else {
    resourcePath = path.join(
      __dirname,
      req.url ?? STATIC_FILE_DIR_NAME,
      "notfound.html",
    );
  }

  const fileExtension = path.extname(resourcePath);
  const mime_type = FILE_EXT_MIME_TYPE_MAP.get(fileExtension) || OCTET_TYPE;

  const r_stream = fs.createReadStream(resourcePath);
  if (![".png", ".jpg"].includes(fileExtension)) {
    r_stream.setEncoding("utf-8");
  }

  r_stream.on("open", () => {
    res.writeHead(200, { "Content-Type": mime_type });
    r_stream.pipe(res);
  });

  r_stream.on("error", (error) => {
    if (error.message.includes("ENOENT")) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 Not Found</h1>");
    } else {
      res.writeHead(500);
      res.end(`Server Error: ${error.message}`);
    }
  });
});
