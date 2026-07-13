import { getTokenizer, isValidMode } from "@/lib/vocab-manager";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req:NextRequest) {
    const mode=await req.nextUrl.searchParams.get("mode");

    if(!isValidMode(mode)){
        return NextResponse.json(
            {error:"Query param 'mode' must be one of: 'word', 'char', 'bpe'."},
            {status:400}
        );
    }

    const tokenizer=getTokenizer(mode);
    const vocab=tokenizer.getVocab();
    const sample=[...vocab.tokenToId.entries()].slice(0,40).map(([token, id])=>({token,id}));

    return NextResponse.json({mode, vocabSize:tokenizer.vocabSize(), sample});
}