import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface DeadlineCountdownProps {
  deadline: string;
}

export function DeadlineCountdown({ deadline }: DeadlineCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadlineTime = new Date(deadline).getTime();
      const now = new Date().getTime();
      const difference = deadlineTime - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <Card className="group border border-glass-border bg-glass-bg backdrop-blur-xl shadow-glass">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Next Deadline</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          <TimePill value={timeLeft.days} label="Days" />
          <TimePill value={timeLeft.hours} label="Hours" />
          <TimePill value={timeLeft.minutes} label="Minutes" />
          <TimePill value={timeLeft.seconds} label="Seconds" />
        </div>
      </CardContent>
    </Card>
  );
}

function TimePill({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-glass-border/60 bg-primary/5 px-3 py-2 text-center group-hover:border-primary/30 transition-colors">
      <div className="text-3xl font-extrabold tabular-nums tracking-tight">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
