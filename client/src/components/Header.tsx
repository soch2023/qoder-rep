import { Link, useLocation } from "wouter";
import { Crown, Settings, BarChart2, BookOpen } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

export function Header() {
  const [location] = useLocation();
  const { settings, updateSettings } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    updateSettings({
      ...settings,
      [key]: !settings[key as boolean],
    });
  };

  return (
    <header className="glass-header w-full px-4 py-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300">
      <div className="flex items-center gap-8 w-full md:w-auto justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Chess.replit</span>
        </Link>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <Link href="/" className={location === "/" ? "text-primary" : ""}>Play</Link>
          <Link href="/features" className={location === "/features" ? "text-primary" : ""}>Features</Link>
        </nav>
      </div>

      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link href="/" className={`hover:text-primary transition-colors ${location === "/" ? "text-primary" : ""}`}>
          Play
        </Link>
        <Link href="/tutorial" className={`hover:text-primary transition-colors ${location === "/tutorial" ? "text-primary" : ""}`}>
          Tutorial
        </Link>
        <Link href="/features" className={`hover:text-primary transition-colors ${location === "/features" ? "text-primary" : ""}`}>
          Features
        </Link>
      </nav>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        {/* Global Toggles */}
        <div className="flex items-center gap-2 bg-secondary/50 p-1.5 rounded-full border border-white/5">
          <ToggleBtn 
            active={settings.toggleLocalTwoPlayer} 
            onClick={() => handleToggle('toggleLocalTwoPlayer')}
            label="Local"
            icon={<Settings className="w-3 h-3" />}
          />
          <ToggleBtn 
            active={settings.toggleVsAI} 
            onClick={() => handleToggle('toggleVsAI')}
            label="Vs AI"
            icon={<BarChart2 className="w-3 h-3" />}
          />
          <ToggleBtn 
            active={settings.toggleAIVSAI} 
            onClick={() => handleToggle('toggleAIVSAI')}
            label="AI vs AI"
            icon={<BookOpen className="w-3 h-3" />}
          />
        </div>
      </div>
    </header>
  );
}

function ToggleBtn({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200
        ${active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
