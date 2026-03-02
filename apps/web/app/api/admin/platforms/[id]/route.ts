import { db } from "@/lib/db";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    const { is_active } = await req.json();

    const platform = await db.platform.update({
      where: { id: parsedId },
      data: { is_active },
    });

    return NextResponse.json(platform);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id, 10);
    await db.platform.delete({ where: { id: parsedId } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
