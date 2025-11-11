export const runtime = 'nodejs'; 

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prizma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();



  const file = form.get("file");

 
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

 
  const mime = file.type || "";
  if (!(mime && mime.startsWith("image/"))) {
    return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
  }

  const size = file.size ?? 0;
  if (size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max size 2MB" }, { status: 400 });
  }

 
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const upload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "avatars",
          overwrite: true,
          transformation: [
            { width: 512, height: 512, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: upload.url },
    });

    return NextResponse.json({ ok: true, url: upload.url }, { status: 200 });
  } catch (e) {
    console.error("[UPLOAD_AVATAR]", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
