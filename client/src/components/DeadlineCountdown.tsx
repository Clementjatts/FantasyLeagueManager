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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <CardTitle>Next Deadline</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-2xl font-bold">{timeLeft.days}</div>
            <div className="text-xs text-muted-foreground">Days</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{timeLeft.hours}</div>
            <div className="text-xs text-muted-foreground">Hours</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{timeLeft.minutes}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{timeLeft.seconds}</div>
            <div className="text-xs text-muted-foreground">Seconds</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
