import { EventEmitter } from "events";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { pipeline } from "stream/promises";

const categories = {
  Documents: [".pdf",".doc",".docx",".txt",".xlsx",".pptx",".md"],
  Images: [".png",".jpg",".jpeg",".gif",".svg",".webp"],
  Archives: [".zip",".rar",".7z",".tar",".gz"],
  Code: [".js",".py",".java",".cpp",".html",".css",".json"],
  Videos: [".mp4",".mkv",".avi",".mov",".webm"]
};

export default class Organizer extends EventEmitter {

  getCategory(ext) {

    for (const [cat, list] of Object.entries(categories)) {
      if (list.includes(ext)) return cat;
    }

    return "Other";

  }

  async copy(src, dest) {

    const stat = await fs.stat(src);

    if (stat.size < 10 * 1024 * 1024) {

      await fs.copyFile(src, dest);

    } else {

      await pipeline(
        fsSync.createReadStream(src),
        fsSync.createWriteStream(dest)
      );

    }

  }

  async organize(source, target) {

    const items = await fs.readdir(source);

    for (const file of items) {

      const src = path.join(source, file);
      const stat = await fs.stat(src);

      if (stat.isDirectory()) continue;

      const ext = path.extname(file);

      const category = this.getCategory(ext);

      const folder = path.join(target, category);

      await fs.mkdir(folder, { recursive: true });

      const dest = path.join(folder, file);

      this.emit("copy-start", file);

      await this.copy(src, dest);

      this.emit("copy-complete", file);

    }

  }

}
