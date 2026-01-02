import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, Cpu, History, Zap } from "lucide-react";

export default function Tutorial() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      <Header />
      
      <main className="flex-1 max-w-5xl mx-auto p-8 w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Master the Game
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Learn how to use our advanced analysis tools to improve your chess skills.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <TutorialCard 
            icon={<Cpu className="w-8 h-8 text-primary" />}
            title="Engine Analysis"
            description="Our Stockfish 10 integration provides real-time evaluation of your position. The evaluation bar shows who is winning, and the 'Best Move' indicator helps you find the optimal continuation."
          />
          <TutorialCard 
            icon={<History className="w-8 h-8 text-accent" />}
            title="Opening Explorer"
            description="Access the Lichess Masters database to see how top players handle your current position. View win rates and frequency to choose the most principled moves."
          />
          <TutorialCard 
            icon={<Brain className="w-8 h-8 text-purple-500" />}
            title="AI Opponent"
            description="Practice against the AI with 3 difficulty levels. 'Beginner' makes frequent mistakes, while 'Grandmaster' plays near-perfectly using deep search."
          />
          <TutorialCard 
            icon={<Zap className="w-8 h-8 text-yellow-500" />}
            title="Self-Play Mode"
            description="Watch the engine play against itself to understand advanced patterns and endgame techniques. You can pause and resume the auto-play at any time."
          />
        </div>
      </main>
    </div>
  );
}

function TutorialCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="glass-panel border-white/5">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle className="font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
