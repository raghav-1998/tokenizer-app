export const SPACE_MARKER= "Ġ"; 

export const SPECIAL_TOKENS = {
  UNK: "<UNK>",
  PAD: "<PAD>",
  BOS: "<BOS>",
  EOS: "<EOS>",
} as const;

export interface Vocab{
    tokenToId: Map<string, number>;
    idToToken: Map<number, string>;
}


function preTokenize(text:string): string[]{
    const raw=text.match(/\s*[A-Za-z0-9]+|\s*[^\sA-Za-z0-9]/g)??[];
    return raw.map((chunk)=>{
        const hasleadingSpace=chunk.startsWith(" ");
        // const hasLeadingSpace = /^\s/.test(chunk);
        const clean=chunk.trimStart();
        return hasleadingSpace ? SPACE_MARKER + clean : clean;
    })
}

export function buildWordVocab(corpus:string[]):Vocab{
    const tokenToId=new Map<string,number>();

    let id=0
    for (const special of Object.values(SPECIAL_TOKENS)){
        tokenToId.set(special,id++);
    }

    for(const text of corpus){
        const tokens=preTokenize(text);
        for(const token of tokens){
            if(!tokenToId.has(token)){
                tokenToId.set(token,id++);
            }
        }
    }

    const idToToken = new Map<number, string>();
    tokenToId.forEach((v, k) => idToToken.set(v, k));
    return { tokenToId, idToToken };

}

// console.log(preTokenize("Hello, world! This is a test."));
// console.log(preTokenize("Hello      world! This is a test."));

export function buildCharVocab(corpus:string[]):Vocab{
    const tokenToId=new Map<string, number>();
    let id=0;
    for(const special of Object.values(SPECIAL_TOKENS)){
        tokenToId.set(special,id++);
    }
    for(const text of corpus){
        const preTokenizedText=preTokenize(text);
        for(const chunk of preTokenizedText){
            let startIdx=0;

            if(chunk.startsWith(SPACE_MARKER)){
                if(!tokenToId.has(SPACE_MARKER)){
                    tokenToId.set(SPACE_MARKER,id++)
                }
                startIdx=SPACE_MARKER.length;
            }

            for(let i=startIdx;i<chunk.length;i++){
                const ch=chunk[i];
                if(!tokenToId.has(ch)){
                    tokenToId.set(ch,id++)
                }
            }
        }
    }

    const idToToken = new Map<number, string>();
    tokenToId.forEach((v, k) => idToToken.set(v, k));
    return { tokenToId, idToToken };
}

const vocab = buildWordVocab([
  "Hello world, this is Raghav's tokenizer.",
  "This tokenizer supports word level tokenization.",
]);


export class Tokenizer{
    encode(text: string){
        const tokens=preTokenize(text);
        const unk=vocab.tokenToId.get(SPECIAL_TOKENS.UNK)!;
        const ids=tokens.map((token)=>vocab.tokenToId.get(token)??unk);
        return {tokens, ids};
    }

    decode(ids:number[]):string{
        const pieces: string[] = [];
        for(const id of ids){
            const tok=vocab.idToToken.get(id)??SPECIAL_TOKENS.UNK
            if(Object.values(SPECIAL_TOKENS).some((val)=>val===tok))continue;
            pieces.push(tok);
        }
        //console.log("pieces:", pieces);
        let out="";
        for(const p of pieces){
            //console.log("processing piece:", p);
            if (p === SPACE_MARKER) {
                out+= " ";
            }
            else if(p.startsWith(SPACE_MARKER)){
                out+= " " + p.slice(SPACE_MARKER.length);
            }
            else{
                out+=p;
            }
            //console.log("out:", out);
        }
        //console.log("out:", out);
        return out;
    }
}

// const tokenizer=new Tokenizer();
// const text = "Hello world, this is Raghav's tokenizer.";
// const { tokens, ids } = tokenizer.encode(text);
// console.log("Tokens:", tokens);
// console.log("Token IDs:", ids);
// console.log("decoded:", tokenizer.decode(ids));
// console.log("exact match:", tokenizer.decode(ids) === text);
// console.log(vocab);
// console.log("vocab size:", vocab.tokenToId.size);
// console.log("id of 'Ġtokenizer':", vocab.tokenToId.get("Ġtokenizer"));
// console.log("token at id 0:", vocab.idToToken.get(0)); // should be <UNK>

const charVocab = buildCharVocab([
  "Hello world, this is Raghav's tokenizer.",
]);
console.log("char vocab size:", charVocab.tokenToId.size);
console.log("is 'Ġ' its own token?", charVocab.tokenToId.has(SPACE_MARKER));
console.log("is 'w' its own token?", charVocab.tokenToId.has("w"));
console.log("is 'Ġw' a token? (should be false)", charVocab.tokenToId.has("Ġw"));