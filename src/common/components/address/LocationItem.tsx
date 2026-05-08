import { LocationItemProps } from "./types/location";

const LocationItem = ({ name, onClick }: LocationItemProps) => {
  return (
    <div className="p-3 hover:bg-gray-100 cursor-pointer" onClick={onClick}>
      {name}
    </div>
  );
};

export default LocationItem;
