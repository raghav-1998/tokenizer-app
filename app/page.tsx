import Image from "next/image";
import { TokenChip } from "@/components/token-chip";

export default function Home() {
  return (
    <main className="p-10 bg-[#0A0E17] min-h-screen">
      <div className="flex gap-2 flex-wrap">
        <TokenChip token="hello" id={4} />
        <TokenChip token="hello" id={4} />   {/* same token — should match color */}
        <TokenChip token="world" id={5} />   {/* different token — different color */}
        <TokenChip token="Ġworld" id={6} />  {/* should show a visible space glyph */}
        <TokenChip token="<UNK>" id={0} />   {/* should look visually distinct */}
      </div>
    </main>
  )
}
