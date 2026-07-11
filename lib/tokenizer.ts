export type TokenizerMode = "word" | "char"

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


export interface BPEVocab extends Vocab {
  merges: [string, string][]; // ordered list of merge rules, applied in this order at encode time
//   protectedWords: Set<string>; // lowercase whole words that are NEVER split into subwords
}

export const DEFAULT_PROTECTED_WORDS = [
  "hi", "hello", "hey", "yes", "no", "ok", "okay", "thanks", "thank", "please",
  "bye", "goodbye", "the", "is", "are", "am", "was", "were", "a", "an", "and",
  "or", "but", "not", "this", "that", "i", "you", "he", "she", "it", "we", "they",
];

function isProtectedWord(word: string, protectedSet: Set<string>): boolean {
  const bare = word.startsWith(SPACE_MARKER) ? word.slice(SPACE_MARKER.length) : word;
  return protectedSet.has(bare.toLowerCase());
}

export function buildInitialState(corpus: string[], protectedSet:Set<string>){
    const wordFreq=new Map<string, number>();

    for(const text of corpus){
        const tokens=preTokenize(text);
        for(const chunk of tokens){
            wordFreq.set(chunk,(wordFreq.get(chunk)??0)+1)
        }
    }

    const splits=new Map<string, string[]>();
    for(const word of wordFreq.keys()){
        // if(word.startsWith(SPACE_MARKER)){
        //     splits.set(word,[SPACE_MARKER,...word.slice(SPACE_MARKER.length).split("")])
        // }
        // else{
        //     splits.set(word,word.split(""))
        // }
        if(isProtectedWord(word, protectedSet)){
            splits.set(word,[word]);
        }
        else if(word.startsWith(SPACE_MARKER)){
            splits.set(word,[SPACE_MARKER,...word.slice(SPACE_MARKER.length).split("")])
        }
        else{
            splits.set(word,word.split(""));
        }
    }

    return {wordFreq, splits};
}

function countPairs(splits: Map<string, string[]>, wordFreq: Map<string, number>): Map<string, number> {
    const pairCounts = new Map<string, number>();
    for(const [word, symbols] of splits){
        const freq=wordFreq.get(word)!;
        for(let i=0;i<symbols.length-1;i++){
            const pairKey=symbols[i]+"\u0000"+symbols[i+1];
            pairCounts.set(pairKey, (pairCounts.get(pairKey)??0)+freq)
        }
    }
    return pairCounts;
}

function findBestPair(pairCounts: Map<string, number>): [string, string] | null {
    if(pairCounts.size===0)return null;
    let bestPair="";
    let bestCount=-1;

    for(const [pair, count] of pairCounts){
        if(count>bestCount){
            bestCount=count;
            bestPair=pair;
        }
    }
    const [first, second] = bestPair.split("\u0000");
    return [first, second];
}

function applyMerge(splits:Map<string, string[]>, pair:[string, string]){    
    for(const [word, symbols] of splits){
        const merged:string[]=[];
        let i=0;
        while(i<symbols.length){
            if(i<symbols.length-1 && symbols[i]===pair[0] && symbols[i+1]===pair[1]){
                merged.push(pair[0]+pair[1]);
                i+=2;
            }
            else{
                merged.push(symbols[i]);
                i+=1
            }
        }
        splits.set(word, merged);
    }
}

function learnMerges(splits: Map<string, string[]>, wordFreq: Map<string, number>, numMerges: number): [string, string][] {
  const merges: [string, string][] = [];

  for (let step = 0; step < numMerges; step++) {
    const pairCounts = countPairs(splits, wordFreq);
    const best = findBestPair(pairCounts);
    if (best === null) break;        // nothing left to merge — stop early

    merges.push(best);
    applyMerge(splits, best);
  }

  return merges;
}

function buildFinalVocab(splits: Map<string, string[]>, originalCorpusChunks:string[]): Vocab {
    // console.log(splits);
    // console.log(originalCorpusChunks);
    const tokenToId = new Map<string, number>();
    let id = 0;

        // 1. Specials first, always.
    for (const special of Object.values(SPECIAL_TOKENS)) tokenToId.set(special, id++);

    // 2. Base character fallback layer — from the ORIGINAL, unmerged chunks.
    //    This guarantees every character seen during training gets a real id,
    //    even if merging later absorbed it into a bigger symbol everywhere.
    for (const chunk of originalCorpusChunks) {
        const chars = chunk.startsWith(SPACE_MARKER)
        ? [SPACE_MARKER, ...chunk.slice(SPACE_MARKER.length).split("")]
        : chunk.split("");
        for (const ch of chars) if (!tokenToId.has(ch)) tokenToId.set(ch, id++);
    }

    // 3. Merged symbols from the final converged splits.
    for (const symbols of splits.values()) {
        for (const s of symbols) if (!tokenToId.has(s)) tokenToId.set(s, id++);
    }

    // 4. Reverse map.
    const idToToken = new Map<number, string>();
    tokenToId.forEach((v, k) => idToToken.set(v, k));

    // console.log(tokenToId);
    // console.log(idToToken);

    return { tokenToId, idToToken }
    
}
export function buildBPEVocab(corpus:string[], numMerges:number=100):BPEVocab{
    const{wordFreq, splits}=buildInitialState(corpus);
    // console.log("wordFreq:", [...wordFreq.entries()]);
    // console.log("initial splits:");
    // console.log(splits);
    const merges=learnMerges(splits, wordFreq, numMerges)
    // console.log("learned merges, in order:", merges);
    const vocab=buildFinalVocab(splits, [...wordFreq.keys()]);
    return {...vocab, merges};
}

function applyBPE(word:string, merges:[string,string][], protectedSet:Set<string>):string[]{
    if(isProtectedWord(word, protectedSet)){
        return [word];
    }
    let symbols=word.startsWith(SPACE_MARKER)
         ?[SPACE_MARKER, ...word.slice(SPACE_MARKER.length).split("")]
         :word.split("");
    for (const [a, b] of merges) {
    const merged: string[] = [];
    let i = 0;
    while (i < symbols.length) {
      if (i < symbols.length - 1 && symbols[i] === a && symbols[i + 1] === b) {
        merged.push(a + b);
        i += 2;
      } else {
        merged.push(symbols[i]);
        i += 1;
      }
    }
    symbols = merged;
  }
  return symbols;
}

export class Tokenizer{
    constructor(private mode:TokenizerMode, private vocab:Vocab){}
    encode(text: string){
        const tokens:string[] = [];
        const unkId = this.vocab.tokenToId.get(SPECIAL_TOKENS.UNK)!;

        if(this.mode=="word"){
            tokens.push(...preTokenize(text))
        }
        // const tokens=preTokenize(text);
        // const unk=vocab.tokenToId.get(SPECIAL_TOKENS.UNK)!;
        
        else if(this.mode=="char"){
            const preTokenizedText=preTokenize(text);
            for(const chunk of preTokenizedText){
                // let startIdx=0;
                // if(chunk.startsWith(SPACE_MARKER)){
                //     tokens.push(SPACE_MARKER);
                //     startIdx=SPACE_MARKER.length;
                // }

                // for(let i=startIdx;i<chunk.length;i++){

                // }
                if (chunk.startsWith(SPACE_MARKER)) {
                    tokens.push(SPACE_MARKER, ...chunk.slice(SPACE_MARKER.length).split(""));
                } else {
                    tokens.push(...chunk.split(""));
                }
            }
        }else{
            const{merges}=this.vocab as BPEVocab
            const preTokenizedText=preTokenize(text);
            for(const chunk of preTokenizedText){
                tokens.push(...applyBPE(chunk, merges));
            }
        }
        const ids=tokens.map((token)=>this.vocab.tokenToId.get(token)??unkId);
        return {tokens, ids};
    }

    decode(ids:number[]):string{
        const pieces: string[] = [];
        for(const id of ids){
            const tok=this.vocab.idToToken.get(id)??SPECIAL_TOKENS.UNK
            if(Object.values(SPECIAL_TOKENS).some((val)=>val===tok))continue;
            pieces.push(tok);
        }
        // console.log("pieces:", pieces);
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
            // console.log("out:", out);
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

// const charVocab = buildCharVocab([
//   "Hello world, this is Raghav's tokenizer.",
// ]);
// console.log("char vocab size:", charVocab.tokenToId.size);
// console.log("is 'Ġ' its own token?", charVocab.tokenToId.has(SPACE_MARKER));
// console.log("is 'w' its own token?", charVocab.tokenToId.has("w"));
// console.log("is 'Ġw' a token? (should be false)", charVocab.tokenToId.has("Ġw"));

// const charTokenizer = new Tokenizer("char", charVocab); // however you're constructing it

// const text = "Hello world, this is Raghav's tokenizer.";
// const { tokens, ids } = charTokenizer.encode(text);
// console.log("token count:", tokens.length);   // should be much bigger than word mode's 10
// // console.log("CharVocab", charVocab);
// // console.log("Tokens:", tokens);
// // console.log("Token IDs:", ids);
// console.log("decoded:", charTokenizer.decode(ids));
// console.log("exact match:", charTokenizer.decode(ids) === text);

// const { ids: weirdIds } = charTokenizer.encode("Xyzzy?!");
// console.log("any UNK ids?", weirdIds.includes(0)); // 0 = <UNK> id

// const bpeVocab=buildBPEVocab([
//   "the cat sat",
//   "the cat ran",
// ]);
// console.log("wordFreq:", [...wordFreq.entries()]);
// console.log("splits for 'Ġcat':", splits.get("Ġcat"));

// const pairCounts = countPairs(splits, wordFreq);
// console.log("pair counts:", [...pairCounts.entries()]);
// console.log("best pair:", findBestPair(pairCounts));

// const merges = learnMerges(splits, wordFreq, 3);
// console.log("learned merges, in order:", merges);
// console.log("final splits:");
// for (const [word, symbols] of splits) console.log(" ", word, "->", symbols);

// console.log("vocab size:", bpeVocab.tokenToId.size);
// console.log("id of standalone 't':", bpeVocab.tokenToId.get("t"));   // should NOT be undefined
// console.log("id of merged 'the':", bpeVocab.tokenToId.get("the"));

// console.log(applyBPE("sit", [["a","t"], ["t","h"], ["th","e"]]));   // word never seen in training at all
// console.log(applyBPE("Ġhat", [["a","t"], ["t","h"], ["th","e"]]));  // also never seen, but shares a learned pattern

const protectedSet = new Set(DEFAULT_PROTECTED_WORDS.map(w => w.toLowerCase()));

// console.log(isProtectedWord("hi", protectedSet));        // expect true
// console.log(isProtectedWord("Ġhello", protectedSet));     // expect true
// console.log(isProtectedWord("Hi", protectedSet));         // expect true — capital H
// console.log(isProtectedWord("Ġworld", protectedSet));     // expect false
// console.log(isProtectedWord("tokenizer", protectedSet));  // expect false


// const protectedSet = new Set(["hi"]);
const { wordFreq, splits } = buildInitialState([
  "Hi there, this is a tokenizer test.",
  "This tokenizer test covers many common tokenizer words.",
  "Testing tokenizer words repeatedly to dominate the merges.",
], protectedSet);

console.log("initial split for 'Hi':", splits.get("Hi"));  // expect ['Hi'] immediately

learnMerges(splits, wordFreq, 15);

console.log("final split for 'Hi':", splits.get("Hi"));    // expect STILL ['Hi'] — untouched

const merges: [string, string][] = []; // pretend this came from training on totally different text
console.log(applyBPE("hey", merges, new Set(["hey"])));  // expect ["hey"] — untouched, no merges needed
console.log(applyBPE("Hey", merges, new Set(["hey"])));  // capital H — still protected?