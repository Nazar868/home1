import { EventEmitter } from "events";
import fs from "fs";
import crypto from "crypto";
import path from "path";

export default class DuplicateFinder extends EventEmitter {

  async hash(file) {

    return new Promise((resolve, reject) => {

      const hash = crypto.createHash("sha256");

      const stream = fs.createReadStream(file);

      stream.on("data", chunk => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);

    });

  }

  async find(directory) {

    const files = [];

    const walk = async (dir) => {

      const items = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const item of items) {

        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
          await walk(full);
        } else {
          files.push(full);
        }

      }

    };

    await walk(directory);

    const map = new Map();

    for (const file of files) {

      const hash = await this.hash(file);

      if (!map.has(hash)) map.set(hash, []);

      map.get(hash).push(file);

      this.emit("file-processed", file);

    }

    const duplicates = [...map.entries()].filter(([_, arr]) => arr.length > 1);

    this.emit("duplicates-found", duplicates);

  }

}
