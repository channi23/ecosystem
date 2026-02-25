import fs from "fs";
import https from "https";

const CSV_PATH = "./projects/weekly-stats-collection/weekly_stats.csv";

function fetchRepoCount() {
  return new Promise((resolve, reject) => {
    https.get(
      "https://api.github.com/search/repositories?q=topic:json-schema&per_page=1",
      {
        headers: {
          "User-Agent": "json-schema-stats-script",
          "Accept": "application/vnd.github+json",
        },
      },
      (res) => {
        let data = "";

        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          const json = JSON.parse(data);
          resolve(json.total_count);
        });
      }
    ).on("error", reject);
  });
}

async function run() {
  const count = await fetchRepoCount();
  const date = new Date().toISOString().split("T")[0];

  const line = `${date},${count}\n`;
  fs.appendFileSync(CSV_PATH, line);
}

run();
