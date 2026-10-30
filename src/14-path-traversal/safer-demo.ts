
import path from "node:path";
import fs from "node:fs/promises";

const UPLOAD_DIR = path.resolve("uploads");

function getSafeFilePath(filename: string): string | null {
  // Step 1: Resolve the complete absolute path
  console.log("UPLOAD_DIR",UPLOAD_DIR)
  const filePath = path.resolve(UPLOAD_DIR, filename);

  console.log("filepath",filePath)

  // Step 2: Find how the destination relates to UPLOAD_DIR
  const relativePath = path.relative(UPLOAD_DIR, filePath);
  console.log("relativePath",relativePath)


  // Step 3: Reject paths that escape the allowed directory
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  // Step 4: The path is inside the allowed directory
  return filePath;
}

async function readUploadedFile(filename: string) {
  const filePath = getSafeFilePath(filename);

  if (filePath === null) {
    console.log("Blocked: file path is outside the allowed directory");
    return;
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    console.log("File content:", content);
  } catch (error) {
    console.log(
      "Could not read file:",
      (error as NodeJS.ErrnoException).code
    );
  }
}

// Test cases
async function main() {
  await readUploadedFile("hello.txt");
  await readUploadedFile("../.env");
  await readUploadedFile("../../secret.txt");
}

main();
