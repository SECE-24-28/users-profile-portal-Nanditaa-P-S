import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // convert file to buffer and save it
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // create a unique filename using timestamp
  const filename = Date.now() + "_" + file.name.replace(/\s/g, "_");
  const uploadPath = path.join(process.cwd(), "public", "uploads", filename);

  await writeFile(uploadPath, buffer);

  // return the public URL
  return NextResponse.json({ url: "/uploads/" + filename });
}
