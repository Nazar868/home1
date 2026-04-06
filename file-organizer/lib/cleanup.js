import { EventEmitter } from "events";
import fs from "fs/promises";
import path from "path";

export default class Cleanup extends EventEmitter {

  async run(directory, days, confirm) {

    const files = [];

    const walk = async (dir) => {

      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {

        const full = path.join(dir, item.name);

        if (item.isDirectory()) {

          await walk(full);

        } else {

          const stat = await fs.stat(full);

          const age = (Date.now() - stat.mtime.getTime()) / (1000*60*60*24);

          if (age > days) {

            files.push(full);

            this.emit("file-found", full);

            if (confirm) {

              await fs.unlink(full);

              this.emit("file-deleted", full);

            }

          }

        }

      }

    };

    await walk(directory);

    console.log("\nTotal old files:", files.length);

  }

}
