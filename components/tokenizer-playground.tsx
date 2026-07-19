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
    const [result, setResult] = useState<{ tokens: string[]; ids: number[] } | null>(null);

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
                    <div className="flex flex-wrap gap-1.5">
                        {result.tokens.map((tok, i) => (
                            <TokenChip key={i} token={tok} id={result.ids[i]} />
                        ))}
                    </div>
                )}
            </section>
            
        </div>
        

    )
}