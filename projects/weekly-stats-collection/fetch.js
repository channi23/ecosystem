const fs = require("fs");
const https = require("https");

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

  // read existing CSV
  let csv = "";
  if (fs.existsSync(CSV_PATH)) {
    csv = fs.readFileSync(CSV_PATH, "utf-8");
  }

  // split lines and check if today's date already exists
  const lines = csv.split("\n").filter(Boolean);

  const alreadyExists = lines.some(line => line.startsWith(date));

  if (alreadyExists) {
    console.log("Entry for today already exists. Skipping.");
    return;
  }

  const line = `${date},${count}\n`;

  // if file is empty, add header first
  if (lines.length === 0) {
    fs.appendFileSync(CSV_PATH, "date,repo_count\n");
  }

  fs.appendFileSync(CSV_PATH, line);
}

run();
