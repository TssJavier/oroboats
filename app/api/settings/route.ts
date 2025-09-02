import { type NextRequest, NextResponse } from "next/server"
import { getSetting, updateSetting, getAllSettings } from "@/lib/db/queries"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (key) {
      const setting = await getSetting(key);
      return NextResponse.json(setting);
    }
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching setting:", error);
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { key, value, description } = await request.json()
    await updateSetting(key, value, description)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}
