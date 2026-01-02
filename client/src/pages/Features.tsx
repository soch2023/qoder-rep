import { Header } from "@/components/Header";
import { Check } from "lucide-react";

export default function Features() {
  const features = [
    "Stockfish 10 WASM Engine Integration",
    "Real-time Centipawn Evaluation Bar",
    "Lichess Masters Opening Explorer",
    "3 Game Modes: Local, Vs AI, AI vs AI",
    "Adjustable Engine Difficulty",
    "Move History & PGN Export (Coming Soon)",
    "Dark Mode Optimized UI",
    "Responsive Mobile Design",
    "System Health Self-Validation"
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      <Header />
      
      <main className="flex-1 max-w-4xl mx-auto p-8 w-full flex flex-col justify-center">
        <h1 className="text-4xl font-display font-bold mb-8">Feature List</h1>
        
        <div className="bg-card rounded-2xl border border-white/5 p-8 shadow-2xl">
           <ul className="space-y-4">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-lg">{feature}</span>
                </li>
              ))}
           </ul>
        </div>

        <div className="mt-12 text-center text-muted-foreground">
           <p>Version 1.0.0 • Built with React, Vite & Stockfish</p>
        </div>
      </main>
    </div>
  );
}
