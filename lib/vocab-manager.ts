import {createTokenizer, Tokenizer, TokenizerMode} from './tokenizer';
import { DEFAULT_CORPUS } from "./corpus";


const cache=new Map<TokenizerMode, Tokenizer>();

export function getTokenizer(mode:TokenizerMode):Tokenizer{
    const cached=cache.get(mode);
    if(cached){
        return cached;
    }

    const tokenizer=createTokenizer(mode, DEFAULT_CORPUS, {numMerges:300});
    cache.set(mode, tokenizer);
    return tokenizer
}

export function isValidMode(mode: unknown): mode is TokenizerMode {
  return mode === "word" || mode === "char" || mode === "bpe";
}


const t1 = getTokenizer("word");
const t2 = getTokenizer("word");
console.log("same instance?", t1 === t2);