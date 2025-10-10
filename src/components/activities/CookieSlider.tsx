/**
 * @component CookieSlider
 * @description Slider ludique pour saisir la durée d'une activité avec visualisation en cookies
 * Chaque tranche de 15 minutes = 1 cookie
 */
import { Slider } from "@/components/ui/slider";
import { PointsVisualization } from "./PointsVisualization";
import { Label } from "@/components/ui/label";

interface CookieSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}

export const CookieSlider = ({ 
  value, 
  onChange, 
  min = 15, 
  max = 480, 
  step = 15,
  label = "Durée",
  className = ""
}: CookieSliderProps) => {
  // Convertir la durée en "cookies" pour la visualisation (1 cookie = 15 min)
  const cookies = Math.floor(value / 15);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {formatDuration(value)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={step}
          className="cursor-pointer"
        />
        
        <div className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 min-h-[60px]">
          <div className="flex items-center gap-2">
            <PointsVisualization points={cookies} size="lg" animated={true} />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{formatDuration(min)}</span>
        <span>{formatDuration(max)}</span>
      </div>
    </div>
  );
};
