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

const vocab = buildWordVocab([
  "Hello world, this is Raghav's tokenizer.",
  "This tokenizer supports word level tokenization.",
]);
console.log(vocab);
console.log("vocab size:", vocab.tokenToId.size);
console.log("id of 'Ġtokenizer':", vocab.tokenToId.get("Ġtokenizer"));
console.log("token at id 0:", vocab.idToToken.get(0)); // should be <UNK>