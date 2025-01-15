import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OrganizationFieldsSelectsProps {
  poleId: string;
  setPoleId: (value: string) => void;
  directionId: string;
  setDirectionId: (value: string) => void;
  serviceId: string;
  setServiceId: (value: string) => void;
  poles: any[];
  directions: any[];
  services: any[];
  isLoadingPoles: boolean;
  isLoadingDirections: boolean;
  isLoadingServices: boolean;
}

export const OrganizationFieldsSelects = ({
  poleId,
  setPoleId,
  directionId,
  setDirectionId,
  serviceId,
  setServiceId,
  poles,
  directions,
  services,
  isLoadingPoles,
  isLoadingDirections,
  isLoadingServices,
}: OrganizationFieldsSelectsProps) => {
  const handlePoleChange = (value: string) => {
    setPoleId(value);
    setDirectionId("none");
    setServiceId("none");
  };

  const handleDirectionChange = (value: string) => {
    setDirectionId(value);
    setServiceId("none");
  };

  if (isLoadingPoles || isLoadingDirections || isLoadingServices) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="grid gap-4">
      <label className="text-sm font-medium">Organisation</label>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="pole">Pôle</Label>
          <Select value={poleId} onValueChange={handlePoleChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {poles?.map((pole) => (
                <SelectItem key={pole.id} value={pole.id}>
                  {pole.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="direction">Direction</Label>
          <Select 
            value={directionId} 
            onValueChange={handleDirectionChange}
            disabled={!poleId || poleId === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {directions.map((direction) => (
                <SelectItem key={direction.id} value={direction.id}>
                  {direction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="service">Service</Label>
          <Select 
            value={serviceId} 
            onValueChange={setServiceId}
            disabled={!directionId || directionId === "none"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};