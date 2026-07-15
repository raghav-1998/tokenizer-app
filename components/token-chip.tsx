const SPACE_MARKER = "Ġ";

function hashHue(token:string):number{
    let hash=0;
    for(let i=0;i<token.length;i++){
        hash=(hash*31+token.charCodeAt(i))>>>0
    }
    return hash%360;
}

export function TokenChip({token,id}:{token: string; id: number}){
    const isUnk=token==="<UNK>";
    const display=token.startsWith(SPACE_MARKER)
        ?"\u2423"+token.slice(SPACE_MARKER.length)
        :token;
    
    const hue=hashHue(token);

    const style=isUnk
        ? {background: "rgba(248,113,113,0.12)", borderColor: "rgba(248,113,113,0.5)", color: "#F87171"}
        :{
            background: `hsla(${hue}, 55%, 20%, 0.6)`,
            borderColor: `hsla(${hue}, 55%, 45%, 0.6)`,
            color: `hsla(${hue}, 70%, 85%, 1)`,
        };
    
    return(
        <div
            className="flex flex-col items-center rounded-md border px-2 py-1 font-mono text-xs leading-tight transition-transform hover:-translate-y-0.5"
            style={style}
            title={`token: "${token}" · id: ${id}`}
        >
            <span className="max-w-[12ch] truncate">{display === "" ? "\u00A0" : display}</span>
            <span className="mt-0.5 text-[10px] text-muted">{id}</span>
        </div>
    )
}
console.log(hashHue("hello"));
console.log(hashHue("hello")); // must be IDENTICAL to the line above
console.log(hashHue("world"));
console.log(hashHue(""));      // edge case: empty string   