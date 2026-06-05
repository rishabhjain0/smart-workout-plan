const fs = require("fs");
const path = require("path");
const https = require("https");

const workouts = JSON.parse(
  fs.readFileSync("workouts.json", "utf8")
);

const imagesDir = path.join(__dirname, "images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);

    https.get(url, (response) => {
      response.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const updatedWorkouts = [];

  for (const workout of workouts) {
    const filename =
      slugify(workout.exerciseName) + ".jpg";

    const localPath =
      "images/" + filename;

    const fullPath =
      path.join(imagesDir, filename);

    try {
      console.log(
        `Downloading ${workout.exerciseName}`
      );

      await downloadImage(
        workout.imageUrl,
        fullPath
      );

      updatedWorkouts.push({
        ...workout,
        imageUrl: localPath,
      });

      console.log(`✓ ${filename}`);
    } catch (err) {
      console.error(
        `✗ Failed: ${workout.exerciseName}`
      );
    }
  }

  fs.writeFileSync(
    "local-workouts.json",
    JSON.stringify(updatedWorkouts, null, 2)
  );

  console.log(
    "\nDone. Generated local-workouts.json"
  );
}

main();