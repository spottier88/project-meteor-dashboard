/**
 * @component PointsCookieSlider
 * @description Slider ludique pour saisir des points avec visualisation en cookies
 * Ratio : 1 point = 1 cookie
 */
import { Slider } from "@/components/ui/slider";
import { PointsVisualization } from "./PointsVisualization";
import { Label } from "@/components/ui/label";

interface PointsCookieSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export const PointsCookieSlider = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 100,
  label = "Nombre de points",
  className = ""
}: PointsCookieSliderProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">
            {value} point{value > 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={min}
          max={max}
          step={1}
          className="cursor-pointer"
        />
        
        <div className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 min-h-[60px]">
          <div className="flex items-center gap-2">
            <PointsVisualization points={value} size="lg" animated={true} />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{min} pt{min > 1 ? 's' : ''}</span>
        <span>{max} pt{max > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};
