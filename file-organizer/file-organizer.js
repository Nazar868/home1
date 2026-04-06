import Scanner from './lib/scanner.js';
import DuplicateFinder from './lib/duplicates.js';
import Organizer from './lib/organizer.js';
import Cleanup from './lib/cleanup.js';

const args = process.argv.slice(2);

const command = args[0];
const directory = args[1];

if (!command) {
  console.log("Usage: node file-organizer.js <command> <directory>");
  process.exit(1);
}

try {

  switch (command) {

    case "scan": {

      const scanner = new Scanner();

      scanner.on("scan-start", ({ directory }) => {
        console.log(`📂 Scanning: ${directory}`);
      });

      scanner.on("file-found", () => {
        process.stdout.write(".");
      });

      scanner.on("scan-complete", (stats) => {
        console.log("\n\n📊 Scan Results");
        console.log("Total files:", stats.totalFiles);
        console.log("Total size:", stats.totalSize);
        console.log("Types:", stats.types);
      });

      await scanner.scan(directory);
      break;
    }

    case "duplicates": {

      const finder = new DuplicateFinder();

      finder.on("file-processed", () => process.stdout.write("."));

      finder.on("duplicates-found", (groups) => {

        console.log("\n\n🔍 Duplicate Groups:");

        for (const [hash, files] of groups) {

          console.log("\nHash:", hash);

          files.forEach(f => console.log(" ", f));

        }

      });

      await finder.find(directory);
      break;
    }

    case "organize": {

      const outputIndex = args.indexOf("--output");
      const outputDir = args[outputIndex + 1];

      const organizer = new Organizer();

      organizer.on("copy-start", file => console.log("Copy:", file));
      organizer.on("copy-complete", file => console.log("✓", file));

      await organizer.organize(directory, outputDir);

      console.log("✅ Done organizing");

      break;
    }

    case "cleanup": {

      const daysIndex = args.indexOf("--older-than");
      const days = Number(args[daysIndex + 1]);

      const confirm = args.includes("--confirm");

      const cleanup = new Cleanup();

      cleanup.on("file-found", f => console.log("Old:", f));
      cleanup.on("file-deleted", f => console.log("Deleted:", f));

      await cleanup.run(directory, days, confirm);

      break;
    }

    default:
      console.log("Unknown command");

  }

} catch (error) {

  if (error.code === "ENOENT") {
    console.error("❌ Directory not found");
  } else if (error.code === "EACCES") {
    console.error("❌ Permission denied");
  } else {
    console.error("❌ Error:", error.message);
  }

  process.exit(1);

}
