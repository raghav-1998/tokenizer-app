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


console.log(preTokenize("Hello, world! This is a test."));