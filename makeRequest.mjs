import { request } from "node:https";

export function makeRequest(messages, namespace, session_id, onChunk, onComplete) {
  const headers = {
    "X-Library-Key": "d4qgdcs2lgUBvwWDFjC6NeOIrLS87cpoDHlwPL5a",
  };

  const options = {
    hostname: "api.ailibrary.ai",
    path: `/v1/agent/${namespace}/chat`,
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  };

  const req = request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      const reader = new Response(data).body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let result = "";

        const processChunk = ({ done, value }) => {
          if (done) {
            onComplete();
            console.log("Response:", result);
            return;
          }

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const jsonStrings = chunk.split("\n");

            jsonStrings.forEach((jsonString) => {
              if (jsonString.trim() !== "") {
                try {
                  const parsed = JSON.parse(jsonString);
                  if (parsed.object === "chat.completion.chunk") {
                    result += parsed.content;
                    onChunk(parsed.content);
                  } else if (parsed.object === "chat.completion.latency") {
                    console.log("Latency:", parsed.content);
                  } else if (parsed.object === "chat.completion.knowledge") {
                    // console.log("Knowledge:", parsed.content);
                  }
                } catch (error) {
                  console.error("Error parsing chunk:", error);
                }
              }
            });
          }

          reader.read().then(processChunk);
        };

        reader.read().then(processChunk);
      }
    });
  });

  req.on("error", (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(
    JSON.stringify({
      stream: "true",
      session_id: session_id,
      messages: messages,
    })
  );
  req.end();
}