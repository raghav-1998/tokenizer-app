import { isValidMode , getTokenizer} from "@/lib/vocab-manager";
import { NextRequest, NextResponse} from "next/server";

export async function POST(req:NextRequest){
    let body:unknown;
    try {
        body=await req.json();
    } catch (error) {
        return NextResponse.json({error:"Request body must be valid JSON."},{ status: 400 });
    }

    const {text, mode}=(body??{})as{text?:unknown;mode?:unknown};

    if(typeof text!=="string"){
        return NextResponse.json({ error: "'text' is required and must be a string." }, { status: 400 });
    }

    if(!isValidMode(mode)){
        return NextResponse.json({
            error: "'mode' must be one of: 'word', 'char', 'bpe'." 
        },{status: 400}); 
    }

    const tokenizer=getTokenizer(mode);
    const {tokens, ids}=tokenizer.encode(text)

    return NextResponse.json({
        mode,
        tokens,
        ids,
        tokenCount:tokens.length,
        vocabSize:tokenizer.vocabSize()
    });
}