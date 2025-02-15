import { createServer } from "node:http";
import { makeRequest } from "./chatStreaming.mjs";
import { parse } from "node:url";

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Welcome to the AI Library NodeJS Cookbook!\n");
  } else if (req.method === "POST") {
    // Extract the namespace from the URL
    let namespace = "";
    const parsedUrl = parse(req.url, true);
    const match = parsedUrl.pathname.match(/^\/([^\/]+)\/chat$/);
    if (match) {
      namespace = match[1];
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const { messages, session_id } = JSON.parse(body);
      res.writeHead(200, { "Content-Type": "text/plain" });
      makeRequest(
        messages,
        namespace,
        session_id,
        (chunk) => {
          res.write(chunk);
        },
        () => {
          res.end();
        }
      );
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found\n");
  }
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});