
import axios from "axios";

export function makeRequest(messages, namespace, session_id, onChunk, onComplete) {
  const headers = {
    "X-Library-Key": "d4qgdcs2lgUBvwWDFjC6NeOIrLS87cpoDHlwPL5a",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // Add CORS header
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT", // Add allowed methods
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization" // Add allowed headers
  };

  const options = {
    method: "POST",
    url: `https://api.ailibrary.ai/v1/agent/${namespace}/chat`,
    headers: headers,
    data: {
      stream: "true",
      session_id: session_id,
      messages: messages,
    },
    responseType: "stream",
  };

  axios(options)
    .then((response) => {
      const reader = response.data.getReader();
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
    })
    .catch((error) => {
      console.error(`Problem with request: ${error.message}`);
    });
}