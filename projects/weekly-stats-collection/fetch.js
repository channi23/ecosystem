const fs = require("fs");
cconst fs = require("fs");
const https = require("https");

const CSV_PATH = "./projects/weekly-stats-collection/weekly_stats.csv";

function fetchStats() {
  return new Promise((resolve, reject) => {
    https.get(
      "https://api.github.com/search/repositories?q=topic:json-schema&sort=stars&order=desc&per_page=1",
      {
        headers: {
          "User-Agent": "json-schema-stats-script",
          "Accept": "application/vnd.github+json",
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);

            resolve({
              total: json.total_count,
              topRepo: json.items[0]?.full_name || "",
              topStars: json.items[0]?.stargazers_count || 0,
            });
          } catch (err) {
            reject(err);
          }
        });
      }
    ).on("error", reject);
  });
}

async function run() {
  const stats = await fetchStats();
  const date = new Date().toISOString().split("T")[0];

  // read existing CSV
  let csv = "";
  if (fs.existsSync(CSV_PATH)) {
    csv = fs.readFileSync(CSV_PATH, "utf-8");
  }

  const lines = csv.split("\n").filter(Boolean);

  // check duplicate date
  const alreadyExists = lines.some((line) => line.startsWith(date));

  if (alreadyExists) {
    console.log("Entry for today already exists. Skipping.");
    return;
  }

  // find last week's count for delta calculation
  let lastCount = null;
  if (lines.length > 1) {
    const lastRow = lines[lines.length - 1].split(",");
    lastCount = parseInt(lastRow[1], 10);
  }

  const weeklyChange = lastCount !== null ? stats.total - lastCount : 0;
  const newRepos = weeklyChange; // simple assumption

  // prepare line
  const line = `${date},${stats.total},${weeklyChange},${newRepos},${stats.topRepo},${stats.topStars}\n`;

  // add header if empty
  if (lines.length === 0) {
    fs.appendFileSync(
      CSV_PATH,
      "date,repo_count,weekly_change,new_repos,top_repo,top_repo_stars\n"
    );
  }

  fs.appendFileSync(CSV_PATH, line);

  console.log("Added new weekly stats entry:", line.trim());
}

run();
