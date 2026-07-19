import Image from "next/image";
import { TokenChip } from "@/components/token-chip";
import TokenizerPlayground from "@/components/tokenizer-playground";

export default function Home() {
  return (
    // className="p-10 bg-[#0A0E17] min-h-screen"
    <main className="p-10 bg-[#0A0E17] min-h-screen">
      <TokenizerPlayground/>
    </main>
  )
}
