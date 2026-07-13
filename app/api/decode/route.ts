import { isValidMode, getTokenizer } from "@/lib/vocab-manager";
import { NextRequest, NextResponse} from "next/server";

export async function POST(req:NextRequest) {
    let body:unknown;
    try {
        body=await req.json();
    } catch (error) {
        return NextResponse.json({error:"Request body must be valid JSON."},{ status: 400 });
    }

    const { ids, mode } = (body ?? {}) as { ids?: unknown; mode?: unknown };

    if(!Array.isArray(ids) || !ids.every((n)=>typeof n==="number" && Number.isInteger(n))){
        return NextResponse.json({ error: "'ids' is required and must be an array of integers." }, { status: 400 });
    }

    if(!isValidMode(mode)){
        return NextResponse.json(
        { error: "'mode' must be one of: 'word', 'char', 'bpe'." },
        { status: 400 }
      );
    }

    const tokenizer = getTokenizer(mode);
    const text = tokenizer.decode(ids);

    return NextResponse.json({ mode, text });
}