import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";

export default class Scanner extends EventEmitter {

  async scan(directory) {

    this.emit("scan-start", { directory });

    const stats = {
      totalFiles: 0,
      totalSize: 0,
      types: {}
    };

    const walk = async (dir) => {

      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {

        const full = path.join(dir, item.name);

        if (item.isDirectory()) {

          await walk(full);

        } else {

          const s = await fs.stat(full);

          stats.totalFiles++;
          stats.totalSize += s.size;

          const ext = path.extname(item.name) || "other";

          if (!stats.types[ext]) {
            stats.types[ext] = 0;
          }

          stats.types[ext]++;

          this.emit("file-found", full);

        }

      }

    };

    await walk(directory);

    this.emit("scan-complete", stats);

  }

}
