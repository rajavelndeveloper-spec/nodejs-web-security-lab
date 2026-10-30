
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_DIR = path.resolve("uploads");

async function readUploadedFile(filename: string) {
  // VULNERABLE: user input is joined directly to the directory
  console.log(UPLOAD_DIR,"UPLOAD_DIR")

  const filePath = path.join(UPLOAD_DIR, filename);
  console.log(filePath,"filePath")

  try {
    const content = await fs.readFile(filePath, "utf8");
    // console.log("File content:", content);
  } catch (error) {
    console.log("Could not read file:", (error as NodeJS.ErrnoException).code);
  }
}

readUploadedFile("../.env");
