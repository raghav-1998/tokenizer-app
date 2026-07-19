"use client"
import { useState } from "react";
import { TokenChip } from "./token-chip";

type Mode="word" | "char" | "bpe";

interface Response{
    tokens: string[];
    ids: number[];
    tokenCount: number;
    vocabSize: number;
}

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "word", label: "Word", hint: "splits on words & punctuation" },
  { value: "char", label: "Character", hint: "splits into individual characters" },
  { value: "bpe", label: "BPE (subword)", hint: "learned merges, common words stay whole" },
];

export default function TokenizerPlayground(){
    const [text, setText]=useState("Hi hello, this is a custom tokenizer.")
    const [mode, setMode]=useState<Mode>("bpe");
    const [loading, setLoading]=useState(false);
    const [error, setError]=useState<string|null>(null)
    const [result, setResult] = useState<{ tokens: string[]; ids: number[], tokenCount: number, vocabSize: number} | null>(null);

    //For Decode section
    const [idsInput, setIdsInput] = useState("");
    const [decodedText, setDecodedText] = useState<string | null>(null);
    const [decodeLoading, setDecodeLoading] = useState(false);
    const [decodeError, setDecodeError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    async function handleTokenize(){
        setLoading(true);
        setError(null);

        try {
            const res=await fetch("/api/tokenize",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({text,mode}),
            });

            const data=await res.json();
            if(!res.ok) throw new Error(data.error ?? "Request failed");
            setResult(data);

        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong.")
        } finally{
            setLoading(false)
        }
    }

    async function handleDecode(){
        setDecodeLoading(true);
        setDecodeError(null);
        setDecodedText(null);

        try {
            const ids=idsInput
            .split(",")
            .map((s)=>s.trim())
            .filter((s)=>s.length>0)
            .map(Number)

            if(ids.some((n)=>Number.isNaN(n))){
                throw new Error("Ids must be a comma-separated list of numbers.")
            }

            const res=await fetch("/api/decode",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({ids,mode})
            });

            const data=await res.json();
            if(!res.ok)throw new Error(data.error ?? "Request failed");
            setDecodedText(data.text)
        } catch (err) {
            setDecodeError(err instanceof Error ? err.message : "Something went wrong.");
        } finally{
            setDecodeLoading(false)
        }
    }

    function copyIds(){
        if(!result)return;
        navigator.clipboard.writeText(result.ids.join(", "));
        setCopied(true);
        setTimeout(()=>setCopied(false), 1500);
    }

    const roundTripMatch = decodedText !== null && decodedText === text;

    return(
        <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-panel p-5">
                <header className="mb-4 flex items-center justify-between">
                    <div className="flex gap-1 rounded-lg bg-panel-alt p-1">
                        {
                            MODES.map((m)=>(
                                <button
                                    key={m.value}
                                    onClick={()=>setMode(m.value)}
                                    className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                                        mode === m.value ? "bg-mint text-bg" : "text-muted hover:text-text"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))
                        }

                    </div>
                </header>
                <textarea 
                value={text} 
                onChange={(e)=>setText(e.target.value)}
                rows={4}
                placeholder="Type something to tokenize..."
                className="w-full resize-none rounded-lg border border-border bg-panel-alt p-3 font-mono text-sm text-text outline-none focus:border-mint"
                />

                <button 
                    onClick={handleTokenize}
                    disabled={loading || text.length===0}
                    className="mt-3 w-full rounded-lg bg-mint py-2 font-mono text-sm font-semibold text-bg transition-opacity disabled:opacity-40"
                >
                    {loading? "Tokenizing..." : "Tokenize"}
                </button>

                {error && <p className="mt-3 text-sm text-danger">{error}</p>}
                {result && (
                    <div className="mt-5 space-y-4">
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                                    Tokens ({result.tokenCount})
                                </span>
                                <span className="font-mono text-xs text-muted">vocab: {result.vocabSize}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.tokens.map((tok, i) => (
                                    <TokenChip key={i} token={tok} id={result.ids[i]} />
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-mono text-xs uppercase tracking-wider text-muted">Token ids</span>
                                <button
                                onClick={copyIds}
                                disabled={!result}
                                className="font-mono text-xs text-mint hover:underline disabled:text-muted disabled:no-underline disabled:cursor-not-allowed"
                                >
                                {copied ? "copied ✓" : "copy"}
                                </button>
                            </div>
                            <code className="block break-all rounded-lg border border-border bg-panel-alt p-3 font-mono text-xs text-amber">
                                {result ? `[${result.ids.join(", ")}]` : "—"}
                            </code>
                        </div>
                    </div>
                    

                    
                )}
            </section>
            
            {/* DECODE PANEL */}
            <section className="rounded-xl border border-border bg-panel p-5">
                <header className="mb-4">
                    <h2 className="font-mono text-sm uppercase tracking-wider text-muted">02. Decode</h2>
                </header>

                <label className="mb-1 block font-mono text-xs text-muted">Token Ids (comma-separated)</label>
                <textarea
                    value={idsInput}
                    onChange={(e) => setIdsInput(e.target.value)}
                    rows={3}
                    placeholder="e.g. 4, 12, 7, 0, 9"
                    className="w-full resize-none rounded-lg border border-border bg-panel-alt p-3 font-mono text-sm text-amber outline-none focus:border-mint"
                />

                <button
                    onClick={handleDecode}
                    disabled={decodeLoading || idsInput.trim().length===0}
                    className="mt-3 w-full rounded-lg border border-mint py-2 font-mono text-sm font-semibold text-mint transition-opacity disabled:opacity-40"
                >
                    {decodeLoading ? "Decoding..." : "Decode ->"}
                </button>

                {decodeError && <p className="mt-3 text-sm text-danger">{decodeError}</p>}


                {
                    decodedText!==null && (
                        <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="font-mono text-xs uppercase tracking-wider text-muted">Decoded Text</span>
                                <span
                                    className={`font-mono text-xs ${roundTripMatch ? "text-mint" : "text-muted"}`}
                                >
                                    {roundTripMatch ? "exact round-trip match ✓" : "-"}
                                </span>
                            </div>
                            <p className="rounded-lg border border-border bg-panel-alt p-3 font-mono text-sm text-text">
                                {decodedText || <span className="text-muted">(empty string)</span>}
                            </p>
                        </div>
                    )
                }
            </section>
        </div>
        

    )
}