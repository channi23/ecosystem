const fs = require("fs");
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

        res.on("data", chunk => (data += chunk));
        res.on("end", () => {
          const json = JSON.parse(data);

          resolve({
            total: json.total_count,
            topRepo: json.items[0].full_name,
            topStars: json.items[0].stargazers_count
          });
        });
      }
    ).on("error", reject);
  });
}

async function run() {
  const stats = await fetchStats();
  const date = new Date().toISOString().split("T")[0];

  let csv = "";
  if (fs.existsSync(CSV_PATH)) {
    csv = fs.readFileSync(CSV_PATH, "utf-8");
  }

  const lines = csv.split("\n").filter(Boolean);

  // Prevent duplicate entry for same day
  const alreadyExists = lines.some(line => line.startsWith(date));
  if (alreadyExists) {
    console.log("Entry for today already exists. Skipping.");
    return;
  }

  // Default values (for first entry edge case)
  let weeklyChange = 0;
  let newRepos = 0;

  // If we already have at least 1 data row (excluding header)
  if (lines.length > 1) {
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(",");

    const prevCount = parseInt(parts[1], 10);

    weeklyChange = stats.total - prevCount;
    newRepos = weeklyChange; // same metric for now
  }

  // Add header if file empty
  if (lines.length === 0) {
    fs.appendFileSync(
      CSV_PATH,
      "date,repo_count,weekly_change,new_repos,top_repo,top_repo_stars\n"
    );
  }

  const line = `${date},${stats.total},${weeklyChange},${newRepos},${stats.topRepo},${stats.topStars}\n`;

  fs.appendFileSync(CSV_PATH, line);

  console.log("Added new stats row:", line);
}

run();
