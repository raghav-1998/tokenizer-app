import { describe, expect, it } from "vitest";
import { createTokenizer } from "./tokenizer";

describe("smoke test",()=>{
    it("can create a word-mode tokenizer and encode something", ()=>{
        const tokenizer=createTokenizer("word", ["hello world"]);
        const {tokens}=tokenizer.encode("hello");
        expect(tokens).toEqual(["hello"]);
    });
});